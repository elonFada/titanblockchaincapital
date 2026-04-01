import asyncHandler from "express-async-handler";
import TradingSignal from "../models/tradingSignalModel.js";
import UserTrade from "../models/userTradeModel.js";
import User from "../models/userModel.js";
import { sendTradingSignalEmail } from "../utils/emailService.js";

// ==================== HELPERS ====================

const ALLOWED_RESULTS = ["profit", "loss"];
const ALLOWED_SIGNAL_STATUSES = ["active", "completed", "expired"];

const toNumber = (value) => Number(value);

const isValidPositiveNumber = (value) =>
  !Number.isNaN(Number(value)) && Number(value) > 0;

const isValidPercentage = (value) =>
  !Number.isNaN(Number(value)) && Number(value) > 0 && Number(value) <= 100;

const getSignalOutcomeType = (signal) => {
  if (Number(signal?.profitPercentage || 0) > 0) return "profit";
  if (Number(signal?.lossPercentage || 0) > 0) return "loss";
  return null;
};

const buildTradeEmailSignal = (signal) => ({
  symbol: signal.symbol,
  entryPoint: signal.entryPoint,
  takeProfit: signal.takeProfit,
  stopLoss: signal.stopLoss,
});

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

  if (!ALLOWED_RESULTS.includes(outcomeType)) {
    res.status(400);
    throw new Error('Outcome type must be either "profit" or "loss"');
  }

  if (!isValidPositiveNumber(entryPoint)) {
    res.status(400);
    throw new Error("Entry point must be a valid number greater than 0");
  }

  if (!isValidPositiveNumber(takeProfit)) {
    res.status(400);
    throw new Error("Take profit must be a valid number greater than 0");
  }

  if (!isValidPositiveNumber(stopLoss)) {
    res.status(400);
    throw new Error("Stop loss must be a valid number greater than 0");
  }

  if (!isValidPercentage(percentage)) {
    res.status(400);
    throw new Error("Percentage must be between 0.01 and 100");
  }

  const numericEntryPoint = toNumber(entryPoint);
  const numericTakeProfit = toNumber(takeProfit);
  const numericStopLoss = toNumber(stopLoss);
  const numericPercentage = toNumber(percentage);

  const signalPayload = {
    symbol: String(symbol).trim().toUpperCase(),
    entryPoint: numericEntryPoint,
    takeProfit: numericTakeProfit,
    stopLoss: numericStopLoss,
    profitPercentage: outcomeType === "profit" ? numericPercentage : 0,
    lossPercentage: outcomeType === "loss" ? numericPercentage : 0,
    status: "active",
    result: null,
    completedAt: null,
    createdBy: req.admin._id,
  };

  const signal = await TradingSignal.create(signalPayload);

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
  if (status) {
    filter.status = status;
  }

  const signals = await TradingSignal.find(filter)
    .populate("createdBy", "name email fullName")
    .sort({ createdAt: -1 });

  const stats = {
    total: signals.length,
    active: signals.filter((signal) => signal.status === "active").length,
    completed: signals.filter((signal) => signal.status === "completed").length,
    expired: signals.filter((signal) => signal.status === "expired").length,
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
    "name email fullName"
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
    throw new Error("Cannot update a completed signal");
  }

  const {
    symbol,
    entryPoint,
    takeProfit,
    stopLoss,
    outcomeType,
    percentage,
    status,
  } = req.body;

  if (symbol !== undefined) {
    signal.symbol = String(symbol).trim().toUpperCase();
  }

  if (entryPoint !== undefined) {
    if (!isValidPositiveNumber(entryPoint)) {
      res.status(400);
      throw new Error("Entry point must be a valid number greater than 0");
    }
    signal.entryPoint = toNumber(entryPoint);
  }

  if (takeProfit !== undefined) {
    if (!isValidPositiveNumber(takeProfit)) {
      res.status(400);
      throw new Error("Take profit must be a valid number greater than 0");
    }
    signal.takeProfit = toNumber(takeProfit);
  }

  if (stopLoss !== undefined) {
    if (!isValidPositiveNumber(stopLoss)) {
      res.status(400);
      throw new Error("Stop loss must be a valid number greater than 0");
    }
    signal.stopLoss = toNumber(stopLoss);
  }

  if (outcomeType !== undefined || percentage !== undefined) {
    const nextOutcomeType = outcomeType || getSignalOutcomeType(signal);
    const nextPercentage =
      percentage !== undefined
        ? toNumber(percentage)
        : nextOutcomeType === "profit"
          ? Number(signal.profitPercentage || 0)
          : Number(signal.lossPercentage || 0);

    if (!ALLOWED_RESULTS.includes(nextOutcomeType)) {
      res.status(400);
      throw new Error('Outcome type must be either "profit" or "loss"');
    }

    if (!isValidPercentage(nextPercentage)) {
      res.status(400);
      throw new Error("Percentage must be between 0.01 and 100");
    }

    signal.profitPercentage =
      nextOutcomeType === "profit" ? Number(nextPercentage) : 0;
    signal.lossPercentage =
      nextOutcomeType === "loss" ? Number(nextPercentage) : 0;
  }

  if (status !== undefined) {
    if (!ALLOWED_SIGNAL_STATUSES.includes(status)) {
      res.status(400);
      throw new Error("Invalid signal status");
    }

    if (status === "completed") {
      res.status(400);
      throw new Error("Use the close trade endpoint to complete a signal");
    }

    signal.status = status;

    if (status === "expired") {
      signal.completedAt = new Date();
    } else if (status === "active") {
      signal.completedAt = null;
      signal.result = null;
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

  const activeTradeExists = await UserTrade.exists({
    signal: signal._id,
    status: "active",
  });

  if (activeTradeExists) {
    res.status(400);
    throw new Error("Cannot delete a signal with active accepted trades");
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

  if (!ALLOWED_RESULTS.includes(result)) {
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

  const activeTrades = await UserTrade.find({
    signal: signal._id,
    status: "active",
  }).populate("user");

  signal.status = "completed";
  signal.result = result;
  signal.completedAt = new Date();
  await signal.save();

  let processedCount = 0;

  for (const trade of activeTrades) {
    const user = await User.findById(trade.user?._id || trade.user);

    if (!user) {
      continue;
    }

    const currentBalanceAtClose = Number(user.balance || 0);
    const profitPercentage = Number(signal.profitPercentage || 0);
    const lossPercentage = Number(signal.lossPercentage || 0);

    let profitAmount = 0;
    let lossAmount = 0;

    if (result === "profit") {
      profitAmount = (currentBalanceAtClose * profitPercentage) / 100;

      trade.result = "profit";
      trade.profit = profitAmount;
      trade.loss = 0;
      trade.status = "completed";
      trade.completedAt = new Date();

      user.balance = currentBalanceAtClose + profitAmount;
      user.totalProfit = Number(user.totalProfit || 0) + profitAmount;

      await trade.save();
      await user.save();

      try {
        await sendTradingSignalEmail({
          to: user.email,
          fullName: user.fullName,
          type: "profit",
          signal: buildTradeEmailSignal(signal),
          profitAmount,
          lossAmount: 0,
          newBalance: user.balance,
        });
      } catch (error) {
        console.error("Failed to send profit email:", error);
      }
    } else {
      lossAmount = (currentBalanceAtClose * lossPercentage) / 100;

      trade.result = "loss";
      trade.loss = lossAmount;
      trade.profit = 0;
      trade.status = "completed";
      trade.completedAt = new Date();

      user.balance = Math.max(0, currentBalanceAtClose - lossAmount);

      await trade.save();
      await user.save();

      try {
        await sendTradingSignalEmail({
          to: user.email,
          fullName: user.fullName,
          type: "loss",
          signal: buildTradeEmailSignal(signal),
          profitAmount: 0,
          lossAmount,
          newBalance: user.balance,
        });
      } catch (error) {
        console.error("Failed to send loss email:", error);
      }
    }

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
  const activeSignals = await TradingSignal.find({
    status: "active",
  }).sort({ createdAt: -1 });

  const existingUserTrades = await UserTrade.find({
    user: req.user._id,
  }).select("signal");

  const takenSignalIds = new Set(
    existingUserTrades.map((trade) => String(trade.signal))
  );

  const availableSignals = activeSignals.filter(
    (signal) => !takenSignalIds.has(String(signal._id))
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

  const currentUserBalance = Number(req.user.balance || 0);
  if (currentUserBalance <= 0) {
    res.status(400);
    throw new Error("Insufficient balance to accept this trade");
  }

  const trade = await UserTrade.create({
    user: req.user._id,
    signal: signal._id,
    symbol: signal.symbol,
    entryPoint: signal.entryPoint,
    takeProfit: signal.takeProfit,
    stopLoss: signal.stopLoss,
    profitPercentage: Number(signal.profitPercentage || 0),
    lossPercentage: Number(signal.lossPercentage || 0),
    acceptedBalance: currentUserBalance,
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
  if (status) {
    filter.status = status;
  }

  const trades = await UserTrade.find(filter)
    .populate(
      "signal",
      "symbol entryPoint takeProfit stopLoss profitPercentage lossPercentage status result completedAt"
    )
    .sort({ createdAt: -1 });

  const stats = {
    total: trades.length,
    active: trades.filter((trade) => trade.status === "active").length,
    completed: trades.filter((trade) => trade.status === "completed").length,
    totalProfit: trades.reduce(
      (sum, trade) => sum + Number(trade.profit || 0),
      0
    ),
    totalLoss: trades.reduce((sum, trade) => sum + Number(trade.loss || 0), 0),
    netProfit:
      trades.reduce((sum, trade) => sum + Number(trade.profit || 0), 0) -
      trades.reduce((sum, trade) => sum + Number(trade.loss || 0), 0),
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
    String(trade.user._id) !== String(req.user._id) &&
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
  if (status) {
    filter.status = status;
  }
  if (userId) {
    filter.user = userId;
  }

  const trades = await UserTrade.find(filter)
    .populate("user", "fullName email balance")
    .populate(
      "signal",
      "symbol profitPercentage lossPercentage status result completedAt"
    )
    .sort({ createdAt: -1 });

  const stats = {
    total: trades.length,
    active: trades.filter((trade) => trade.status === "active").length,
    completed: trades.filter((trade) => trade.status === "completed").length,
    totalProfit: trades.reduce(
      (sum, trade) => sum + Number(trade.profit || 0),
      0
    ),
    totalLoss: trades.reduce((sum, trade) => sum + Number(trade.loss || 0), 0),
    netProfit:
      trades.reduce((sum, trade) => sum + Number(trade.profit || 0), 0) -
      trades.reduce((sum, trade) => sum + Number(trade.loss || 0), 0),
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