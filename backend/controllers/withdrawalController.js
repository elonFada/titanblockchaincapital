import asyncHandler from "express-async-handler";
import Withdrawal from "../models/withdrawalModel.js";
import User from "../models/userModel.js";
import { sendWithdrawalEmail } from "../utils/emailService.js";

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

  if (numericAmount <= 0) {
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

  const availableProfit = (user.totalProfit || 0) - (user.totalWithdrawal || 0);

  if (availableProfit <= 0) {
    res.status(400);
    throw new Error("You do not have withdrawable profit yet");
  }

  if (numericAmount > availableProfit) {
    res.status(400);
    throw new Error(`You can only withdraw from profit. Available profit: $${availableProfit.toFixed(2)}`);
  }

  if (numericAmount > (user.balance || 0)) {
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

  // Send email notification for withdrawal request
  try {
    await sendWithdrawalEmail({
      to: user.email,
      fullName: user.fullName,
      type: 'submitted',
      amount: numericAmount,
      coinType,
      walletAddress,
      network
    });
  } catch (error) {
    console.error('Failed to send withdrawal submission email:', error);
  }

  res.status(201).json({
    success: true,
    message: "Withdrawal request submitted successfully",
    data: withdrawal,
    availableProfit,
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

  if (withdrawal.status === "rejected") {
    res.status(400);
    throw new Error("Rejected withdrawal cannot be approved");
  }

  const user = await User.findById(withdrawal.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const availableProfit = (user.totalProfit || 0) - (user.totalWithdrawal || 0);

  if (withdrawal.amount > availableProfit) {
    res.status(400);
    throw new Error("User no longer has enough withdrawable profit");
  }

  if (withdrawal.amount > (user.balance || 0)) {
    res.status(400);
    throw new Error("User balance is too low for this withdrawal");
  }

  withdrawal.status = "approved";
  withdrawal.reviewedBy = req.admin._id;
  withdrawal.reviewedAt = new Date();
  withdrawal.rejectionReason = null;
  await withdrawal.save();

  user.totalWithdrawal = (user.totalWithdrawal || 0) + withdrawal.amount;
  user.balance = (user.balance || 0) - withdrawal.amount;
  await user.save();

  // Send approval email notification
  let emailSent = false;
  try {
    await sendWithdrawalEmail({
      to: user.email,
      fullName: user.fullName,
      type: 'approved',
      amount: withdrawal.amount,
      coinType: withdrawal.coinType,
      walletAddress: withdrawal.walletAddress,
      network: withdrawal.network
    });
    emailSent = true;
  } catch (error) {
    console.error('Failed to send withdrawal approval email:', error);
  }

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
        availableProfit: (user.totalProfit || 0) - (user.totalWithdrawal || 0),
      },
    },
  });
});

// @desc    Get my withdrawals
// @route   GET /api/withdrawal/me
// @access  Private
const getMyWithdrawals = asyncHandler(async (req, res) => {
  const withdrawals = await Withdrawal.find({ user: req.user._id }).sort("-createdAt");

  const availableProfit =
    (req.user.totalProfit || 0) - (req.user.totalWithdrawal || 0);

  res.status(200).json({
    success: true,
    count: withdrawals.length,
    availableProfit,
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

// ==================== ADMIN ====================

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
    rejected: withdrawals.filter((w) => w.status === "rejected").length,
    totalAmount: withdrawals
      .filter((w) => w.status === "approved")
      .reduce((sum, w) => sum + w.amount, 0),
  };

  res.status(200).json({
    success: true,
    stats,
    count: withdrawals.length,
    data: withdrawals,
  });
});

// @desc    Reject withdrawal
// @route   POST /api/withdrawal/admin/:id/reject
// @access  Private/Admin
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

  if (withdrawal.status === "rejected") {
    res.status(400);
    throw new Error("Withdrawal has already been rejected");
  }

  withdrawal.status = "rejected";
  withdrawal.reviewedBy = req.admin._id;
  withdrawal.reviewedAt = new Date();
  withdrawal.rejectionReason = reason;
  await withdrawal.save();

  // Send rejection email notification
  let emailSent = false;
  try {
    await sendWithdrawalEmail({
      to: withdrawal.user.email,
      fullName: withdrawal.user.fullName,
      type: 'rejected',
      amount: withdrawal.amount,
      coinType: withdrawal.coinType,
      walletAddress: withdrawal.walletAddress,
      network: withdrawal.network,
      reason: reason
    });
    emailSent = true;
  } catch (error) {
    console.error('Failed to send withdrawal rejection email:', error);
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
  const rejected = stats.find((s) => s._id === "rejected") || {
    count: 0,
    totalAmount: 0,
  };

  res.status(200).json({
    success: true,
    stats: {
      pending: { count: pending.count, amount: pending.totalAmount },
      approved: { count: approved.count, amount: approved.totalAmount },
      rejected: { count: rejected.count, amount: rejected.totalAmount },
      total: {
        count: pending.count + approved.count + rejected.count,
        amount:
          pending.totalAmount + approved.totalAmount + rejected.totalAmount,
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
  rejectWithdrawal,
  getWithdrawalStats,
};