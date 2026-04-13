import express from "express";
import {
  generateReferralCode,
  getReferralStats,
  getReferralLeaderboard,
  requestReferralWithdrawal,
  getMyReferralWithdrawals,
  getReferralWithdrawals,
  payReferralWithdrawal,
  rejectReferralWithdrawal,
} from "../controllers/referralController.js";
import { protect, adminProtect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public
router.get("/leaderboard", getReferralLeaderboard);

// User
router.post("/generate-code", protect, generateReferralCode);
router.get("/stats", protect, getReferralStats);
router.post("/withdraw", protect, requestReferralWithdrawal);
router.get("/withdrawals/me", protect, getMyReferralWithdrawals);

// Admin
router.get("/withdrawals", adminProtect, getReferralWithdrawals);
router.post("/withdrawals/:id/pay", adminProtect, payReferralWithdrawal);
router.post("/withdrawals/:id/reject", adminProtect, rejectReferralWithdrawal);

export default router;