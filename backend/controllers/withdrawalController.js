import asyncHandler from "express-async-handler";
import Withdrawal from "../models/withdrawalModel.js";
import User from "../models/userModel.js";
import UserTrade from "../models/userTradeModel.js";
import { sendWithdrawalEmail } from "../utils/emailService.js";

const calculateWithdrawableProfit = async (userId) => {
  const completedTrades = await UserTrade.find({
    user: userId,
    status: "completed",
  }).select("profit loss");

  const totalTradeProfit = completedTrades.reduce(
    (sum, trade) => sum + Number(trade.profit || 0),
    0
  );

  const totalTradeLoss = completedTrades.reduce(
    (sum, trade) => sum + Number(trade.loss || 0),
    0
  );

  const approvedOrPaidWithdrawals = await Withdrawal.find({
    user: userId,
    status: { $in: ["approved", "paid"] },
  }).select("amount");

  const totalProcessedWithdrawals = approvedOrPaidWithdrawals.reduce(
    (sum, withdrawal) => sum + Number(withdrawal.amount || 0),
    0
  );

  const withdrawableProfit =
    totalTradeProfit - totalTradeLoss - totalProcessedWithdrawals;

  return {
    totalTradeProfit,
    totalTradeLoss,
    totalProcessedWithdrawals,
    withdrawableProfit: Math.max(0, withdrawableProfit),
  };
};

// @desc    Submit withdrawal request
// @route   POST /api/withdrawal
// @access  Private
const submitWithdrawal = asyncHandler(async (req, res) => {
  const user = req.user;
  const { amount, coinType, walletAddress, network } = req.body;

  if (!amount || !coinType || !walletAddress || !network) {
    res.status(400);
    throw new Error("Amount, coin type, wallet address, and network are required");
  }

  const numericAmount = Number(amount);

  if (Number.isNaN(numericAmount) || numericAmount <= 0) {
    res.status(400);
    throw new Error("Withdrawal amount must be greater than 0");
  }

  const pendingWithdrawal = await Withdrawal.findOne({
    user: user._id,
    status: "pending",
  });

  if (pendingWithdrawal) {
    res.status(400);
    throw new Error("You already have a pending withdrawal request");
  }

  const { withdrawableProfit } = await calculateWithdrawableProfit(user._id);

  if (withdrawableProfit <= 0) {
    res.status(400);
    throw new Error("You do not have withdrawable profit available at this time");
  }

  if (numericAmount > withdrawableProfit) {
    res.status(400);
    throw new Error(
      "This withdrawal amount exceeds your withdrawable profit. Only realized net profit is available for withdrawal, while your principal capital remains engaged in active trading."
    );
  }

  if (numericAmount > Number(user.balance || 0)) {
    res.status(400);
    throw new Error("Insufficient account balance");
  }

  const withdrawal = await Withdrawal.create({
    user: user._id,
    amount: numericAmount,
    coinType,
    walletAddress,
    network,
    status: "pending",
  });

  try {
    await sendWithdrawalEmail({
      to: user.email,
      fullName: user.fullName,
      type: "submitted",
      amount: numericAmount,
      coinType,
      walletAddress,
      network,
    });
  } catch (error) {
    console.error("Failed to send withdrawal submission email:", error);
  }

  res.status(201).json({
    success: true,
    message: "Withdrawal request submitted successfully",
    data: withdrawal,
    availableProfit: withdrawableProfit,
  });
});

// @desc    Get my withdrawals
// @route   GET /api/withdrawal/me
// @access  Private
const getMyWithdrawals = asyncHandler(async (req, res) => {
  const withdrawals = await Withdrawal.find({ user: req.user._id }).sort("-createdAt");

  const {
    totalTradeProfit,
    totalTradeLoss,
    totalProcessedWithdrawals,
    withdrawableProfit,
  } = await calculateWithdrawableProfit(req.user._id);

  res.status(200).json({
    success: true,
    count: withdrawals.length,
    availableProfit: withdrawableProfit,
    stats: {
      totalTradeProfit,
      totalTradeLoss,
      totalProcessedWithdrawals,
      withdrawableProfit,
    },
    data: withdrawals,
  });
});

// @desc    Get withdrawal by ID
// @route   GET /api/withdrawal/:id
// @access  Private
const getWithdrawalById = asyncHandler(async (req, res) => {
  const withdrawal = await Withdrawal.findById(req.params.id);

  if (!withdrawal) {
    res.status(404);
    throw new Error("Withdrawal not found");
  }

  if (
    withdrawal.user.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    res.status(403);
    throw new Error("Not authorized to view this withdrawal");
  }

  res.status(200).json({
    success: true,
    data: withdrawal,
  });
});

// @desc    Get all withdrawals
// @route   GET /api/withdrawal/admin/all
// @access  Private/Admin
const getAllWithdrawals = asyncHandler(async (req, res) => {
  const { status } = req.query;

  const filter = {};
  if (status) filter.status = status;

  const withdrawals = await Withdrawal.find(filter)
    .populate("user", "fullName email phoneNumber balance totalProfit totalWithdrawal")
    .populate("reviewedBy", "fullName email")
    .sort("-createdAt");

  const stats = {
    total: withdrawals.length,
    pending: withdrawals.filter((w) => w.status === "pending").length,
    approved: withdrawals.filter((w) => w.status === "approved").length,
    paid: withdrawals.filter((w) => w.status === "paid").length,
    rejected: withdrawals.filter((w) => w.status === "rejected").length,
    totalAmount: withdrawals.reduce((sum, w) => sum + Number(w.amount || 0), 0),
  };

  res.status(200).json({
    success: true,
    stats,
    count: withdrawals.length,
    data: withdrawals,
  });
});

// @desc    Approve withdrawal
// @route   POST /api/withdrawal/admin/:id/approve
// @access  Private/Admin
const approveWithdrawal = asyncHandler(async (req, res) => {
  const withdrawal = await Withdrawal.findById(req.params.id).populate("user");

  if (!withdrawal) {
    res.status(404);
    throw new Error("Withdrawal not found");
  }

  if (withdrawal.status === "approved") {
    res.status(400);
    throw new Error("Withdrawal has already been approved");
  }

  if (withdrawal.status === "paid") {
    res.status(400);
    throw new Error("Withdrawal has already been marked as paid");
  }

  if (withdrawal.status === "rejected") {
    res.status(400);
    throw new Error("Rejected withdrawal cannot be approved");
  }

  const user = await User.findById(withdrawal.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const { withdrawableProfit } = await calculateWithdrawableProfit(user._id);

  if (withdrawal.amount > withdrawableProfit) {
    res.status(400);
    throw new Error("User no longer has enough withdrawable profit");
  }

  if (withdrawal.amount > Number(user.balance || 0)) {
    res.status(400);
    throw new Error("User balance is too low for this withdrawal");
  }

  withdrawal.status = "approved";
  withdrawal.reviewedBy = req.admin._id;
  withdrawal.reviewedAt = new Date();
  withdrawal.rejectionReason = null;
  await withdrawal.save();

  user.totalWithdrawal = Number(user.totalWithdrawal || 0) + Number(withdrawal.amount || 0);
  user.balance = Number(user.balance || 0) - Number(withdrawal.amount || 0);
  await user.save();

  let emailSent = false;
  try {
    await sendWithdrawalEmail({
      to: user.email,
      fullName: user.fullName,
      type: "approved",
      amount: withdrawal.amount,
      coinType: withdrawal.coinType,
      walletAddress: withdrawal.walletAddress,
      network: withdrawal.network,
    });
    emailSent = true;
  } catch (error) {
    console.error("Failed to send withdrawal approval email:", error);
  }

  const recalculated = await calculateWithdrawableProfit(user._id);

  res.status(200).json({
    success: true,
    message: "Withdrawal approved successfully",
    emailSent,
    data: {
      withdrawal,
      user: {
        id: user._id,
        balance: user.balance,
        totalProfit: user.totalProfit,
        totalWithdrawal: user.totalWithdrawal,
        availableProfit: recalculated.withdrawableProfit,
      },
    },
  });
});

// @desc    Mark withdrawal as paid
// @route   POST /api/withdrawal/admin/:id/paid
// @access  Private/Admin
const markWithdrawalAsPaid = asyncHandler(async (req, res) => {
  const withdrawal = await Withdrawal.findById(req.params.id).populate("user");

  if (!withdrawal) {
    res.status(404);
    throw new Error("Withdrawal not found");
  }

  if (withdrawal.status === "pending") {
    res.status(400);
    throw new Error("Approve the withdrawal before marking it as paid");
  }

  if (withdrawal.status === "rejected") {
    res.status(400);
    throw new Error("Rejected withdrawal cannot be marked as paid");
  }

  if (withdrawal.status === "paid") {
    res.status(400);
    throw new Error("Withdrawal has already been marked as paid");
  }

  // IMPORTANT:
  // Do NOT deduct balance here again.
  // Deduction already happened at approval.
  withdrawal.status = "paid";
  withdrawal.paidAt = new Date();

  await withdrawal.save();

  let emailSent = false;
  try {
    await sendWithdrawalEmail({
      to: withdrawal.user.email,
      fullName: withdrawal.user.fullName,
      type: "paid",
      amount: withdrawal.amount,
      coinType: withdrawal.coinType,
      walletAddress: withdrawal.walletAddress,
      network: withdrawal.network,
    });
    emailSent = true;
  } catch (error) {
    console.error("Failed to send withdrawal paid email:", error);
  }

  res.status(200).json({
    success: true,
    message: "Withdrawal marked as paid successfully",
    emailSent,
    data: withdrawal,
  });
});

// @desc    Reject withdrawal
// @route   POST /api/withdrawal/admin/:id/reject
// @access  Private/Admin
const rejectWithdrawal = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  if (!reason) {
    res.status(400);
    throw new Error("Rejection reason is required");
  }

  const withdrawal = await Withdrawal.findById(req.params.id).populate("user");

  if (!withdrawal) {
    res.status(404);
    throw new Error("Withdrawal not found");
  }

  if (withdrawal.status === "approved") {
    res.status(400);
    throw new Error("Approved withdrawal cannot be rejected");
  }

  if (withdrawal.status === "paid") {
    res.status(400);
    throw new Error("Paid withdrawal cannot be rejected");
  }

  if (withdrawal.status === "rejected") {
    res.status(400);
    throw new Error("Withdrawal has already been rejected");
  }

  withdrawal.status = "rejected";
  withdrawal.reviewedBy = req.admin._id;
  withdrawal.reviewedAt = new Date();
  withdrawal.rejectionReason = reason;

  await withdrawal.save();

  let emailSent = false;
  try {
    await sendWithdrawalEmail({
      to: withdrawal.user.email,
      fullName: withdrawal.user.fullName,
      type: "rejected",
      amount: withdrawal.amount,
      coinType: withdrawal.coinType,
      walletAddress: withdrawal.walletAddress,
      network: withdrawal.network,
      reason,
    });
    emailSent = true;
  } catch (error) {
    console.error("Failed to send withdrawal rejection email:", error);
  }

  res.status(200).json({
    success: true,
    message: "Withdrawal rejected",
    emailSent,
    data: withdrawal,
  });
});

// @desc    Get withdrawal stats
// @route   GET /api/withdrawal/admin/stats
// @access  Private/Admin
const getWithdrawalStats = asyncHandler(async (req, res) => {
  const stats = await Withdrawal.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalAmount: { $sum: "$amount" },
      },
    },
  ]);

  const pending = stats.find((s) => s._id === "pending") || {
    count: 0,
    totalAmount: 0,
  };
  const approved = stats.find((s) => s._id === "approved") || {
    count: 0,
    totalAmount: 0,
  };
  const paid = stats.find((s) => s._id === "paid") || {
    count: 0,
    totalAmount: 0,
  };
  const rejected = stats.find((s) => s._id === "rejected") || {
    count: 0,
    totalAmount: 0,
  };

  res.status(200).json({
    success: true,
    stats: {
      pending: { count: pending.count, amount: pending.totalAmount },
      approved: { count: approved.count, amount: approved.totalAmount },
      paid: { count: paid.count, amount: paid.totalAmount },
      rejected: { count: rejected.count, amount: rejected.totalAmount },
      total: {
        count: pending.count + approved.count + paid.count + rejected.count,
        amount:
          pending.totalAmount +
          approved.totalAmount +
          paid.totalAmount +
          rejected.totalAmount,
      },
    },
  });
});

export {
  submitWithdrawal,
  getMyWithdrawals,
  getWithdrawalById,
  getAllWithdrawals,
  approveWithdrawal,
  markWithdrawalAsPaid,
  rejectWithdrawal,
  getWithdrawalStats,
};