import express from 'express';
import {
  submitDeposit,
  getMyDeposits,
  getDepositById,
  getAllDeposits,
  approveDeposit,
  rejectDeposit,
  getDepositStats
} from '../controllers/depositController.js';
import { protect, adminProtect } from '../middleware/authMiddleware.js';

import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

const router = express.Router();

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// Multer -> Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'TitanBlockchain_receipt',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
  },
});

const upload = multer({ storage });

// Optional: test connection
cloudinary.api
  .ping()
  .then(() => console.log('✅ Cloudinary connected successfully'))
  .catch((err) => console.error('❌ Cloudinary not connected:', err.message));


// User routes
router.post('/', protect, upload.single('receipt'), submitDeposit);
router.get('/me', protect, getMyDeposits);
router.get('/:id', protect, getDepositById);

// Admin routes
router.get('/admin/all', adminProtect, getAllDeposits);
router.get('/admin/stats', adminProtect, getDepositStats);
router.post('/admin/:id/approve', adminProtect, approveDeposit);
router.post('/admin/:id/reject', adminProtect, rejectDeposit);

export default router;