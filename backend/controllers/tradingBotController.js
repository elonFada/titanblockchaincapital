import asyncHandler from "express-async-handler";
import TradingBotPayment from "../models/tradingBotPaymentModel.js";
import User from "../models/userModel.js";

// @desc    Submit trading bot payment
// @route   POST /api/trading-bot/payment
// @access  Private
const submitTradingBotPayment = asyncHandler(async (req, res) => {
  const user = req.user;
  const { amount } = req.body;

  if (!user.isVerified) {
    res.status(403);
    throw new Error("Please verify your account before making payment");
  }

  if (user.tradingBotSubscribed) {
    res.status(400);
    throw new Error("Trading bot lifetime access is already active on this account");
  }

  const existingPending = await TradingBotPayment.findOne({
    user: user._id,
    status: "pending",
  });

  if (existingPending) {
    res.status(400);
    throw new Error("You already have a pending trading bot payment under review");
  }

  if (!amount) {
    res.status(400);
    throw new Error("Payment amount is required");
  }

  if (!req.file) {
    res.status(400);
    throw new Error("Payment receipt is required");
  }

  const payment = await TradingBotPayment.create({
    user: user._id,
    amount: Number(amount),
    receipt: req.file.path,
    receiptPublicId: req.file.filename,
    feeType: "trading_bot_lifetime",
    status: "pending",
  });

  res.status(201).json({
    success: true,
    message: "Trading bot payment submitted successfully. Awaiting admin approval.",
    data: payment,
  });
});

// @desc    Get my trading bot payment
// @route   GET /api/trading-bot/payment/me
// @access  Private
const getMyTradingBotPayment = asyncHandler(async (req, res) => {
  const payment = await TradingBotPayment.findOne({ user: req.user._id }).sort("-createdAt");

  res.status(200).json({
    success: true,
    data: payment,
    botActive: req.user.tradingBotSubscribed || false,
    activatedAt: req.user.tradingBotActivatedAt || null,
  });
});

// @desc    Get all trading bot payments
// @route   GET /api/trading-bot/payment/admin/all
// @access  Private/Admin
const getAllTradingBotPayments = asyncHandler(async (req, res) => {
  const { status } = req.query;

  const filter = {};
  if (status) filter.status = status;

  const payments = await TradingBotPayment.find(filter)
    .populate("user", "fullName email phoneNumber tradingBotSubscribed")
    .populate("reviewedBy", "fullName email")
    .sort("-createdAt");

  const stats = {
    total: payments.length,
    pending: payments.filter((p) => p.status === "pending").length,
    approved: payments.filter((p) => p.status === "approved").length,
    rejected: payments.filter((p) => p.status === "rejected").length,
  };

  res.status(200).json({
    success: true,
    stats,
    count: payments.length,
    data: payments,
  });
});

// @desc    Get trading bot payment by ID
// @route   GET /api/trading-bot/payment/admin/:id
// @access  Private/Admin
const getTradingBotPaymentById = asyncHandler(async (req, res) => {
  const payment = await TradingBotPayment.findById(req.params.id)
    .populate("user", "fullName email phoneNumber tradingBotSubscribed")
    .populate("reviewedBy", "fullName email");

  if (!payment) {
    res.status(404);
    throw new Error("Trading bot payment not found");
  }

  res.status(200).json({
    success: true,
    data: payment,
  });
});

// @desc    Approve trading bot payment
// @route   POST /api/trading-bot/payment/admin/:id/approve
// @access  Private/Admin
const approveTradingBotPayment = asyncHandler(async (req, res) => {
  const payment = await TradingBotPayment.findById(req.params.id).populate("user");

  if (!payment) {
    res.status(404);
    throw new Error("Trading bot payment not found");
  }

  if (payment.status === "approved") {
    res.status(400);
    throw new Error("Trading bot payment has already been approved");
  }

  if (payment.status === "rejected") {
    res.status(400);
    throw new Error("Rejected payment cannot be approved");
  }

  payment.status = "approved";
  payment.reviewedBy = req.admin._id;
  payment.reviewedAt = new Date();
  payment.rejectionReason = null;
  await payment.save();

  const user = await User.findById(payment.user._id);
  user.tradingBotSubscribed = true;
  user.tradingBotActivatedAt = new Date();
  user.tradingBotPaymentId = payment._id;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Trading bot payment approved successfully",
    data: {
      payment,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        tradingBotSubscribed: user.tradingBotSubscribed,
        tradingBotActivatedAt: user.tradingBotActivatedAt,
      },
    },
  });
});

// @desc    Reject trading bot payment
// @route   POST /api/trading-bot/payment/admin/:id/reject
// @access  Private/Admin
const rejectTradingBotPayment = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  if (!reason) {
    res.status(400);
    throw new Error("Rejection reason is required");
  }

  const payment = await TradingBotPayment.findById(req.params.id);

  if (!payment) {
    res.status(404);
    throw new Error("Trading bot payment not found");
  }

  if (payment.status === "approved") {
    res.status(400);
    throw new Error("Approved payment cannot be rejected");
  }

  if (payment.status === "rejected") {
    res.status(400);
    throw new Error("Trading bot payment has already been rejected");
  }

  payment.status = "rejected";
  payment.reviewedBy = req.admin._id;
  payment.reviewedAt = new Date();
  payment.rejectionReason = reason;
  await payment.save();

  res.status(200).json({
    success: true,
    message: "Trading bot payment rejected",
    data: payment,
  });
});

export {
  submitTradingBotPayment,
  getMyTradingBotPayment,
  getAllTradingBotPayments,
  getTradingBotPaymentById,
  approveTradingBotPayment,
  rejectTradingBotPayment,
};