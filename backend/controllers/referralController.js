import asyncHandler from "express-async-handler";
import crypto from "crypto";
import User from "../models/userModel.js";

// Generate unique referral code
const generateUniqueReferralCode = async () => {
  let code;
  let isUnique = false;

  while (!isUnique) {
    // Generate 8-character alphanumeric code
    code = crypto.randomBytes(4).toString("hex").toUpperCase();
    const existingUser = await User.findOne({ referralCode: code });
    if (!existingUser) {
      isUnique = true;
    }
  }
  return code;
};

// @desc    Generate referral code for authenticated user
// @route   POST /api/referral/generate-code
// @access  Private
const generateReferralCode = asyncHandler(async (req, res) => {
  const user = req.user;

  if (user.referralCode) {
    return res.status(200).json({
      status: "success",
      message: "Referral code already exists",
      referralCode: user.referralCode,
      referralLink: `${process.env.FRONTEND_URL}/register?ref=${user.referralCode}`,
    });
  }

  const referralCode = await generateUniqueReferralCode();
  user.referralCode = referralCode;
  await user.save();

  res.status(200).json({
    status: "success",
    message: "Referral code generated successfully",
    referralCode: user.referralCode,
    referralLink: `${process.env.FRONTEND_URL}/register?ref=${user.referralCode}`,
  });
});

// @desc    Get user's referral statistics
// @route   GET /api/referral/stats
// @access  Private
const getReferralStats = asyncHandler(async (req, res) => {
  const user = req.user;

  const totalReferrals = user.referrals.length;
  const paidReferrals = user.referrals.filter(
    (ref) => ref.paidRegistrationFee === true,
  ).length;
  const approvedReferrals = user.referrals.filter(
    (ref) => ref.approvedAt !== null,
  ).length;
  const commissionEarned = user.referralEarnings;
  const commissionPaid = user.referralCommissionPaid;

  res.status(200).json({
    status: "success",
    data: {
      referralCode: user.referralCode,
      referralLink: `${process.env.FRONTEND_URL}/register?ref=${user.referralCode}`,
      stats: {
        totalReferrals,
        paidReferrals,
        approvedReferrals,
        commissionEarned,
        commissionPaid,
        pendingCommission: commissionEarned - commissionPaid,
      },
      referrals: user.referrals.map((ref) => ({
        userId: ref.user,
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
    .select("fullName referralEarnings referralCommissionPaid")
    .sort("-referralEarnings")
    .limit(10);

  res.status(200).json({
    status: "success",
    data: topReferrers,
  });
});

// @desc    Process referral commission when user pays registration fee
// @route   Internal function called from payment approval
// @access  Internal
const processReferralCommission = async (userId, approvedAmount = 500) => {
  try {
    const user = await User.findById(userId);

    if (!user || !user.referredBy) {
      console.log("No referrer found for user:", userId);
      return;
    }

    const referrer = await User.findById(user.referredBy);

    if (!referrer) {
      console.log("Referrer not found:", user.referredBy);
      return;
    }

    // Check if commission already paid for this referral
    const existingReferral = referrer.referrals.find(
      (ref) => ref.user.toString() === userId && ref.commissionPaid === true,
    );

    if (existingReferral) {
      console.log("Commission already paid for user:", userId);
      return;
    }

    // Commission amount: $60 USD
    const commissionAmount = 60;

    // Update referrer's earnings
    referrer.referralEarnings += commissionAmount;

    // Update the specific referral record
    const referralRecord = referrer.referrals.find(
      (ref) => ref.user.toString() === userId,
    );

    if (referralRecord) {
      referralRecord.commissionPaid = true;
      referralRecord.commissionAmount = commissionAmount;
    }

    await referrer.save();

    console.log(
      `✅ Commission of $${commissionAmount} credited to ${referrer.email} for referring ${user.email}`,
    );

    // TODO: Send email notification to referrer about commission earned
    // await sendCommissionEmail(referrer.email, commissionAmount, user.fullName);
  } catch (error) {
    console.error("Error processing referral commission:", error);
  }
};

export {
  generateReferralCode,
  getReferralStats,
  getReferralLeaderboard,
  processReferralCommission,
};
