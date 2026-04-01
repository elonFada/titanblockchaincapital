import asyncHandler from "express-async-handler";
import TradingSignal from "../models/tradingSignalModel.js";
import UserTrade from "../models/userTradeModel.js";
import User from "../models/userModel.js";
import { sendTradingSignalEmail } from "../utils/emailService.js";

// ==================== ADMIN SIGNAL MANAGEMENT ====================

// @desc    Create trading signal (Admin)
// @route   POST /api/trading/signal
// @access  Private/Admin
const createSignal = asyncHandler(async (req, res) => {
  const {
    symbol,
    entryPoint,
    takeProfit,
    stopLoss,
    outcomeType,
    percentage,
  } = req.body;

  if (
    !symbol ||
    entryPoint === undefined ||
    takeProfit === undefined ||
    stopLoss === undefined ||
    !outcomeType ||
    percentage === undefined
  ) {
    res.status(400);
    throw new Error(
      "Symbol, entry point, take profit, stop loss, outcome type, and percentage are required"
    );
  }

  if (!["profit", "loss"].includes(outcomeType)) {
    res.status(400);
    throw new Error('Outcome type must be either "profit" or "loss"');
  }

  const numericEntry = Number(entryPoint);
  const numericTP = Number(takeProfit);
  const numericSL = Number(stopLoss);
  const numericPercent = Number(percentage);

  if (
    Number.isNaN(numericEntry) ||
    Number.isNaN(numericTP) ||
    Number.isNaN(numericSL) ||
    Number.isNaN(numericPercent)
  ) {
    res.status(400);
    throw new Error("Please provide valid numeric values");
  }

  if (numericPercent <= 0 || numericPercent > 100) {
    res.status(400);
    throw new Error("Outcome percentage must be between 0.01 and 100");
  }

  const signal = await TradingSignal.create({
    symbol,
    entryPoint: numericEntry,
    takeProfit: numericTP,
    stopLoss: numericSL,
    profitPercentage: outcomeType === "profit" ? numericPercent : 0,
    lossPercentage: outcomeType === "loss" ? numericPercent : 0,
    createdBy: req.admin._id,
    status: "active",
  });

  res.status(201).json({
    success: true,
    message: "Trading signal created successfully",
    data: signal,
  });
});

// @desc    Get all signals (Admin)
// @route   GET /api/trading/signals
// @access  Private/Admin
const getAllSignals = asyncHandler(async (req, res) => {
  const { status } = req.query;

  const filter = {};
  if (status) filter.status = status;

  const signals = await TradingSignal.find(filter)
    .populate("createdBy", "name email")
    .sort("-createdAt");

  const stats = {
    total: signals.length,
    active: signals.filter((s) => s.status === "active").length,
    completed: signals.filter((s) => s.status === "completed").length,
  };

  res.status(200).json({
    success: true,
    stats,
    count: signals.length,
    data: signals,
  });
});

// @desc    Get single signal
// @route   GET /api/trading/signal/:id
// @access  Private/Admin
const getSignalById = asyncHandler(async (req, res) => {
  const signal = await TradingSignal.findById(req.params.id).populate(
    "createdBy",
    "name email"
  );

  if (!signal) {
    res.status(404);
    throw new Error("Signal not found");
  }

  res.status(200).json({
    success: true,
    data: signal,
  });
});

// @desc    Update signal (Admin)
// @route   PUT /api/trading/signal/:id
// @access  Private/Admin
const updateSignal = asyncHandler(async (req, res) => {
  const signal = await TradingSignal.findById(req.params.id);

  if (!signal) {
    res.status(404);
    throw new Error("Signal not found");
  }

  if (signal.status === "completed") {
    res.status(400);
    throw new Error("Cannot update completed signal");
  }

  const {
    symbol,
    entryPoint,
    takeProfit,
    stopLoss,
    outcomeType,
    outcomePercentage,
    status,
  } = req.body;

  if (symbol) signal.symbol = symbol;
  if (entryPoint !== undefined) signal.entryPoint = Number(entryPoint);
  if (takeProfit !== undefined) signal.takeProfit = Number(takeProfit);
  if (stopLoss !== undefined) signal.stopLoss = Number(stopLoss);

  if (outcomeType) {
    if (!["profit", "loss"].includes(outcomeType)) {
      res.status(400);
      throw new Error('Outcome type must be either "profit" or "loss"');
    }
    signal.outcomeType = outcomeType;
  }

  if (outcomePercentage !== undefined) {
    const numericPercent = Number(outcomePercentage);
    if (Number.isNaN(numericPercent) || numericPercent <= 0 || numericPercent > 100) {
      res.status(400);
      throw new Error("Outcome percentage must be between 0.01 and 100");
    }
    signal.outcomePercentage = numericPercent;
  }

  if (status && ["active", "completed"].includes(status)) {
    signal.status = status;
    if (status === "completed" && !signal.completedAt) {
      signal.completedAt = new Date();
    }
  }

  await signal.save();

  res.status(200).json({
    success: true,
    message: "Signal updated successfully",
    data: signal,
  });
});

// @desc    Delete signal (Admin)
// @route   DELETE /api/trading/signal/:id
// @access  Private/Admin
const deleteSignal = asyncHandler(async (req, res) => {
  const signal = await TradingSignal.findById(req.params.id);

  if (!signal) {
    res.status(404);
    throw new Error("Signal not found");
  }

  const activeTrades = await UserTrade.findOne({
    signal: signal._id,
    status: "active",
  });

  if (activeTrades) {
    res.status(400);
    throw new Error("Cannot delete signal with active accepted trades");
  }

  await signal.deleteOne();

  res.status(200).json({
    success: true,
    message: "Signal deleted successfully",
  });
});

// @desc    Complete signal with profit/loss (Admin)
// @route   POST /api/trading/signal/:id/complete
// @access  Private/Admin
const completeSignal = asyncHandler(async (req, res) => {
  const { result } = req.body;

  if (!result) {
    res.status(400);
    throw new Error("Result is required");
  }

  if (result !== "profit" && result !== "loss") {
    res.status(400);
    throw new Error('Result must be either "profit" or "loss"');
  }

  const signal = await TradingSignal.findById(req.params.id);

  if (!signal) {
    res.status(404);
    throw new Error("Signal not found");
  }

  if (signal.status !== "active") {
    res.status(400);
    throw new Error("Signal is not active");
  }

  signal.status = "completed";
  signal.result = result;
  signal.completedAt = new Date();
  await signal.save();

  const userTrades = await UserTrade.find({
    signal: signal._id,
    status: "active",
  }).populate("user");

  let processedCount = 0;

  for (const trade of userTrades) {
    const user = trade.user;

    if (!user) continue;

    let profitAmount = 0;
    let lossAmount = 0;

    if (result === "profit") {
      profitAmount = ((trade.acceptedBalance || 0) * (trade.profitPercentage || 0)) / 100;

      trade.result = "profit";
      trade.profit = profitAmount;
      trade.loss = 0;
      trade.status = "completed";
      trade.completedAt = new Date();

      user.balance = (user.balance || 0) + profitAmount;
      user.totalProfit = (user.totalProfit || 0) + profitAmount;

      await sendTradingSignalEmail({
        to: user.email,
        fullName: user.fullName,
        type: "profit",
        signal: {
          symbol: signal.symbol,
          entryPoint: signal.entryPoint,
          takeProfit: signal.takeProfit,
          stopLoss: signal.stopLoss,
        },
        profitAmount,
        lossAmount: 0,
        newBalance: user.balance,
      });
    } else {
      lossAmount = ((trade.acceptedBalance || 0) * (trade.lossPercentage || 0)) / 100;

      trade.result = "loss";
      trade.loss = lossAmount;
      trade.profit = 0;
      trade.status = "completed";
      trade.completedAt = new Date();

      user.balance = Math.max(0, (user.balance || 0) - lossAmount);

      await sendTradingSignalEmail({
        to: user.email,
        fullName: user.fullName,
        type: "loss",
        signal: {
          symbol: signal.symbol,
          entryPoint: signal.entryPoint,
          takeProfit: signal.takeProfit,
          stopLoss: signal.stopLoss,
        },
        profitAmount: 0,
        lossAmount,
        newBalance: user.balance,
      });
    }

    await trade.save();
    await user.save();
    processedCount += 1;
  }

  res.status(200).json({
    success: true,
    message: `Trade closed successfully as ${result}. ${processedCount} accepted trade(s) updated.`,
    data: {
      signal,
      processedCount,
      result,
    },
  });
});

// ==================== USER TRADING ====================

// @desc    Get available signals for users
// @route   GET /api/trading/signals/available
// @access  Private
const getAvailableSignals = asyncHandler(async (req, res) => {
  const signals = await TradingSignal.find({
    status: "active",
  }).sort("-createdAt");

  const userTrades = await UserTrade.find({
    user: req.user._id,
  }).select("signal");

  const takenSignalIds = userTrades.map((t) => t.signal.toString());

  const availableSignals = signals.filter(
    (signal) => !takenSignalIds.includes(signal._id.toString())
  );

  res.status(200).json({
    success: true,
    count: availableSignals.length,
    data: availableSignals,
  });
});

// @desc    User takes a signal
// @route   POST /api/trading/signal/:id/take
// @access  Private
const takeSignal = asyncHandler(async (req, res) => {
  const signal = await TradingSignal.findById(req.params.id);

  if (!signal) {
    res.status(404);
    throw new Error("Signal not found");
  }

  if (signal.status !== "active") {
    res.status(400);
    throw new Error("Signal is not active");
  }

  const existingTrade = await UserTrade.findOne({
    user: req.user._id,
    signal: signal._id,
  });

  if (existingTrade) {
    res.status(400);
    throw new Error("You have already accepted this signal");
  }

  if (Number(req.user.balance || 0) <= 0) {
    res.status(400);
    throw new Error("Insufficient balance to accept this trade");
  }

  const acceptedBalance = Number(req.user.balance || 0);

  const trade = await UserTrade.create({
    user: req.user._id,
    signal: signal._id,
    symbol: signal.symbol,
    entryPoint: signal.entryPoint,
    takeProfit: signal.takeProfit,
    stopLoss: signal.stopLoss,
    profitPercentage: signal.profitPercentage || 0,
    lossPercentage: signal.lossPercentage || 0,
    acceptedBalance: Number(req.user.balance || 0),
    status: "active",
  });

  res.status(201).json({
    success: true,
    message: "Trade accepted successfully",
    data: trade,
  });
});

// @desc    Get user's trades
// @route   GET /api/trading/my-trades
// @access  Private
const getMyTrades = asyncHandler(async (req, res) => {
  const { status } = req.query;

  const filter = { user: req.user._id };
  if (status) filter.status = status;

  const trades = await UserTrade.find(filter)
    .populate("signal", "symbol entryPoint takeProfit stopLoss outcomeType outcomePercentage status")
    .sort("-createdAt");

  const stats = {
    total: trades.length,
    active: trades.filter((t) => t.status === "active").length,
    completed: trades.filter((t) => t.status === "completed").length,
    totalProfit: trades.reduce((sum, t) => sum + Number(t.profit || 0), 0),
    totalLoss: trades.reduce((sum, t) => sum + Number(t.loss || 0), 0),
    netProfit:
      trades.reduce((sum, t) => sum + Number(t.profit || 0), 0) -
      trades.reduce((sum, t) => sum + Number(t.loss || 0), 0),
  };

  res.status(200).json({
    success: true,
    stats,
    count: trades.length,
    data: trades,
  });
});

// @desc    Get trade by ID
// @route   GET /api/trading/trade/:id
// @access  Private
const getTradeById = asyncHandler(async (req, res) => {
  const trade = await UserTrade.findById(req.params.id)
    .populate("signal")
    .populate("user", "fullName email");

  if (!trade) {
    res.status(404);
    throw new Error("Trade not found");
  }

  if (
    trade.user._id.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    res.status(403);
    throw new Error("Not authorized");
  }

  res.status(200).json({
    success: true,
    data: trade,
  });
});

// ==================== ADMIN USER TRADE MANAGEMENT ====================

// @desc    Get all user trades (Admin)
// @route   GET /api/trading/admin/trades
// @access  Private/Admin
const getAllUserTrades = asyncHandler(async (req, res) => {
  const { status, userId } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (userId) filter.user = userId;

  const trades = await UserTrade.find(filter)
    .populate("user", "fullName email balance")
    .populate("signal", "symbol outcomeType outcomePercentage status")
    .sort("-createdAt");

  const stats = {
    total: trades.length,
    active: trades.filter((t) => t.status === "active").length,
    completed: trades.filter((t) => t.status === "completed").length,
    totalProfit: trades.reduce((sum, t) => sum + Number(t.profit || 0), 0),
    totalLoss: trades.reduce((sum, t) => sum + Number(t.loss || 0), 0),
    netProfit:
      trades.reduce((sum, t) => sum + Number(t.profit || 0), 0) -
      trades.reduce((sum, t) => sum + Number(t.loss || 0), 0),
  };

  res.status(200).json({
    success: true,
    stats,
    count: trades.length,
    data: trades,
  });
});

export {
  createSignal,
  getAllSignals,
  getSignalById,
  updateSignal,
  deleteSignal,
  completeSignal,
  getAvailableSignals,
  takeSignal,
  getMyTrades,
  getTradeById,
  getAllUserTrades,
};