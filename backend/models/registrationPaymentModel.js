import mongoose from 'mongoose';

const registrationPaymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },

    feeType: {
      type: String,
      enum: ['registration'],
      default: 'registration',
    },

    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      default: 500,
    },

    coin: {
      type: String,
      required: [true, 'Payment coin is required'],
      trim: true,
      enum: ['BTC', 'ETH', 'USDT_TRC20', 'USDT_ERC20', 'BNB'],
    },

    walletAddress: {
      type: String,
      required: [true, 'Wallet address is required'],
      trim: true,
    },

    transactionId: {
      type: String,
      required: [true, 'Transaction ID is required'],
      trim: true,
      unique: true,
    },

    receipt: {
      type: String,
      required: [true, 'Payment receipt is required'],
    },

    receiptPublicId: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },

    rejectionReason: {
      type: String,
      default: null,
      trim: true,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

registrationPaymentSchema.index({ user: 1, status: 1 });

const RegistrationPayment = mongoose.model(
  'RegistrationPayment',
  registrationPaymentSchema
);

export default RegistrationPayment;