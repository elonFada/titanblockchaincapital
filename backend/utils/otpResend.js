import crypto from "crypto";

const generateOTP = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

const getOTPExpiry = () => {
  return new Date(Date.now() + 15 * 60 * 1000);
};

export {
  generateOTP,
  getOTPExpiry,
};