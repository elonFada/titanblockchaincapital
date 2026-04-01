import asyncHandler from 'express-async-handler';
import RegistrationPayment from '../models/registrationPaymentModel.js';
import User from '../models/userModel.js';
import { sendPaymentEmail } from '../utils/emailService.js';


// @desc    Submit registration payment
// @route   POST /api/payment/registration
// @access  Private
const makePayment = asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user.isVerified) {
    res.status(403);
    throw new Error('Please verify your email before making a payment');
  }

  if (!user.isActive) {
    res.status(403);
    throw new Error('Your account is inactive. Please contact support.');
  }

  const existingApproved = await RegistrationPayment.findOne({
    user: user._id,
    status: 'approved',
  });

  if (existingApproved) {
    res.status(400);
    throw new Error('Registration fee has already been paid and approved');
  }

  const existingPending = await RegistrationPayment.findOne({
    user: user._id,
    status: 'pending',
  });

  if (existingPending) {
    res.status(400);
    throw new Error(
      'You already have a pending payment under review. Please wait for admin approval.'
    );
  }

  if (!req.file) {
    res.status(400);
    throw new Error('Payment receipt is required');
  }

  const { coin, walletAddress, transactionId } = req.body;

  if (!coin) {
    res.status(400);
    throw new Error('Payment coin is required');
  }

  if (!walletAddress) {
    res.status(400);
    throw new Error('Wallet address is required');
  }

  if (!transactionId) {
    res.status(400);
    throw new Error('Transaction ID is required');
  }

  const allowedCoins = ['BTC', 'ETH', 'USDT_TRC20', 'USDT_ERC20', 'BNB'];
  if (!allowedCoins.includes(coin)) {
    res.status(400);
    throw new Error('Invalid payment coin selected');
  }

  const cleanedWalletAddress = String(walletAddress).trim();
  const cleanedTransactionId = String(transactionId).trim();

  const existingTransaction = await RegistrationPayment.findOne({
    transactionId: cleanedTransactionId,
  });

  if (existingTransaction) {
    res.status(400);
    throw new Error('This transaction ID has already been used');
  }

  const payment = await RegistrationPayment.create({
    user: user._id,
    feeType: 'registration',
    amount: 500,
    coin,
    walletAddress: cleanedWalletAddress,
    transactionId: cleanedTransactionId,
    receipt: req.file.path,
    receiptPublicId: req.file.filename,
    status: 'pending',
  });

  user.kycStatus = 'submitted';
  await user.save();

  await sendPaymentEmail({
    to: user.email,
    fullName: user.fullName,
    type: 'submitted',
    amount: payment.amount,
  });

  res.status(201).json({
    status: 'success',
    message: 'Payment receipt submitted successfully. Awaiting admin approval.',
    data: {
      id: payment._id,
      feeType: payment.feeType,
      amount: payment.amount,
      coin: payment.coin,
      walletAddress: payment.walletAddress,
      transactionId: payment.transactionId,
      receipt: payment.receipt,
      status: payment.status,
      submittedAt: payment.createdAt,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        kycStatus: user.kycStatus,
      },
    },
  });
});


// @desc    Get all registration payments
// @route   GET /api/payment/registration
// @access  Private/Admin
const getPayments = asyncHandler(async (req, res) => {
  const { status } = req.query;

  const filter = {};
  if (status) filter.status = status;

  const payments = await RegistrationPayment.find(filter)
    .populate('user', 'fullName email phoneNumber countryCode kycStatus profileImage createdAt')
    .populate('reviewedBy', 'fullName email')
    .sort('-createdAt');

  const stats = {
    total: payments.length,
    pending: payments.filter(p => p.status === 'pending').length,
    approved: payments.filter(p => p.status === 'approved').length,
    rejected: payments.filter(p => p.status === 'rejected').length,
  };

  res.status(200).json({
    status: 'success',
    stats,
    count: payments.length,
    data: payments,
  });
});


// @desc    Get my registration payment
// @route   GET /api/payment/registration/me
// @access  Private
const getMyPayment = asyncHandler(async (req, res) => {
  const payment = await RegistrationPayment.findOne({ user: req.user._id })
    .sort('-createdAt');

  if (!payment) {
    res.status(404);
    throw new Error('No registration payment found');
  }

  res.status(200).json({ status: 'success', data: payment });
});


// @desc    Get single payment by ID
// @route   GET /api/payment/registration/:id
// @access  Private/Admin
const getPaymentById = asyncHandler(async (req, res) => {
  const payment = await RegistrationPayment.findById(req.params.id)
    .populate('user', 'fullName email phoneNumber countryCode kycStatus profileImage createdAt')
    .populate('reviewedBy', 'fullName email');

  if (!payment) {
    res.status(404);
    throw new Error('Payment not found');
  }

  res.status(200).json({ status: 'success', data: payment });
});


// @desc    Approve registration payment
// @route   POST /api/payment/registration/:id/approve
// @access  Private/Admin
const approvePayment = asyncHandler(async (req, res) => {
  const payment = await RegistrationPayment.findById(req.params.id).populate('user');

  if (!payment) {
    res.status(404);
    throw new Error('Payment not found');
  }

  if (payment.status === 'approved') {
    res.status(400);
    throw new Error('Payment has already been approved');
  }

  if (payment.status === 'rejected') {
    res.status(400);
    throw new Error('Payment was rejected. User must resubmit a new receipt.');
  }

  payment.status = 'approved';
  payment.reviewedBy = req.admin._id;  // ✅ was req.user._id
  payment.reviewedAt = new Date();
  payment.rejectionReason = undefined;
  await payment.save();

  // Update user kycStatus to verified
  await User.findByIdAndUpdate(payment.user._id, {
    kycStatus: 'verified',
    kycVerifiedAt: new Date(),
  });

  // Send approval email to user
  const dashboardUrl = `${process.env.FRONTEND_URL}/dashboard.html`;

  await sendPaymentEmail({
    to: payment.user.email,
    fullName: payment.user.fullName,
    type: 'approved',
    amount: payment.amount,
    dashboardUrl,
  });

  res.status(200).json({
    status: 'success',
    message: 'Payment approved. User KYC status updated to verified.',
    data: {
      id: payment._id,
      status: payment.status,
      reviewedAt: payment.reviewedAt,
      user: {
        id: payment.user._id,
        fullName: payment.user.fullName,
        email: payment.user.email,
        kycStatus: 'verified',
      }
    }
  });
});

// @desc    Reject registration payment
// @route   POST /api/payment/registration/:id/reject
// @access  Private/Admin
const rejectPayment = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  if (!reason) {
    res.status(400);
    throw new Error('Please provide a rejection reason');
  }

  const payment = await RegistrationPayment.findById(req.params.id).populate('user');

  if (!payment) {
    res.status(404);
    throw new Error('Payment not found');
  }

  if (payment.status === 'approved') {
    res.status(400);
    throw new Error('Payment has already been approved and cannot be rejected');
  }

  if (payment.status === 'rejected') {
    res.status(400);
    throw new Error('Payment has already been rejected');
  }

  payment.status = 'rejected';
  payment.reviewedBy = req.admin._id;  // ✅ was req.user._id
  payment.reviewedAt = new Date();
  payment.rejectionReason = reason;
  await payment.save();

  // Revert user kycStatus back to pending
  await User.findByIdAndUpdate(payment.user._id, {
    kycStatus: 'pending',
    kycRejectedAt: new Date(),
    kycRejectionReason: reason,
  });

  // Send rejection email to user
  await sendPaymentEmail({
    to: payment.user.email,
    fullName: payment.user.fullName,
    type: 'rejected',
    amount: payment.amount,
    reason,
  });

  res.status(200).json({
    status: 'success',
    message: 'Payment rejected. User KYC status reverted to pending.',
    data: {
      id: payment._id,
      status: payment.status,
      rejectionReason: payment.rejectionReason,
      reviewedAt: payment.reviewedAt,
      user: {
        id: payment.user._id,
        fullName: payment.user.fullName,
        email: payment.user.email,
        kycStatus: 'pending',
      }
    }
  });
});


export {
  makePayment,
  getPayments,
  getMyPayment,
  getPaymentById,
  approvePayment,
  rejectPayment,
};