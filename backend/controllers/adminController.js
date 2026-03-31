import asyncHandler from 'express-async-handler';
import Admin from '../models/adminModel.js';
import { generateAdminToken } from '../utils/generateToken.js';

// @desc    Register admin
// @route   POST /api/admin/register
// @access  Public (remove after creating admin)
const registerAdmin = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please provide name, email and password');
  }

  const adminExists = await Admin.findOne({ email });
  if (adminExists) {
    res.status(409);
    throw new Error('Admin already exists');
  }

  const admin = await Admin.create({
    name,
    email,
    password,
    isActive: true
  });

  const token = generateAdminToken(res, admin._id);

  res.status(201).json({
    success: true,
    message: 'Admin created successfully',
    token,
    admin: {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      isActive: admin.isActive
    }
  });
});

// @desc    Login admin
// @route   POST /api/admin/login
// @access  Public
const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }

  const admin = await Admin.findOne({ email });

  if (!admin) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  if (!admin.isActive) {
    res.status(403);
    throw new Error('Admin account is deactivated');
  }

  const isValidPassword = await admin.comparePassword(password);

  if (!isValidPassword) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  admin.lastLoginAt = new Date();
  await admin.save();

  const token = generateAdminToken(res, admin._id);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    token,
    admin: {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      isActive: admin.isActive,
      lastLoginAt: admin.lastLoginAt
    }
  });
});

// @desc    Logout admin
// @route   POST /api/admin/logout
// @access  Private/Admin
const logoutAdmin = asyncHandler(async (req, res) => {
  res.cookie('admin_jwt', '', {
    httpOnly: true,
    expires: new Date(0),
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'None'
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

export {
  registerAdmin,
  loginAdmin,
  logoutAdmin
};