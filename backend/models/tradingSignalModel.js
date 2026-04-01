// models/tradingSignalModel.js
import mongoose from "mongoose";

const tradingSignalSchema = new mongoose.Schema(
  {
    symbol: {
      type: String,
      required: true,
      enum: [
        // Forex majors / minors / crosses
        "EURUSD",
        "GBPUSD",
        "USDJPY",
        "USDCHF",
        "USDCAD",
        "AUDUSD",
        "NZDUSD",
        "EURGBP",
        "EURJPY",
        "GBPJPY",
        "AUDJPY",
        "CADJPY",
        "CHFJPY",
        "EURAUD",
        "EURNZD",
        "GBPAUD",
        "GBPCAD",
        "GBPCHF",
        "GBPNZD",
        "AUDCAD",
        "AUDCHF",
        "AUDNZD",
        "NZDJPY",
        "NZDCAD",
        "NZDCHF",
        "EURCAD",
        "EURCHF",
        "NZDUSD",

        // Metals / commodities
        "XAUUSD",
        "XAGUSD",
        "XPTUSD",
        "XPDUSD",
        "USOIL",
        "UKOIL",
        "NGAS",

        // Crypto
        "BTCUSD",
        "ETHUSD",
        "SOLUSD",
        "BNBUSD",
        "XRPUSD",
        "ADAUSD",
        "DOGEUSD",
        "LTCUSD",

        // Indices
        "NAS100",
        "US30",
        "SPX500",
        "GER40",
        "UK100",
        "JP225",
        "HK50",
        "AUS200",
        "FRA40",
        "EU50",

        // Stocks
        "AAPL",
        "AMZN",
        "TSLA",
        "META",
        "MSFT",
        "NVDA",
        "GOOGL",
        "NFLX",
        "AMD",
        "INTC",
        "BABA",
        "UBER",
        "JPM",
        "BAC",
        "V",
        "MA",
        "DIS",
        "NKE",
        "KO",
        "PEP",
      ],
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
      min: 0,
      max: 100,
      default: 0,
    },
    lossPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 0,
    },
    description: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["active", "completed", "expired"],
      default: "active",
    },
    result: {
      type: String,
      enum: ["profit", "loss", null],
      default: null,
    },
    actualPrice: {
      type: Number,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date("2099-12-31T23:59:59.999Z"),
    },
    completedAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

tradingSignalSchema.index({ status: 1 });
tradingSignalSchema.index({ expiresAt: 1 });
tradingSignalSchema.index({ symbol: 1 });

const TradingSignal = mongoose.model("TradingSignal", tradingSignalSchema);

export default TradingSignal;