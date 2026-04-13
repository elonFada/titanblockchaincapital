import mongoose from "mongoose";

const referralWithdrawalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: [1, "Withdrawal amount must be at least 1"],
    },

    walletType: {
      type: String,
      required: true,
      trim: true,
    },

    walletAddress: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["pending", "paid", "rejected"],
      default: "pending",
    },

    rejectionReason: {
      type: String,
      default: null,
      trim: true,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    paidAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

referralWithdrawalSchema.index({ user: 1, status: 1 });

const ReferralWithdrawal = mongoose.model(
  "ReferralWithdrawal",
  referralWithdrawalSchema
);

export default ReferralWithdrawal;