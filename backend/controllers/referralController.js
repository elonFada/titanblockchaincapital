import asyncHandler from "express-async-handler";
import crypto from "crypto";
import User from "../models/userModel.js";
import ReferralWithdrawal from "../models/referralWithdrawalModel.js";
import {
  sendReferralRewardEmail,
  sendReferralWithdrawalEmail,
} from "../utils/emailService.js";

// Generate unique referral code
const generateUniqueReferralCode = async () => {
  let code;
  let isUnique = false;

  while (!isUnique) {
    code = crypto.randomBytes(4).toString("hex").toUpperCase();
    const existingUser = await User.findOne({ referralCode: code });
    if (!existingUser) isUnique = true;
  }

  return code;
};

const getPendingReferralWithdrawalAmount = async (userId) => {
  const result = await ReferralWithdrawal.aggregate([
    {
      $match: {
        user: userId,
        status: "pending",
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$amount" },
      },
    },
  ]);

  return result[0]?.total || 0;
};

const getAvailableReferralBalance = async (user) => {
  const totalEarned = Number(user.referralEarnings || 0);
  const totalWithdrawn = Number(user.referralCommissionPaid || 0);
  const pendingWithdrawalAmount = await getPendingReferralWithdrawalAmount(user._id);

  return totalEarned - totalWithdrawn - pendingWithdrawalAmount;
};

// @desc    Generate referral code for authenticated user
// @route   POST /api/referral/generate-code
// @access  Private
const generateReferralCode = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (user.referralCode) {
    return res.status(200).json({
      status: "success",
      message: "Referral code already exists",
      referralCode: user.referralCode,
      referralLink: `${process.env.FRONTEND_URL}/register.html?ref=${user.referralCode}`,
    });
  }

  const referralCode = await generateUniqueReferralCode();
  user.referralCode = referralCode;
  await user.save();

  res.status(200).json({
    status: "success",
    message: "Referral code generated successfully",
    referralCode: user.referralCode,
    referralLink: `${process.env.FRONTEND_URL}/register.html?ref=${user.referralCode}`,
  });
});

// @desc    Get user's referral statistics
// @route   GET /api/referral/stats
// @access  Private
const getReferralStats = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate(
    "referrals.user",
    "fullName email createdAt"
  );

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const totalReferrals = user.referrals.length;
  const paidReferrals = user.referrals.filter(
    (ref) => ref.paidRegistrationFee === true
  ).length;
  const approvedReferrals = user.referrals.filter(
    (ref) => ref.approvedAt !== null
  ).length;

  const commissionEarned = Number(user.referralEarnings || 0);
  const commissionPaid = Number(user.referralCommissionPaid || 0);
  const pendingWithdrawalAmount = await getPendingReferralWithdrawalAmount(user._id);
  const availableReferralBalance =
    commissionEarned - commissionPaid - pendingWithdrawalAmount;

  res.status(200).json({
    status: "success",
    data: {
      referralCode: user.referralCode,
      referralLink: `${process.env.FRONTEND_URL}/register.html?ref=${user.referralCode}`,
      stats: {
        totalReferrals,
        paidReferrals,
        approvedReferrals,
        commissionEarned,
        commissionPaid,
        pendingWithdrawalAmount,
        availableReferralBalance,
      },
      referrals: user.referrals.map((ref) => ({
        userId: ref.user?._id || ref.user,
        fullName: ref.user?.fullName || null,
        email: ref.user?.email || null,
        registeredAt: ref.registeredAt,
        paidRegistrationFee: ref.paidRegistrationFee,
        approvedAt: ref.approvedAt,
        commissionPaid: ref.commissionPaid,
        commissionAmount: ref.commissionAmount,
      })),
    },
  });
});

// @desc    Get leaderboard of top referrers
// @route   GET /api/referral/leaderboard
// @access  Public
const getReferralLeaderboard = asyncHandler(async (req, res) => {
  const topReferrers = await User.find({
    referralEarnings: { $gt: 0 },
  })
    .select("fullName referralEarnings referralCommissionPaid referralCode")
    .sort("-referralEarnings")
    .limit(10);

  res.status(200).json({
    status: "success",
    data: topReferrers,
  });
});

// @desc    Request withdrawal of referral earnings
// @route   POST /api/referral/withdraw
// @access  Private
const requestReferralWithdrawal = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (!user.isVerified) {
    res.status(403);
    throw new Error("Please verify your account first");
  }

  if (!user.isActive) {
    res.status(403);
    throw new Error("Your account is inactive");
  }

  if (!user.withdrawalWalletType || !user.withdrawalWalletAddress) {
    res.status(400);
    throw new Error("Please add your withdrawal wallet in profile first");
  }

  const amount = Number(Number(req.body.amount).toFixed(2));

  if (!amount || Number.isNaN(amount) || amount <= 0) {
    res.status(400);
    throw new Error("Please provide a valid withdrawal amount");
  }

  const availableReferralBalance = await getAvailableReferralBalance(user);

  if (amount > availableReferralBalance) {
    res.status(400);
    throw new Error(
      `Insufficient referral balance. Available balance is $${availableReferralBalance.toFixed(2)}`
    );
  }

  const withdrawal = await ReferralWithdrawal.create({
    user: user._id,
    amount,
    walletType: user.withdrawalWalletType,
    walletAddress: user.withdrawalWalletAddress,
    status: "pending",
  });

  await sendReferralWithdrawalEmail({
    to: user.email,
    fullName: user.fullName,
    type: "submitted",
    amount,
    walletType: user.withdrawalWalletType,
    walletAddress: user.withdrawalWalletAddress,
  });

  res.status(201).json({
    status: "success",
    message: "Referral withdrawal request submitted successfully",
    data: withdrawal,
  });
});

// @desc    Get my referral withdrawals
// @route   GET /api/referral/withdrawals/me
// @access  Private
const getMyReferralWithdrawals = asyncHandler(async (req, res) => {
  const withdrawals = await ReferralWithdrawal.find({
    user: req.user._id,
  }).sort("-createdAt");

  res.status(200).json({
    status: "success",
    count: withdrawals.length,
    data: withdrawals,
  });
});

// @desc    Get all referral withdrawal requests
// @route   GET /api/referral/withdrawals
// @access  Private/Admin
const getReferralWithdrawals = asyncHandler(async (req, res) => {
  const { status } = req.query;

  const filter = {};
  if (status) filter.status = status;

  const withdrawals = await ReferralWithdrawal.find(filter)
    .populate("user", "fullName email referralEarnings referralCommissionPaid withdrawalWalletType withdrawalWalletAddress")
    .populate("reviewedBy", "fullName email")
    .sort("-createdAt");

  res.status(200).json({
    status: "success",
    count: withdrawals.length,
    data: withdrawals,
  });
});

// @desc    Mark referral withdrawal as paid
// @route   POST /api/referral/withdrawals/:id/pay
// @access  Private/Admin
const payReferralWithdrawal = asyncHandler(async (req, res) => {
  const withdrawal = await ReferralWithdrawal.findById(req.params.id).populate("user");

  if (!withdrawal) {
    res.status(404);
    throw new Error("Referral withdrawal request not found");
  }

  if (withdrawal.status === "paid") {
    res.status(400);
    throw new Error("Referral withdrawal has already been paid");
  }

  if (withdrawal.status === "rejected") {
    res.status(400);
    throw new Error("Rejected withdrawal cannot be paid");
  }

  const user = await User.findById(withdrawal.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const totalEarned = Number(user.referralEarnings || 0);
  const totalWithdrawn = Number(user.referralCommissionPaid || 0);

  if (totalWithdrawn + withdrawal.amount > totalEarned) {
    res.status(400);
    throw new Error("User does not have enough earned referral balance for this payout");
  }

  withdrawal.status = "paid";
  withdrawal.reviewedBy = req.admin._id;
  withdrawal.reviewedAt = new Date();
  withdrawal.paidAt = new Date();
  withdrawal.rejectionReason = null;
  await withdrawal.save();

  user.referralCommissionPaid += withdrawal.amount;
  await user.save();

  await sendReferralWithdrawalEmail({
    to: user.email,
    fullName: user.fullName,
    type: "paid",
    amount: withdrawal.amount,
    walletType: withdrawal.walletType,
    walletAddress: withdrawal.walletAddress,
  });

  res.status(200).json({
    status: "success",
    message: "Referral withdrawal marked as paid successfully",
    data: withdrawal,
  });
});

// @desc    Reject referral withdrawal request
// @route   POST /api/referral/withdrawals/:id/reject
// @access  Private/Admin
const rejectReferralWithdrawal = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  if (!reason) {
    res.status(400);
    throw new Error("Please provide a rejection reason");
  }

  const withdrawal = await ReferralWithdrawal.findById(req.params.id).populate("user");

  if (!withdrawal) {
    res.status(404);
    throw new Error("Referral withdrawal request not found");
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

  await sendReferralWithdrawalEmail({
    to: withdrawal.user.email,
    fullName: withdrawal.user.fullName,
    type: "rejected",
    amount: withdrawal.amount,
    walletType: withdrawal.walletType,
    walletAddress: withdrawal.walletAddress,
    reason,
  });

  res.status(200).json({
    status: "success",
    message: "Referral withdrawal rejected successfully",
    data: withdrawal,
  });
});

// Internal helper called when registration payment gets approved
const processReferralCommission = async (userId) => {
  try {
    const referredUser = await User.findById(userId);

    if (!referredUser || !referredUser.referredBy) {
      return;
    }

    const referrer = await User.findById(referredUser.referredBy);

    if (!referrer) {
      return;
    }

    const referralRecord = referrer.referrals.find(
      (ref) => ref.user.toString() === referredUser._id.toString()
    );

    if (!referralRecord) {
      return;
    }

    if (referralRecord.commissionPaid === true) {
      return;
    }

    const commissionAmount = 50;

    referralRecord.paidRegistrationFee = true;
    referralRecord.approvedAt = new Date();
    referralRecord.commissionPaid = true;
    referralRecord.commissionAmount = commissionAmount;

    referrer.referralEarnings += commissionAmount;

    await referrer.save();

    await sendReferralRewardEmail({
      to: referrer.email,
      fullName: referrer.fullName,
      referredUserName: referredUser.fullName,
      amount: commissionAmount,
      totalReferralEarnings: referrer.referralEarnings,
      dashboardUrl: `${process.env.FRONTEND_URL}/dashboard.html`,
    });

    console.log(
      `✅ Referral reward of $${commissionAmount} credited to ${referrer.email} for referring ${referredUser.email}`
    );
  } catch (error) {
    console.error("❌ Error processing referral commission:", error);
  }
};

export {
  generateReferralCode,
  getReferralStats,
  getReferralLeaderboard,
  requestReferralWithdrawal,
  getMyReferralWithdrawals,
  getReferralWithdrawals,
  payReferralWithdrawal,
  rejectReferralWithdrawal,
  processReferralCommission,
};