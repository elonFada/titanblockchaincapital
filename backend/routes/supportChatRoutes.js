import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

import {
  getMySupportChat,
  sendUserSupportMessage,
  getAllSupportChats,
  getSupportChatById,
  sendAdminSupportReply,
} from "../controllers/supportChatController.js";

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
    folder: "TitanBlockchain_support_chat",
    allowed_formats: ["jpg", "png", "jpeg", "webp", "pdf", "doc", "docx"],
    resource_type: "auto",
  },
});

const upload = multer({ storage });

// USER
router.get("/me", protect, getMySupportChat);
router.post("/message", protect, upload.single("attachment"), sendUserSupportMessage);

// ADMIN
router.get("/admin/all", adminProtect, getAllSupportChats);
router.get("/admin/:id", adminProtect, getSupportChatById);
router.post("/admin/:id/reply", adminProtect, upload.single("attachment"), sendAdminSupportReply);

export default router;