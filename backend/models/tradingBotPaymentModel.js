import mongoose from "mongoose";

const tradingBotPaymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },

    feeType: {
      type: String,
      enum: ["trading_bot_lifetime"],
      default: "trading_bot_lifetime",
    },

    amount: {
      type: Number,
      required: [true, "Payment amount is required"],
      default: 10000,
    },

    receipt: {
      type: String,
      required: [true, "Payment receipt is required"],
      trim: true,
    },

    receiptPublicId: {
      type: String,
      default: null,
      trim: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
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
  },
  {
    timestamps: true,
  }
);

tradingBotPaymentSchema.index({ user: 1, status: 1 });
tradingBotPaymentSchema.index({ createdAt: -1 });

const TradingBotPayment = mongoose.model(
  "TradingBotPayment",
  tradingBotPaymentSchema
);

export default TradingBotPayment;