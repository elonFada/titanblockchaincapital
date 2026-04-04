import express from 'express';
import {
  registerUser,
  verifyOTP,
  resendOTP,
  loginUser,
  logoutUser,
  getProfile,
  updateProfile,
  deleteProfileImage,
  changePassword,
  forgotPassword,
  verifyForgotPasswordOTP,
  resetPassword,
  getUsers,
  getAdminUserById,
  updateUserById,
  deleteUserById,
  adminVerifyUser,
  getUserById,
  deactivateAccount,
  reactivateAccount,
  adminRejectUser,
} from '../controllers/userController.js';
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
    folder: 'TitanBlockchain_profile',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
  },
});

const upload = multer({ storage });

// Optional: test connection
cloudinary.api
  .ping()
  .then(() => console.log('✅ Cloudinary connected successfully'))
  .catch((err) => console.error('❌ Cloudinary not connected:', err.message));


// ==================== PUBLIC ROUTES ====================

// 📝 Register
router.post('/register', upload.single('profile'), registerUser);

// ✅ Verify OTP
router.post('/verify', verifyOTP);

// 🔁 Resend verification
router.post('/resend-verification', resendOTP);

// 🔐 Login
router.post('/login', loginUser);

// 🔐 Forgot password
router.post('/forgot-password', forgotPassword);

// ✅ Verify forgot password OTP
router.post('/forgot-password/verify', verifyForgotPasswordOTP);

// 🔁 Reset password
router.post('/reset-password', resetPassword);


// ==================== PROTECTED ROUTES ====================

// 🚪 Logout
router.post('/logout', protect, logoutUser);

// 👤 Get profile
router.get('/profile', protect, getProfile);

// ✏️ Update profile
router.put('/profile', protect, upload.single('profile'), updateProfile);

// 🗑️ Delete profile image
router.delete('/profile/image', protect, deleteProfileImage);

// 🔑 Change password
router.post('/change-password', protect, changePassword);


// ==================== ADMIN ROUTES ====================

// 👥 Get all users
router.get('/admin/users', adminProtect, getUsers);

// 👤 Get user by ID
router.get('/admin/users/:id', adminProtect, getAdminUserById);

// ✏️ Update user
router.put('/admin/users/:id', adminProtect, updateUserById);

// 🗑️ Delete user
router.delete('/admin/users/:id', adminProtect, deleteUserById);

// ✅ Manually verify user
router.post('/admin/users/:id/verify', adminProtect, adminVerifyUser);

router.post('/admin/users/:id/reject', adminProtect, adminRejectUser);


// ==================== USER MANAGEMENT ROUTES ====================

// 👤 Get user by ID
router.get('/users/:id', protect, getUserById);

// 🔒 Deactivate account
router.post('/users/:id/deactivate', protect, deactivateAccount);

// 🔓 Reactivate account
router.post('/users/:id/reactivate', protect, reactivateAccount);


export default router;