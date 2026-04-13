import crypto from "crypto";
import asyncHandler from "express-async-handler";
import { v2 as cloudinary } from "cloudinary";
import User from "../models/userModel.js";
import { generateUserToken, clearUserToken } from "../utils/generateToken.js";
import { generateOTP, getOTPExpiry } from "../utils/otpResend.js";
import { sendEmailOTP } from "../utils/emailService.js";
import {
  validateFullName,
  validateEmail,
  validatePhoneNumber,
  validatePassword,
  validatePasswordMatch,
} from "../utils/validators.js";
import { sendPasswordResetOTPEmail } from "../utils/emailService.js";

const generateVerificationToken = () => {
  return crypto.randomBytes(24).toString("hex");
};

const generateResetSessionToken = () => {
  return crypto.randomBytes(24).toString("hex");
};

const rollbackPasswordResetState = async (user) => {
  try {
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpiry = undefined;
    user.resetPasswordToken = undefined;
    user.resetPasswordSessionToken = undefined;
    user.resetPasswordSessionExpiry = undefined;
    await user.save();
  } catch (error) {
    console.error("❌ Failed to rollback password reset state:", error);
  }
};

const sanitizeUserResponse = (user) => ({
  id: user._id,
  fullName: user.fullName,
  email: user.email,
  phoneNumber: `${user.countryCode}${user.phoneNumber}`,
  role: user.role,
  kycStatus: user.kycStatus,
  accountType: user.accountType,
  preferences: user.preferences,
  profileImage: user.profileImage,
  isVerified: user.isVerified,
  verifiedAt: user.verifiedAt,
  isActive: user.isActive,
  withdrawalWalletType: user.withdrawalWalletType,
  withdrawalWalletAddress: user.withdrawalWalletAddress,
  withdrawalWalletLocked: user.withdrawalWalletLocked,
  referralCode: user.referralCode,
  referralEarnings: user.referralEarnings,
  referralCommissionPaid: user.referralCommissionPaid,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  lastLoginAt: user.lastLoginAt,
});

const rollbackVerificationState = async (user) => {
  try {
    user.otp = undefined;
    user.otpExpiry = undefined;
    user.verificationToken = undefined;
    user.lastOTPRequest = undefined;
    await user.save();
  } catch (error) {
    console.error("❌ Failed to rollback verification state:", error);
  }
};

/// @desc    Register new user with referral support
// @route   POST /api/user/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const {
    fullName,
    email,
    phoneNumber,
    password,
    confirmPassword,
    countryCode = "+1",
    referralCode, // New field for referral code
  } = req.body;

  if (!fullName || !email || !phoneNumber || !password || !confirmPassword) {
    res.status(400);
    throw new Error(
      "Please provide all required fields: full name, email, phone number, password, and confirm password",
    );
  }

  if (!validateFullName(fullName)) {
    res.status(400);
    throw new Error("Full name must be between 2 and 50 characters");
  }

  if (!validateEmail(email)) {
    res.status(400);
    throw new Error("Please provide a valid email address");
  }

  if (!validatePhoneNumber(phoneNumber)) {
    res.status(400);
    throw new Error("Please provide a valid phone number (10-15 digits)");
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    const errorMessages = Object.values(passwordValidation.errors).filter(
      Boolean,
    );
    res.status(400);
    throw new Error(errorMessages.join(". "));
  }

  if (!validatePasswordMatch(password, confirmPassword)) {
    res.status(400);
    throw new Error("Passwords do not match");
  }

  const normalizedEmail = email.toLowerCase().trim();
  const normalizedPhone = phoneNumber.trim();

  const verifiedEmailUser = await User.findOne({
    email: normalizedEmail,
    isVerified: true,
  });

  if (verifiedEmailUser) {
    res.status(409);
    throw new Error("An account with this email already exists");
  }

  const verifiedPhoneUser = await User.findOne({
    phoneNumber: normalizedPhone,
    isVerified: true,
  });

  if (verifiedPhoneUser) {
    res.status(409);
    throw new Error("An account with this phone number already exists");
  }

  // Handle referral code if provided
  let referredByUser = null;
  let generatedReferralCode = null;

  if (referralCode) {
    // Find the referrer by their referral code
    referredByUser = await User.findOne({referralCode: String(referralCode).trim().toUpperCase(),});

    if (!referredByUser) {
      res.status(400);
      throw new Error("Invalid referral code. Please check and try again.");
    }

    // Don't allow self-referral
    if (referredByUser.email === normalizedEmail) {
      res.status(400);
      throw new Error("You cannot use your own referral code");
    }
  }

  const emailOTP = generateOTP();
  const otpExpiry = getOTPExpiry();
  const verificationToken = generateVerificationToken();

  // Generate a unique referral code for the new user
  const generateUniqueReferralCode = async () => {
    let code;
    let isUnique = false;

    while (!isUnique) {
      code = crypto.randomBytes(4).toString("hex").toUpperCase();
      const existingUser = await User.findOne({ referralCode: code });
      if (!existingUser) {
        isUnique = true;
      }
    }
    return code;
  };

  generatedReferralCode = await generateUniqueReferralCode();

  let user = await User.findOne({ email: normalizedEmail, isVerified: false });

  if (!user) {
    user = await User.findOne({
      phoneNumber: normalizedPhone,
      isVerified: false,
    });
  }

  if (user) {
    if (
      req.file &&
      user.profileImagePublicId &&
      user.profileImagePublicId !== req.file.filename
    ) {
      try {
        await cloudinary.uploader.destroy(user.profileImagePublicId);
      } catch (error) {
        console.warn(
          "⚠️ Failed to remove previous profile image:",
          error.message,
        );
      }
    }

    user.fullName = fullName.trim();
    user.email = normalizedEmail;
    user.phoneNumber = normalizedPhone;
    user.password = password;
    user.countryCode = countryCode;
    user.otp = emailOTP;
    user.otpExpiry = otpExpiry;
    user.verificationToken = verificationToken;
    user.failedVerificationAttempts = 0;
    user.lastOTPRequest = new Date();
    user.kycStatus = "pending";
    user.isVerified = false;
    user.isPhoneVerified = false;
    user.referralCode = generatedReferralCode;

    // Set referral information
    if (referredByUser) {
      user.referredBy = referredByUser._id;
    }

    if (req.file) {
      user.profileImage = req.file.path;
      user.profileImagePublicId = req.file.filename;
    }

    await user.save();

    // Add user to referrer's referrals list
    if (referredByUser) {
      referredByUser.referrals.push({
        user: user._id,
        registeredAt: new Date(),
        paidRegistrationFee: false,
        commissionPaid: false,
      });
      await referredByUser.save();
    }
  } else {
    user = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      phoneNumber: normalizedPhone,
      password,
      countryCode,
      otp: emailOTP,
      otpExpiry,
      verificationToken,
      isVerified: false,
      isPhoneVerified: false,
      failedVerificationAttempts: 0,
      lastOTPRequest: new Date(),
      kycStatus: "pending",
      profileImage: req.file?.path || null,
      profileImagePublicId: req.file?.filename || null,
      referralCode: generatedReferralCode,
      referredBy: referredByUser ? referredByUser._id : null,
    });

    // Add user to referrer's referrals list
    if (referredByUser) {
      referredByUser.referrals.push({
        user: user._id,
        registeredAt: new Date(),
        paidRegistrationFee: false,
        commissionPaid: false,
      });
      await referredByUser.save();
    }
  }

  try {
    await sendEmailOTP(user.email, emailOTP, user.fullName, "verification");
  } catch (error) {
    await rollbackVerificationState(user);
    res.status(500);
    throw new Error("Failed to send verification email. Please try again.");
  }

  res.status(201).json({
    status: "pending",
    message: "Registration successful. Verification code sent to your email.",
    verificationToken,
    email: user.email,
    phoneNumber: `${user.countryCode}${user.phoneNumber}`,
    referralCode: user.referralCode,
    referredBy: referredByUser ? referredByUser.referralCode : null,
    expiresIn: "15 minutes",
    nextSteps: {
      email: "Check your email for verification code",
      verify: "Use /api/user/verify to complete registration",
    },
  });
});

// @desc    Verify email OTP
// @route   POST /api/user/verify
// @access  Public
const verifyOTP = asyncHandler(async (req, res) => {
  const { email, emailOTP, verificationToken } = req.body;

  if (!email || !emailOTP || !verificationToken) {
    res.status(400);
    throw new Error(
      "Verification requires email, email OTP, and verification token",
    );
  }

  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({
    email: normalizedEmail,
    verificationToken,
    otpExpiry: { $gt: new Date() },
  }).select("+otp +failedVerificationAttempts");

  if (!user) {
    res.status(400);
    throw new Error("Invalid or expired verification request");
  }

  if (user.isVerified) {
    res.status(400);
    throw new Error("Account already verified");
  }

  if (user.failedVerificationAttempts >= 5) {
    res.status(429);
    throw new Error(
      "Too many failed attempts. Please request a new verification code.",
    );
  }

  if (String(user.otp) !== String(emailOTP).trim()) {
    user.failedVerificationAttempts += 1;
    await user.save();
    res.status(400);
    throw new Error("Invalid verification code");
  }

  user.isVerified = true;
  user.verifiedAt = new Date();
  user.otp = undefined;
  user.otpExpiry = undefined;
  user.verificationToken = undefined;
  user.failedVerificationAttempts = 0;
  await user.save();

  const token = generateUserToken(res, user._id);

  console.log("✅ User verified successfully:", {
    userId: user._id,
    email: user.email,
    fullName: user.fullName,
  });

  res.status(200).json({
    status: "verified",
    message: "Account successfully verified",
    session: {
      token,
      expiresIn: "7 days",
      type: "Bearer",
    },
    user: sanitizeUserResponse(user),
  });
});

// @desc    Request forgot password OTP
// @route   POST /api/user/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error("Email address is required");
  }

  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({ email: normalizedEmail }).select(
    "+resetPasswordOTP +resetPasswordOTPExpiry +resetPasswordToken +lastPasswordResetRequest",
  );

  if (!user) {
    res.status(404);
    throw new Error("No account associated with this email");
  }

  if (!user.isActive) {
    res.status(403);
    throw new Error(
      "This account has been deactivated. Please contact support.",
    );
  }

  const lastRequest = user.lastPasswordResetRequest;
  if (lastRequest && Date.now() - new Date(lastRequest).getTime() < 60 * 1000) {
    res.status(429);
    throw new Error(
      "Please wait 60 seconds before requesting a new reset code",
    );
  }

  const resetOTP = generateOTP();
  const resetOTPExpiry = getOTPExpiry();
  const resetPasswordToken = generateVerificationToken();

  user.resetPasswordOTP = resetOTP;
  user.resetPasswordOTPExpiry = resetOTPExpiry;
  user.resetPasswordToken = resetPasswordToken;
  user.resetPasswordSessionToken = undefined;
  user.resetPasswordSessionExpiry = undefined;
  user.lastPasswordResetRequest = new Date();

  await user.save();

  try {
    await sendPasswordResetOTPEmail(user.email, resetOTP, user.fullName);
  } catch (error) {
    await rollbackPasswordResetState(user);
    res.status(500);
    throw new Error("Failed to send password reset email. Please try again.");
  }

  res.status(200).json({
    status: "reset_otp_sent",
    message: "Password reset code sent to your email",
    resetToken: resetPasswordToken,
    email: user.email,
    expiresIn: "15 minutes",
    nextRequestAvailable: "60 seconds",
  });
});

// @desc    Verify forgot password OTP
// @route   POST /api/user/forgot-password/verify
// @access  Public
const verifyForgotPasswordOTP = asyncHandler(async (req, res) => {
  const { email, otp, resetToken } = req.body;

  if (!email || !otp || !resetToken) {
    res.status(400);
    throw new Error("Email, OTP, and reset token are required");
  }

  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({
    email: normalizedEmail,
    resetPasswordToken: resetToken,
    resetPasswordOTPExpiry: { $gt: new Date() },
  }).select(
    "+resetPasswordOTP +resetPasswordOTPExpiry +resetPasswordToken +resetPasswordSessionToken +resetPasswordSessionExpiry",
  );

  if (!user) {
    res.status(400);
    throw new Error("Invalid or expired password reset request");
  }

  if (String(user.resetPasswordOTP) !== String(otp).trim()) {
    res.status(400);
    throw new Error("Invalid reset code");
  }

  const resetSessionToken = generateResetSessionToken();

  user.resetPasswordOTP = undefined;
  user.resetPasswordOTPExpiry = undefined;
  user.resetPasswordSessionToken = resetSessionToken;
  user.resetPasswordSessionExpiry = new Date(Date.now() + 15 * 60 * 1000);

  await user.save();

  res.status(200).json({
    status: "reset_verified",
    message: "Email verified successfully",
    email: user.email,
    resetSessionToken,
    expiresIn: "15 minutes",
  });
});

// @desc    Reset password after OTP verification
// @route   POST /api/user/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { email, resetSessionToken, newPassword, confirmNewPassword } =
    req.body;

  if (!email || !resetSessionToken || !newPassword || !confirmNewPassword) {
    res.status(400);
    throw new Error(
      "Email, reset session token, new password, and confirm password are required",
    );
  }

  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({
    email: normalizedEmail,
    resetPasswordSessionToken: resetSessionToken,
    resetPasswordSessionExpiry: { $gt: new Date() },
  }).select(
    "+password +resetPasswordSessionToken +resetPasswordSessionExpiry +resetPasswordToken",
  );

  if (!user) {
    res.status(400);
    throw new Error("Invalid or expired password reset session");
  }

  if (!validatePasswordMatch(newPassword, confirmNewPassword)) {
    res.status(400);
    throw new Error("Passwords do not match");
  }

  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.isValid) {
    const errorMessages = Object.values(passwordValidation.errors).filter(
      Boolean,
    );
    res.status(400);
    throw new Error(errorMessages.join(". "));
  }

  const isSameAsCurrent = await user.comparePassword(newPassword);
  if (isSameAsCurrent) {
    res.status(400);
    throw new Error(
      "Try another password. You cannot use your current password again",
    );
  }

  user.password = newPassword;
  user.resetPasswordOTP = undefined;
  user.resetPasswordOTPExpiry = undefined;
  user.resetPasswordToken = undefined;
  user.resetPasswordSessionToken = undefined;
  user.resetPasswordSessionExpiry = undefined;
  user.lastPasswordResetRequest = undefined;
  user.failedLoginAttempts = 0;
  user.isLocked = false;
  user.lockedUntil = undefined;

  await user.save();

  clearUserToken(res);

  res.status(200).json({
    status: "password_reset_success",
    message:
      "Password reset successfully. Please log in with your new password.",
  });
});

// @desc    Resend verification code
// @route   POST /api/user/resend-verification
// @access  Public
const resendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error("Email address is required");
  }

  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    res.status(404);
    throw new Error("No account associated with this email");
  }

  if (user.isVerified) {
    res.status(400);
    throw new Error("Account already verified");
  }

  const lastRequest = user.lastOTPRequest;
  if (lastRequest && Date.now() - new Date(lastRequest).getTime() < 60 * 1000) {
    res.status(429);
    throw new Error("Please wait 60 seconds before requesting a new code");
  }

  const emailOTP = generateOTP();
  const otpExpiry = getOTPExpiry();
  const verificationToken = generateVerificationToken();

  user.otp = emailOTP;
  user.otpExpiry = otpExpiry;
  user.verificationToken = verificationToken;
  user.lastOTPRequest = new Date();
  user.failedVerificationAttempts = 0;

  await user.save();

  try {
    await sendEmailOTP(user.email, emailOTP, user.fullName, "resend");
  } catch (error) {
    await rollbackVerificationState(user);
    res.status(500);
    throw new Error("Failed to resend verification email. Please try again.");
  }

  res.status(200).json({
    status: "resent",
    message: "New verification code sent to your email",
    verificationToken,
    expiresIn: "15 minutes",
    nextRequestAvailable: "60 seconds",
  });
});

// @desc    Login user
// @route   POST /api/user/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Please provide email and password");
  }

  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({ email: normalizedEmail }).select(
    "+password +failedLoginAttempts +isLocked +lockedUntil",
  );

  if (!user) {
    res.status(401);
    throw new Error("Invalid credentials");
  }

  if (!user.isActive) {
    res.status(403);
    throw new Error(
      "This account has been deactivated. Please contact support.",
    );
  }

  if (user.isLocked && user.lockedUntil && new Date() < user.lockedUntil) {
    const remainingTime = Math.ceil(
      (new Date(user.lockedUntil).getTime() - Date.now()) / 60000,
    );
    res.status(429);
    throw new Error(
      `Account temporarily locked. Please try again in ${remainingTime} minutes`,
    );
  }

  if (user.isLocked && user.lockedUntil && new Date() >= user.lockedUntil) {
    user.isLocked = false;
    user.lockedUntil = undefined;
    user.failedLoginAttempts = 0;
    await user.save();
  }

  if (!user.isVerified) {
    const emailOTP = generateOTP();
    const otpExpiry = getOTPExpiry();
    const verificationToken = generateVerificationToken();

    user.otp = emailOTP;
    user.otpExpiry = otpExpiry;
    user.verificationToken = verificationToken;
    user.lastOTPRequest = new Date();
    user.failedVerificationAttempts = 0;
    await user.save();

    try {
      await sendEmailOTP(user.email, emailOTP, user.fullName, "resend");
    } catch (error) {
      await rollbackVerificationState(user);
      res.status(500);
      throw new Error(
        "Unable to send a new verification email right now. Please try again.",
      );
    }

    res.status(403);
    throw new Error(
      "Account not verified. A new verification code has been sent to your email.",
    );
  }

  const isValidPassword = await user.comparePassword(password);

  if (!isValidPassword) {
    user.failedLoginAttempts += 1;

    if (user.failedLoginAttempts >= 5) {
      user.isLocked = true;
      user.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
      await user.save();
      res.status(429);
      throw new Error(
        "Too many failed attempts. Account locked for 30 minutes",
      );
    }

    await user.save();
    res.status(401);
    throw new Error("Invalid credentials");
  }

  user.failedLoginAttempts = 0;
  user.isLocked = false;
  user.lockedUntil = undefined;
  user.lastLoginAt = new Date();
  await user.save();

  const token = generateUserToken(res, user._id);

  console.log("✅ User logged in successfully:", {
    userId: user._id,
    email: user.email,
    fullName: user.fullName,
    lastLoginAt: user.lastLoginAt,
  });

  res.status(200).json({
    status: "authenticated",
    message: "Login successful",
    session: {
      token,
      expiresIn: "7 days",
      type: "Bearer",
    },
    user: sanitizeUserResponse(user),
  });
});

// @desc    Logout user
// @route   POST /api/user/logout
// @access  Private
const logoutUser = asyncHandler(async (req, res) => {
  if (req.user) {
    await User.findByIdAndUpdate(req.user.id, { lastLogoutAt: new Date() });
  }

  clearUserToken(res);

  res.status(200).json({
    status: "logged_out",
    message: "Logged out successfully",
    timestamp: new Date().toISOString(),
  });
});

// @desc    Get current user profile
// @route   GET /api/user/profile
// @access  Private
const getProfile = asyncHandler(async (req, res) => {
  res.status(200).json({ status: "success", data: req.user });
});

// @desc    Update user profile
// @route   PUT /api/user/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const user = req.user;

  const {
    phoneNumber,
    countryCode,
    preferences,
    withdrawalWalletType,
    withdrawalWalletAddress,
  } = req.body;

  if (req.file) {
    if (user.profileImagePublicId) {
      await cloudinary.uploader.destroy(user.profileImagePublicId);
    }

    user.profileImage = req.file.path;
    user.profileImagePublicId = req.file.filename;
  }

  if (phoneNumber) user.phoneNumber = phoneNumber;
  if (countryCode) user.countryCode = countryCode;

  if (preferences) {
    user.preferences = {
      ...user.preferences,
      ...preferences,
    };
  }

  const hasWalletPayload =
    typeof withdrawalWalletType !== "undefined" ||
    typeof withdrawalWalletAddress !== "undefined";

  if (hasWalletPayload) {
    if (user.withdrawalWalletLocked || user.withdrawalWalletAddress) {
      res.status(400);
      throw new Error(
        "Withdrawal wallet has already been added and cannot be changed",
      );
    }

    if (!withdrawalWalletType || !withdrawalWalletAddress) {
      res.status(400);
      throw new Error("Wallet type and wallet address are required");
    }

    user.withdrawalWalletType = String(withdrawalWalletType).trim();
    user.withdrawalWalletAddress = String(withdrawalWalletAddress).trim();
    user.withdrawalWalletLocked = true;
  }

  await user.save();

  res.status(200).json({
    status: "success",
    message: "Profile updated successfully",
    data: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: `${user.countryCode}${user.phoneNumber}`,
      preferences: user.preferences,
      profileImage: user.profileImage,
      withdrawalWalletType: user.withdrawalWalletType,
      withdrawalWalletAddress: user.withdrawalWalletAddress,
      withdrawalWalletLocked: user.withdrawalWalletLocked,
      updatedAt: user.updatedAt,
    },
  });
});

// @desc    Delete profile image
// @route   DELETE /api/user/profile/image
// @access  Private
const deleteProfileImage = asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user.profileImagePublicId) {
    res.status(400);
    throw new Error("No profile image to delete");
  }

  await cloudinary.uploader.destroy(user.profileImagePublicId);

  user.profileImage = undefined;
  user.profileImagePublicId = undefined;
  await user.save();

  res.status(200).json({
    status: "success",
    message: "Profile image deleted successfully",
  });
});

// @desc    Change password
// @route   POST /api/user/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    res.status(400);
    throw new Error("Please provide all password fields");
  }

  const user = await User.findById(req.user._id).select("+password");

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const isValidPassword = await user.comparePassword(currentPassword);

  if (!isValidPassword) {
    res.status(401);
    throw new Error("Current password is incorrect");
  }

  if (newPassword !== confirmNewPassword) {
    res.status(400);
    throw new Error("New passwords do not match");
  }

  const isSameAsCurrent = await user.comparePassword(newPassword);

  if (isSameAsCurrent) {
    res.status(400);
    throw new Error(
      "Try another password. You cannot use your current password again",
    );
  }

  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.isValid) {
    const errorMessages = Object.values(passwordValidation.errors).filter(
      Boolean,
    );
    res.status(400);
    throw new Error(errorMessages.join(". "));
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({
    status: "success",
    message: "Password changed successfully",
  });
});

// @desc    Get all users
// @route   GET /api/user/admin/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({})
    .select(
      "-password -otp -otpExpiry -verificationToken -failedLoginAttempts -deviceInfo",
    )
    .sort("-createdAt");

  const stats = {
    total: users.length,
    verified: users.filter((u) => u.isVerified).length,
    pending: users.filter((u) => !u.isVerified).length,
    kycPending: users.filter((u) => u.kycStatus === "pending").length,
    kycSubmitted: users.filter((u) => u.kycStatus === "submitted").length,
    kycVerified: users.filter((u) => u.kycStatus === "verified").length,
    kycRejected: users.filter((u) => u.kycStatus === "rejected").length,
  };

  res.status(200).json({
    status: "success",
    stats,
    count: users.length,
    data: users,
  });
});

// @desc    Get user by ID (Admin)
// @route   GET /api/user/admin/users/:id
// @access  Private/Admin
const getAdminUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select(
    "-password -otp -otpExpiry -verificationToken",
  );

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.status(200).json({ status: "success", data: user });
});

// @desc    Update user by ID (Admin)
// @route   PUT /api/user/admin/users/:id
// @access  Private/Admin
const updateUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const { role, kycStatus, accountType, isVerified, isActive } = req.body;

  if (role) user.role = role;
  if (kycStatus) user.kycStatus = kycStatus;
  if (accountType) user.accountType = accountType;
  if (typeof isVerified !== "undefined") user.isVerified = isVerified;
  if (typeof isActive !== "undefined") user.isActive = isActive;

  await user.save();

  res.status(200).json({
    status: "success",
    message: "User updated successfully",
    data: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      kycStatus: user.kycStatus,
      accountType: user.accountType,
      isVerified: user.isVerified,
      isActive: user.isActive,
    },
  });
});

// @desc    Delete user by ID (Admin)
// @route   DELETE /api/user/admin/users/:id
// @access  Private/Admin
const deleteUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (user.profileImagePublicId) {
    try {
      await cloudinary.uploader.destroy(user.profileImagePublicId);
    } catch (error) {
      console.warn(
        "⚠️ Failed to delete Cloudinary image on user delete:",
        error.message,
      );
    }
  }

  await user.deleteOne();

  res.status(200).json({
    status: "success",
    message: "User deleted successfully",
  });
});

// @desc    Manually verify user KYC (Admin)
// @route   POST /api/user/admin/users/:id/verify
// @access  Private/Admin
const adminVerifyUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (user.kycStatus !== "submitted") {
    res.status(400);
    throw new Error("User has not submitted registration payment yet");
  }

  user.kycStatus = "verified";
  user.kycVerifiedAt = new Date();
  await user.save();

  res.status(200).json({
    status: "success",
    message: "User KYC verified successfully",
  });
});

// @desc    Reject user KYC (Admin)
// @route   POST /api/user/admin/users/:id/reject
// @access  Private/Admin
const adminRejectUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (user.kycStatus !== "submitted") {
    res.status(400);
    throw new Error("User has not submitted registration payment yet");
  }

  const { reason } = req.body;

  user.kycStatus = "rejected";
  user.kycRejectedAt = new Date();
  user.kycRejectionReason =
    reason || "Your registration payment could not be verified";
  await user.save();

  res.status(200).json({
    status: "success",
    message: "User KYC rejected",
    reason: user.kycRejectionReason,
  });
});

// @desc    Get user by ID
// @route   GET /api/user/users/:id
// @access  Private
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select(
    "-password -otp -otpExpiry -verificationToken",
  );

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (user._id.toString() !== req.user.id && req.user.role !== "admin") {
    res.status(403);
    throw new Error("Unauthorized to view this profile");
  }

  res.status(200).json({ status: "success", data: user });
});

// @desc    Deactivate account
// @route   POST /api/user/users/:id/deactivate
// @access  Private
const deactivateAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (user._id.toString() !== req.user.id) {
    res.status(403);
    throw new Error("You can only deactivate your own account");
  }

  user.isActive = false;
  user.deactivatedAt = new Date();
  await user.save();

  clearUserToken(res);

  res.status(200).json({
    status: "success",
    message: "Account deactivated successfully",
  });
});

// @desc    Reactivate account
// @route   POST /api/user/users/:id/reactivate
// @access  Private
const reactivateAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (user._id.toString() !== req.user.id) {
    res.status(403);
    throw new Error("You can only reactivate your own account");
  }

  user.isActive = true;
  user.deactivatedAt = undefined;
  await user.save();

  res.status(200).json({
    status: "success",
    message: "Account reactivated successfully",
  });
});

export {
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
  adminRejectUser,
  getUserById,
  deactivateAccount,
  reactivateAccount,
};
