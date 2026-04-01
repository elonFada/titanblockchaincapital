import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    minlength: [2, 'Full name must be at least 2 characters'],
    maxlength: [50, 'Full name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email address is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email address'
    ]
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    trim: true,
    match: [
      /^[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{3,4}[-\s\.]?[0-9]{3,4}$/,
      'Please provide a valid phone number'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'investor'],
    default: 'user'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  deactivatedAt: {
    type: Date
  },
  otp: {
    type: String,
    select: false
  },
  otpExpiry: {
    type: Date,
    select: false
  },
  phoneOTP: {
    type: String,
    select: false
  },
  phoneOTPExpiry: {
    type: Date,
    select: false
  },
  verificationToken: {
    type: String,
    select: false
  },
  verifiedAt: {
    type: Date
  },
  lastLoginAt: {
    type: Date
  },
  lastLogoutAt: {
    type: Date
  },
  lastOTPRequest: {
    type: Date
  },
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  failedVerificationAttempts: {
    type: Number,
    default: 0
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  lockedUntil: {
    type: Date
  },
  deviceInfo: {
    type: [{
      deviceId: String,
      userAgent: String,
      lastUsed: Date
    }],
    select: false
  },
  kycStatus: {
    type: String,
    enum: ['pending', 'submitted', 'verified', 'rejected'],
    default: 'pending'
  },
  accountType: {
    type: String,
    enum: ['individual', 'corporate'],
    default: 'individual'
  },
  countryCode: {
    type: String,
    default: '+1'
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    },
    twoFactorEnabled: { type: Boolean, default: false }
  },
  // Profile Image Fields
  profileImage: {
    type: String,
    default: null,
    trim: true
  },
  profileImagePublicId: {
    type: String,
    default: null,
    trim: true
  },
  // Additional profile fields for future use
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    default: null
  },
  website: {
    type: String,
    trim: true,
    default: null
  },
  location: {
    type: String,
    trim: true,
    default: null
  },
    balance: {
    type: Number,
    default: 0
  },
  totalDeposit: {
    type: Number,
    default: 0
  },
  totalWithdrawal: {
    type: Number,
    default: 0
  },
  totalProfit: {
    type: Number,
    default: 0
  },
  socialLinks: {
    twitter: { type: String, default: null },
    linkedin: { type: String, default: null },
    github: { type: String, default: null }
  },
  tradingBotSubscribed: {
  type: Boolean,
  default: false
  },
  tradingBotActivatedAt: {
    type: Date,
    default: null
  },
  tradingBotPaymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TradingBotPayment",
    default: null
  },
  supportChatOpenedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true
});

// Encrypt password before saving
userSchema.pre('save', async function() {
  if (!this.isModified('password')) {
    return;
  }
  
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Format phone number for display
userSchema.methods.getFormattedPhone = function() {
  return `${this.countryCode}${this.phoneNumber}`;
};

// Get full profile image URL (if needed)
userSchema.methods.getProfileImageUrl = function() {
  return this.profileImage || null;
};

// Check if account is locked
userSchema.methods.isAccountLocked = function() {
  if (!this.isLocked) return false;
  if (this.lockedUntil && new Date() > this.lockedUntil) {
    this.isLocked = false;
    this.lockedUntil = undefined;
    this.failedLoginAttempts = 0;
    return false;
  }
  return true;
};

// Check if account is active
userSchema.methods.isAccountActive = function() {
  return this.isActive === true;
};

// Deactivate account
userSchema.methods.deactivate = async function() {
  this.isActive = false;
  this.deactivatedAt = new Date();
  return await this.save();
};

// Reactivate account
userSchema.methods.reactivate = async function() {
  this.isActive = true;
  this.deactivatedAt = undefined;
  return await this.save();
};

// Update profile image
userSchema.methods.updateProfileImage = async function(imageUrl, publicId) {
  // Delete old image if exists
  if (this.profileImagePublicId) {
    // Note: You'll need to handle Cloudinary deletion separately
    // This method only updates the database
  }
  
  this.profileImage = imageUrl;
  this.profileImagePublicId = publicId;
  return await this.save();
};

// Remove profile image
userSchema.methods.removeProfileImage = async function() {
  this.profileImage = null;
  this.profileImagePublicId = null;
  return await this.save();
};

// Sanitize user data for public response
userSchema.methods.toPublicJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.otp;
  delete userObject.phoneOTP;
  delete userObject.otpExpiry;
  delete userObject.phoneOTPExpiry;
  delete userObject.verificationToken;
  delete userObject.failedLoginAttempts;
  delete userObject.failedVerificationAttempts;
  delete userObject.deviceInfo;
  delete userObject.isLocked;
  delete userObject.lockedUntil;
  return userObject;
};

const User = mongoose.model('User', userSchema);

export default User;