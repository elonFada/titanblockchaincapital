import asyncHandler from 'express-async-handler';
import Deposit from '../models/depositModel.js';
import User from '../models/userModel.js';
import { sendDepositEmail } from '../utils/emailService.js';

// @desc    Submit deposit receipt
// @route   POST /api/deposit
// @access  Private
const submitDeposit = asyncHandler(async (req, res) => {
  const user = req.user;
  const { amount, transactionId, coinType } = req.body;

  if (!amount || !transactionId || !coinType) {
    res.status(400);
    throw new Error('Amount, transaction ID, and coin type are required');
  }

  if (!req.file) {
    res.status(400);
    throw new Error('Deposit receipt is required');
  }

  const numericAmount = Number(amount);

  if (Number.isNaN(numericAmount) || numericAmount <= 0) {
    res.status(400);
    throw new Error('Please enter a valid deposit amount');
  }

  if (numericAmount < 5000) {
    res.status(400);
    throw new Error('Minimum deposit amount is $5000');
  }

  // Check for pending deposit
  const existingPending = await Deposit.findOne({
    user: user._id,
    status: 'pending'
  });

  if (existingPending) {
    res.status(400);
    throw new Error('You already have a pending deposit. Please wait for approval.');
  }

  // Create deposit record
  const deposit = await Deposit.create({
    user: user._id,
    amount: numericAmount,
    transactionId: transactionId.trim(),
    coinType,
    receipt: req.file.path,
    receiptPublicId: req.file.filename,
    status: 'pending'
  });

  // Send email notification
  await sendDepositEmail({
    to: user.email,
    fullName: user.fullName,
    type: 'submitted',
    amount: deposit.amount,
    transactionId: deposit.transactionId,
    coinType: deposit.coinType
  });

  res.status(201).json({
    success: true,
    message: 'Deposit receipt submitted successfully. Awaiting admin approval.',
    data: {
      id: deposit._id,
      amount: deposit.amount,
      transactionId: deposit.transactionId,
      coinType: deposit.coinType,
      status: deposit.status,
      submittedAt: deposit.createdAt
    }
  });
});

// @desc    Get my deposits
// @route   GET /api/deposit/me
// @access  Private
const getMyDeposits = asyncHandler(async (req, res) => {
  const deposits = await Deposit.find({ user: req.user._id })
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: deposits.length,
    data: deposits
  });
});

// @desc    Get single deposit by ID
// @route   GET /api/deposit/:id
// @access  Private
const getDepositById = asyncHandler(async (req, res) => {
  const deposit = await Deposit.findById(req.params.id);

  if (!deposit) {
    res.status(404);
    throw new Error('Deposit not found');
  }

  if (deposit.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to view this deposit');
  }

  res.status(200).json({
    success: true,
    data: deposit
  });
});

// ==================== ADMIN ENDPOINTS ====================

// @desc    Get all deposits (Admin)
// @route   GET /api/deposit/admin/all
// @access  Private/Admin
const getAllDeposits = asyncHandler(async (req, res) => {
  const { status } = req.query;

  const filter = {};
  if (status) filter.status = status;

  const deposits = await Deposit.find(filter)
    .populate('user', 'fullName email phoneNumber')
    .populate('approvedBy', 'name email')
    .sort('-createdAt');

  const stats = {
    total: deposits.length,
    pending: deposits.filter(d => d.status === 'pending').length,
    approved: deposits.filter(d => d.status === 'approved').length,
    rejected: deposits.filter(d => d.status === 'rejected').length,
    totalAmount: deposits
      .filter(d => d.status === 'approved')
      .reduce((sum, d) => sum + d.amount, 0)
  };

  res.status(200).json({
    success: true,
    stats,
    count: deposits.length,
    data: deposits
  });
});

// @desc    Approve deposit (Admin)
// @route   POST /api/deposit/admin/:id/approve
// @access  Private/Admin
const approveDeposit = asyncHandler(async (req, res) => {
  const deposit = await Deposit.findById(req.params.id).populate('user');

  if (!deposit) {
    res.status(404);
    throw new Error('Deposit not found');
  }

  if (deposit.status === 'approved') {
    res.status(400);
    throw new Error('Deposit has already been approved');
  }

  if (deposit.status === 'rejected') {
    res.status(400);
    throw new Error('Deposit was rejected. User must submit a new deposit.');
  }

  deposit.status = 'approved';
  deposit.approvedBy = req.admin._id;
  deposit.approvedAt = new Date();
  await deposit.save();

  const user = await User.findById(deposit.user._id);

  user.totalDeposit = (user.totalDeposit || 0) + deposit.amount;
  user.balance = (user.balance || 0) + deposit.amount;
  await user.save();

  await sendDepositEmail({
    to: user.email,
    fullName: user.fullName,
    type: 'approved',
    amount: deposit.amount,
    transactionId: deposit.transactionId,
    coinType: deposit.coinType
  });

  res.status(200).json({
    success: true,
    message: 'Deposit approved. User balance updated.',
    data: {
      id: deposit._id,
      amount: deposit.amount,
      status: deposit.status,
      userBalance: user.balance,
      userTotalDeposit: user.totalDeposit
    }
  });
});

// @desc    Reject deposit (Admin)
// @route   POST /api/deposit/admin/:id/reject
// @access  Private/Admin
const rejectDeposit = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  if (!reason) {
    res.status(400);
    throw new Error('Rejection reason is required');
  }

  const deposit = await Deposit.findById(req.params.id).populate('user');

  if (!deposit) {
    res.status(404);
    throw new Error('Deposit not found');
  }

  if (deposit.status === 'approved') {
    res.status(400);
    throw new Error('Deposit has already been approved and cannot be rejected');
  }

  if (deposit.status === 'rejected') {
    res.status(400);
    throw new Error('Deposit has already been rejected');
  }

  deposit.status = 'rejected';
  deposit.rejectionReason = reason;
  deposit.approvedBy = req.admin._id;
  deposit.approvedAt = new Date();
  await deposit.save();

  await sendDepositEmail({
    to: deposit.user.email,
    fullName: deposit.user.fullName,
    type: 'rejected',
    amount: deposit.amount,
    transactionId: deposit.transactionId,
    coinType: deposit.coinType,
    reason
  });

  res.status(200).json({
    success: true,
    message: 'Deposit rejected',
    data: {
      id: deposit._id,
      status: deposit.status,
      rejectionReason: deposit.rejectionReason
    }
  });
});

// @desc    Get deposit stats (Admin)
// @route   GET /api/deposit/admin/stats
// @access  Private/Admin
const getDepositStats = asyncHandler(async (req, res) => {
  const stats = await Deposit.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);

  const pending = stats.find(s => s._id === 'pending') || { count: 0, totalAmount: 0 };
  const approved = stats.find(s => s._id === 'approved') || { count: 0, totalAmount: 0 };
  const rejected = stats.find(s => s._id === 'rejected') || { count: 0, totalAmount: 0 };

  res.status(200).json({
    success: true,
    stats: {
      pending: { count: pending.count, amount: pending.totalAmount },
      approved: { count: approved.count, amount: approved.totalAmount },
      rejected: { count: rejected.count, amount: rejected.totalAmount },
      total: {
        count: pending.count + approved.count + rejected.count,
        amount: pending.totalAmount + approved.totalAmount + rejected.totalAmount
      }
    }
  });
});

export {
  submitDeposit,
  getMyDeposits,
  getDepositById,
  getAllDeposits,
  approveDeposit,
  rejectDeposit,
  getDepositStats
};