import jwt from 'jsonwebtoken';

const isProduction = process.env.NODE_ENV === 'production';

const userCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'None' : 'Lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const adminCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'None' : 'Lax',
  maxAge: 24 * 60 * 60 * 1000,
};

export const generateUserToken = (res, userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

  res.cookie('jwt', token, userCookieOptions);

  return token;
};

export const generateAdminToken = (res, adminId) => {
  const token = jwt.sign({ adminId }, process.env.JWT_SECRET, {
    expiresIn: '1d',
  });

  res.cookie('admin_jwt', token, adminCookieOptions);

  return token;
};

export const clearUserToken = (res) => {
  res.cookie('jwt', '', {
    ...userCookieOptions,
    expires: new Date(0),
    maxAge: 0,
  });
};

export const clearAdminToken = (res) => {
  res.cookie('admin_jwt', '', {
    ...adminCookieOptions,
    expires: new Date(0),
    maxAge: 0,
  });
};

export default generateUserToken;