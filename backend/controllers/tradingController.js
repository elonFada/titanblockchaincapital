import asyncHandler from 'express-async-handler';
import TradingSignal from '../models/tradingSignalModel.js';
import UserTrade from '../models/userTradeModel.js';
import User from '../models/userModel.js';
import { sendTradingSignalEmail } from '../utils/emailService.js';

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
    profitPercentage,
    lossPercentage,
    description,
    expiresAt
  } = req.body;

  // Validate required fields
  if (!symbol || !entryPoint || !takeProfit || !stopLoss) {
    res.status(400);
    throw new Error('Symbol, entry point, take profit, and stop loss are required');
  }

  if (!profitPercentage || !lossPercentage) {
    res.status(400);
    throw new Error('Profit percentage and loss percentage are required');
  }

  // Create signal
  const signal = await TradingSignal.create({
    symbol,
    entryPoint: parseFloat(entryPoint),
    takeProfit: parseFloat(takeProfit),
    stopLoss: parseFloat(stopLoss),
    profitPercentage: parseFloat(profitPercentage),
    lossPercentage: parseFloat(lossPercentage),
    description: description || '',
    createdBy: req.admin._id,
    expiresAt: expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000) // Default 24 hours
  });

  res.status(201).json({
    success: true,
    message: 'Trading signal created successfully',
    data: signal
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
    .populate('createdBy', 'name email')
    .sort('-createdAt');

  const stats = {
    total: signals.length,
    active: signals.filter(s => s.status === 'active').length,
    completed: signals.filter(s => s.status === 'completed').length,
    expired: signals.filter(s => s.status === 'expired').length
  };

  res.status(200).json({
    success: true,
    stats,
    count: signals.length,
    data: signals
  });
});

// @desc    Get single signal
// @route   GET /api/trading/signal/:id
// @access  Private/Admin
const getSignalById = asyncHandler(async (req, res) => {
  const signal = await TradingSignal.findById(req.params.id)
    .populate('createdBy', 'name email');

  if (!signal) {
    res.status(404);
    throw new Error('Signal not found');
  }

  res.status(200).json({
    success: true,
    data: signal
  });
});

// @desc    Update signal (Admin)
// @route   PUT /api/trading/signal/:id
// @access  Private/Admin
const updateSignal = asyncHandler(async (req, res) => {
  const signal = await TradingSignal.findById(req.params.id);

  if (!signal) {
    res.status(404);
    throw new Error('Signal not found');
  }

  if (signal.status === 'completed') {
    res.status(400);
    throw new Error('Cannot update completed signal');
  }

  const {
    symbol,
    entryPoint,
    takeProfit,
    stopLoss,
    profitPercentage,
    lossPercentage,
    description,
    expiresAt,
    status
  } = req.body;

  if (symbol) signal.symbol = symbol;
  if (entryPoint) signal.entryPoint = parseFloat(entryPoint);
  if (takeProfit) signal.takeProfit = parseFloat(takeProfit);
  if (stopLoss) signal.stopLoss = parseFloat(stopLoss);
  if (profitPercentage) signal.profitPercentage = parseFloat(profitPercentage);
  if (lossPercentage) signal.lossPercentage = parseFloat(lossPercentage);
  if (description) signal.description = description;
  if (expiresAt) signal.expiresAt = expiresAt;
  if (status) signal.status = status;

  await signal.save();

  res.status(200).json({
    success: true,
    message: 'Signal updated successfully',
    data: signal
  });
});

// @desc    Delete signal (Admin)
// @route   DELETE /api/trading/signal/:id
// @access  Private/Admin
const deleteSignal = asyncHandler(async (req, res) => {
  const signal = await TradingSignal.findById(req.params.id);

  if (!signal) {
    res.status(404);
    throw new Error('Signal not found');
  }

  // Check if any users have taken this signal
  const activeTrades = await UserTrade.findOne({
    signal: signal._id,
    status: 'active'
  });

  if (activeTrades) {
    res.status(400);
    throw new Error('Cannot delete signal with active trades');
  }

  await signal.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Signal deleted successfully'
  });
});

// @desc    Complete signal with profit/loss (Admin)
// @route   POST /api/trading/signal/:id/complete
// @access  Private/Admin
const completeSignal = asyncHandler(async (req, res) => {
  const { result, actualPrice } = req.body;

  if (!result || !actualPrice) {
    res.status(400);
    throw new Error('Result (profit/loss) and actual price are required');
  }

  if (result !== 'profit' && result !== 'loss') {
    res.status(400);
    throw new Error('Result must be either "profit" or "loss"');
  }

  const signal = await TradingSignal.findById(req.params.id);

  if (!signal) {
    res.status(404);
    throw new Error('Signal not found');
  }

  if (signal.status !== 'active') {
    res.status(400);
    throw new Error('Signal is not active');
  }

  // Update signal
  signal.status = 'completed';
  signal.result = result;
  signal.actualPrice = parseFloat(actualPrice);
  signal.completedAt = new Date();
  await signal.save();

  // Get all active user trades for this signal
  const userTrades = await UserTrade.find({
    signal: signal._id,
    status: 'active'
  }).populate('user');

  // Process each user's trade
  const emailResults = [];
  for (const trade of userTrades) {
    let profitAmount = 0;
    let lossAmount = 0;
    const oldBalance = trade.user.balance;

    if (result === 'profit') {
      // Calculate profit based on user's current balance
      profitAmount = (trade.user.balance * signal.profitPercentage) / 100;
      trade.profit = profitAmount;
      trade.loss = 0;
      
      // Update user's balance and profit
      trade.user.balance += profitAmount;
      trade.user.totalProfit = (trade.user.totalProfit || 0) + profitAmount;
      
      // Send profit email
      const emailResult = await sendTradingSignalEmail({
        to: trade.user.email,
        fullName: trade.user.fullName,
        type: 'profit',
        signal: {
          symbol: signal.symbol,
          entryPoint: signal.entryPoint,
          takeProfit: signal.takeProfit,
          stopLoss: signal.stopLoss
        },
        profitAmount: profitAmount,
        lossAmount: 0,
        newBalance: trade.user.balance
      });
      emailResults.push({ email: trade.user.email, success: emailResult.success });
      
    } else {
      // Calculate loss based on user's current balance
      lossAmount = (trade.user.balance * signal.lossPercentage) / 100;
      trade.loss = lossAmount;
      trade.profit = 0;
      
      // Update user's balance (reduce balance)
      trade.user.balance -= lossAmount;
      
      // Send loss email
      const emailResult = await sendTradingSignalEmail({
        to: trade.user.email,
        fullName: trade.user.fullName,
        type: 'loss',
        signal: {
          symbol: signal.symbol,
          entryPoint: signal.entryPoint,
          takeProfit: signal.takeProfit,
          stopLoss: signal.stopLoss
        },
        profitAmount: 0,
        lossAmount: lossAmount,
        newBalance: trade.user.balance
      });
      emailResults.push({ email: trade.user.email, success: emailResult.success });
    }

    trade.result = result;
    trade.status = 'completed';
    trade.completedAt = new Date();
    trade.actualPrice = parseFloat(actualPrice);
    
    await trade.save();
    await trade.user.save();

    console.log(`Trade ${result}: User ${trade.user.email} - ${result === 'profit' ? `+$${profitAmount.toFixed(2)}` : `-$${lossAmount.toFixed(2)}`}`);
  }

  res.status(200).json({
    success: true,
    message: `Signal completed with ${result}. ${userTrades.length} trades processed.`,
    data: {
      signal,
      tradesProcessed: userTrades.length,
      result,
      actualPrice,
      emailsSent: emailResults.filter(e => e.success).length,
      emailsFailed: emailResults.filter(e => !e.success).length
    }
  });
});

// ==================== USER TRADING ====================

// @desc    Get available signals for users
// @route   GET /api/trading/signals/available
// @access  Private
const getAvailableSignals = asyncHandler(async (req, res) => {
  const now = new Date();

  const signals = await TradingSignal.find({
    status: 'active',
    expiresAt: { $gt: now }
  }).sort('-createdAt');

  // Check if user has already taken any signal
  const userTrades = await UserTrade.find({
    user: req.user._id,
    status: { $in: ['active', 'completed'] }
  }).select('signal');

  const takenSignalIds = userTrades.map(t => t.signal.toString());

  const availableSignals = signals.filter(
    signal => !takenSignalIds.includes(signal._id.toString())
  );

  res.status(200).json({
    success: true,
    count: availableSignals.length,
    data: availableSignals
  });
});

// @desc    User takes a signal
// @route   POST /api/trading/signal/:id/take
// @access  Private
const takeSignal = asyncHandler(async (req, res) => {
  const signal = await TradingSignal.findById(req.params.id);

  if (!signal) {
    res.status(404);
    throw new Error('Signal not found');
  }

  if (signal.status !== 'active') {
    res.status(400);
    throw new Error('Signal is not active');
  }

  if (new Date() > signal.expiresAt) {
    res.status(400);
    throw new Error('Signal has expired');
  }

  // Check if user already took this signal
  const existingTrade = await UserTrade.findOne({
    user: req.user._id,
    signal: signal._id
  });

  if (existingTrade) {
    res.status(400);
    throw new Error('You have already taken this signal');
  }

  // Check if user has balance to trade
  if (req.user.balance <= 0) {
    res.status(400);
    throw new Error('Insufficient balance to take this signal');
  }

  // Create user trade
  const trade = await UserTrade.create({
    user: req.user._id,
    signal: signal._id,
    symbol: signal.symbol,
    entryPoint: signal.entryPoint,
    takeProfit: signal.takeProfit,
    stopLoss: signal.stopLoss,
    profitPercentage: signal.profitPercentage,
    lossPercentage: signal.lossPercentage,
    status: 'active'
  });

  res.status(201).json({
    success: true,
    message: 'Signal taken successfully',
    data: trade
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
    .populate('signal', 'symbol description entryPoint takeProfit stopLoss')
    .sort('-createdAt');

  const stats = {
    total: trades.length,
    active: trades.filter(t => t.status === 'active').length,
    completed: trades.filter(t => t.status === 'completed').length,
    totalProfit: trades.filter(t => t.result === 'profit').reduce((sum, t) => sum + (t.profit || 0), 0),
    totalLoss: trades.filter(t => t.result === 'loss').reduce((sum, t) => sum + (t.loss || 0), 0),
    netProfit: trades.filter(t => t.result === 'profit').reduce((sum, t) => sum + (t.profit || 0), 0) - 
               trades.filter(t => t.result === 'loss').reduce((sum, t) => sum + (t.loss || 0), 0)
  };

  res.status(200).json({
    success: true,
    stats,
    count: trades.length,
    data: trades
  });
});

// @desc    Get trade by ID
// @route   GET /api/trading/trade/:id
// @access  Private
const getTradeById = asyncHandler(async (req, res) => {
  const trade = await UserTrade.findById(req.params.id)
    .populate('signal')
    .populate('user', 'fullName email');

  if (!trade) {
    res.status(404);
    throw new Error('Trade not found');
  }

  // Check ownership
  if (trade.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized');
  }

  res.status(200).json({
    success: true,
    data: trade
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
    .populate('user', 'fullName email balance')
    .populate('signal', 'symbol profitPercentage lossPercentage')
    .sort('-createdAt');

  const stats = {
    total: trades.length,
    active: trades.filter(t => t.status === 'active').length,
    completed: trades.filter(t => t.status === 'completed').length,
    totalProfit: trades.reduce((sum, t) => sum + (t.profit || 0), 0),
    totalLoss: trades.reduce((sum, t) => sum + (t.loss || 0), 0),
    netProfit: trades.reduce((sum, t) => sum + (t.profit || 0), 0) - trades.reduce((sum, t) => sum + (t.loss || 0), 0)
  };

  res.status(200).json({
    success: true,
    stats,
    count: trades.length,
    data: trades
  });
});

export {
  // Admin signal management
  createSignal,
  getAllSignals,
  getSignalById,
  updateSignal,
  deleteSignal,
  completeSignal,
  // User trading
  getAvailableSignals,
  takeSignal,
  getMyTrades,
  getTradeById,
  // Admin trade management
  getAllUserTrades
};