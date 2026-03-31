import mongoose from 'mongoose';

const userTradeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  signal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TradingSignal',
    required: true
  },
  symbol: {
    type: String,
    required: true
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
    required: true
  },
  lossPercentage: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed'],
    default: 'active'
  },
  result: {
    type: String,
    enum: ['profit', 'loss'],
    default: null
  },
  profit: {
    type: Number,
    default: 0
  },
  loss: {
    type: Number,
    default: 0
  },
  actualPrice: {
    type: Number,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes
userTradeSchema.index({ user: 1 });
userTradeSchema.index({ signal: 1 });
userTradeSchema.index({ status: 1 });
userTradeSchema.index({ createdAt: -1 });

const UserTrade = mongoose.model('UserTrade', userTradeSchema);

export default UserTrade;