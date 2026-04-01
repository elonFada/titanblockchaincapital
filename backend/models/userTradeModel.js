import mongoose from "mongoose";

const userTradeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    signal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TradingSignal",
      required: true,
    },
    symbol: {
      type: String,
      required: true,
      trim: true,
    },
    entryPoint: {
      type: Number,
      required: true,
    },
    takeProfit: {
      type: Number,
      required: true,
    },
    stopLoss: {
      type: Number,
      required: true,
    },
    profitPercentage: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 100,
    },
    lossPercentage: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 100,
    },
    acceptedBalance: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active",
    },
    result: {
      type: String,
      enum: ["profit", "loss"],
      default: null,
    },
    profit: {
      type: Number,
      default: 0,
    },
    loss: {
      type: Number,
      default: 0,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

userTradeSchema.index({ user: 1 });
userTradeSchema.index({ signal: 1 });
userTradeSchema.index({ status: 1 });
userTradeSchema.index({ createdAt: -1 });

const UserTrade = mongoose.model("UserTrade", userTradeSchema);

export default UserTrade;