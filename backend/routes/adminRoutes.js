import express from 'express';
import {
  registerAdmin,
  loginAdmin,
  logoutAdmin
} from '../controllers/adminController.js';
import { adminProtect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', registerAdmin);  // Remove this after creating admin
router.post('/login', loginAdmin);

// Protected routes
router.post('/logout', adminProtect, logoutAdmin);

export default router;