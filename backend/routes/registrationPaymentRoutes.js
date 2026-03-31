import express from 'express';
import {
  makePayment,
  getPayments,
  getMyPayment,
  getPaymentById,
  approvePayment,
  rejectPayment,
} from '../controllers/registrationPaymentController.js';
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
    folder: 'TitanBlockchain_receipts',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'pdf'],
  },
});

const upload = multer({ storage });

// Optional: test connection
cloudinary.api
  .ping()
  .then(() => console.log('✅ Cloudinary (receipts) connected successfully'))
  .catch((err) => console.error('❌ Cloudinary not connected:', err.message));


// ==================== USER ROUTES ====================

// 💳 Submit payment receipt
router.post('/', protect, upload.single('receipt'), makePayment);

// 👤 Get my payment
router.get('/me', protect, getMyPayment);


// ==================== ADMIN ROUTES ====================

// 📋 Get all payments (optional ?status=pending/approved/rejected)
router.get('/', adminProtect, getPayments);

// 🔍 Get single payment by ID
router.get('/:id', adminProtect, getPaymentById);

// ✅ Approve payment
router.post('/:id/approve', adminProtect, approvePayment);

// ❌ Reject payment
router.post('/:id/reject', adminProtect, rejectPayment);


export default router;