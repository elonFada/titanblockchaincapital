// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../models/userModel.js";
import Admin from "../models/adminModel.js";

/**
 * Helper: get token from Authorization header (Bearer) OR cookie
 */
const getToken = (req, cookieName) => {
  // 1) Authorization: Bearer <token>
  const authHeader = req.headers?.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  // 2) Cookie fallback
  if (req.cookies && req.cookies[cookieName]) {
    return req.cookies[cookieName];
  }

  return null;
};

// USER PROTECT: accepts Bearer token OR cookie "jwt"
export const protect = asyncHandler(async (req, res, next) => {
  const token = getToken(req, "jwt");

  if (!token) {
    res.status(401);
    throw new Error("Not authorized");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // decoded.userId expected from your generateToken()
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      res.status(401);
      throw new Error("User not found");
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401);
    throw new Error("Not authorized");
  }
});

// ADMIN PROTECT: accepts Bearer token OR cookie "admin_jwt"
export const adminProtect = asyncHandler(async (req, res, next) => {
  const token = getToken(req, "admin_jwt");

  if (!token) {
    res.status(401);
    throw new Error("Not authorized as admin");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // decoded.adminId expected from your admin token generator
    const admin = await Admin.findById(decoded.adminId).select("-password");

    if (!admin) {
      res.status(401);
      throw new Error("Admin not found");
    }

    if (!admin.isActive) {
      res.status(401);
      throw new Error("Admin account disabled");
    }

    req.admin = admin;
    next();
  } catch (err) {
    res.status(401);
    throw new Error("Not authorized as admin");
  }
});

// ONLY SUPER ADMIN
export const superAdminProtect = asyncHandler(async (req, res, next) => {
  if (!req.admin) {
    res.status(401);
    throw new Error("Not authorized as admin");
  }

  if (req.admin.role !== "super_admin") {
    res.status(403);
    throw new Error("Super admin access required");
  }

  next();
});