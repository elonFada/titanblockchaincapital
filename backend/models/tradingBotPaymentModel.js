import mongoose from "mongoose";

const tradingBotPaymentModel = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [1, "Amount must be greater than 0"],
    },
    receipt: {
      type: String,
      required: true,
      trim: true,
    },
    receiptPublicId: {
      type: String,
      required: true,
      trim: true,
    },
    feeType: {
      type: String,
      default: "trading_bot_lifetime",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
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
    rejectionReason: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const TradingBotPayment = mongoose.model(
  "TradingBotPayment",
  tradingBotPaymentModel
);

export default TradingBotPayment;