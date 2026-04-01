import mongoose from 'mongoose';

const depositSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 5000
  },
  transactionId: {
    type: String,
    required: true,
    trim: true
  },
  coinType: {
    type: String,
    required: true,
    enum: ['BTC', 'ETH', 'USDT_TRC20', 'USDT_ERC20', 'BNB']
  },
  receipt: {
    type: String,
    required: true
  },
  receiptPublicId: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  rejectionReason: {
    type: String,
    default: null
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for faster queries
depositSchema.index({ user: 1 });
depositSchema.index({ status: 1 });
depositSchema.index({ createdAt: -1 });

const Deposit = mongoose.model('Deposit', depositSchema);

export default Deposit;