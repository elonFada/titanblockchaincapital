import express from "express";
import {
  submitWithdrawal,
  getMyWithdrawals,
  getWithdrawalById,
  getAllWithdrawals,
  approveWithdrawal,
  markWithdrawalAsPaid,
  rejectWithdrawal,
  getWithdrawalStats,
} from "../controllers/withdrawalController.js";
import { protect, adminProtect } from "../middleware/authMiddleware.js";

const router = express.Router();

// USER
router.post("/", protect, submitWithdrawal);
router.get("/me", protect, getMyWithdrawals);
router.get("/:id", protect, getWithdrawalById);

// ADMIN
router.get("/admin/all", adminProtect, getAllWithdrawals);
router.get("/admin/stats", adminProtect, getWithdrawalStats);
router.post("/admin/:id/approve", adminProtect, approveWithdrawal);
router.post("/admin/:id/paid", adminProtect, markWithdrawalAsPaid);
router.post("/admin/:id/reject", adminProtect, rejectWithdrawal);

export default router;