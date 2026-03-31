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
    },

    receipt: {
      type: String,
      required: [true, 'Payment receipt is required'],
    },

    receiptPublicId: {
      type: String,
    },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },

    rejectionReason: {
      type: String,
      default: null,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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

const RegistrationPayment = mongoose.model('RegistrationPayment', registrationPaymentSchema);

export default RegistrationPayment;