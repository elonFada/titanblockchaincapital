import express from 'express';
import {
  // Admin signal management
  createSignal,
  getAllSignals,
  getSignalById,
  updateSignal,
  deleteSignal,
  completeSignal,
  // User trading
  getAvailableSignals,
  takeSignal,
  getMyTrades,
  getTradeById,
  // Admin trade management
  getAllUserTrades
} from '../controllers/tradingController.js';
import { protect, adminProtect } from '../middleware/authMiddleware.js';

const router = express.Router();

// ==================== USER ROUTES ====================
router.get('/signals/available', protect, getAvailableSignals);
router.post('/signal/:id/take', protect, takeSignal);
router.get('/my-trades', protect, getMyTrades);
router.get('/trade/:id', protect, getTradeById);

// ==================== ADMIN ROUTES ====================
// Signal management
router.post('/signal', adminProtect, createSignal);
router.get('/signals', adminProtect, getAllSignals);
router.get('/signal/:id', adminProtect, getSignalById);
router.put('/signal/:id', adminProtect, updateSignal);
router.delete('/signal/:id', adminProtect, deleteSignal);
router.post('/signal/:id/complete', adminProtect, completeSignal);

// User trade management
router.get('/admin/trades', adminProtect, getAllUserTrades);

export default router;