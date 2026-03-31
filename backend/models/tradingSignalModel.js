import mongoose from 'mongoose';

const tradingSignalSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    enum: ['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'BTCUSD', 'ETHUSD']
  },
  entryPoint: {
    type: Number,
    required: true
  },
  takeProfit: {
    type: Number,
    required: true
  },
  stopLoss: {
    type: Number,
    required: true
  },
  profitPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  lossPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  description: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'expired'],
    default: 'active'
  },
  result: {
    type: String,
    enum: ['profit', 'loss'],
    default: null
  },
  actualPrice: {
    type: Number,
    default: null
  },
  expiresAt: {
    type: Date,
    required: true
  },
  completedAt: {
    type: Date,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  }
}, {
  timestamps: true
});

// Indexes
tradingSignalSchema.index({ status: 1 });
tradingSignalSchema.index({ expiresAt: 1 });
tradingSignalSchema.index({ symbol: 1 });

const TradingSignal = mongoose.model('TradingSignal', tradingSignalSchema);

export default TradingSignal;