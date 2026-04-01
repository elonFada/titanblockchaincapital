import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

import {
  submitTradingBotPayment,
  getMyTradingBotPayment,
  getAllTradingBotPayments,
  getTradingBotPaymentById,
  approveTradingBotPayment,
  rejectTradingBotPayment,
} from "../controllers/tradingBotController.js";

import { protect, adminProtect } from "../middleware/authMiddleware.js";

const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "TitanBlockchain_trading_bot",
    allowed_formats: ["jpg", "png", "jpeg", "webp", "pdf"],
  },
});

const upload = multer({ storage });

// USER
router.post("/payment", protect, upload.single("receipt"), submitTradingBotPayment);
router.get("/payment/me", protect, getMyTradingBotPayment);

// ADMIN
router.get("/payment/admin/all", adminProtect, getAllTradingBotPayments);
router.get("/payment/admin/:id", adminProtect, getTradingBotPaymentById);
router.post("/payment/admin/:id/approve", adminProtect, approveTradingBotPayment);
router.post("/payment/admin/:id/reject", adminProtect, rejectTradingBotPayment);

export default router;