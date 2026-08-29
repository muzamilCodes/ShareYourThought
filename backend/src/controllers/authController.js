import crypto from 'crypto';
import User from '../models/User.js';
import OtpToken from '../models/OtpToken.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { signToken } from '../utils/jwt.js';
import { deliverOtp, generateOtpCode } from '../utils/otp.js';
import { sendResetPasswordEmail } from '../utils/mailer.js';
import env from '../config/env.js';

function publicUser(user) {
  if (!user) return null;
  return {
    _id: user._id,
    id: user._id,
    name: user.name,
    username: user.username,
    email: user.email,
    bio: user.bio,
    avatar: user.avatar,
    website: user.website,
    location: user.location,
    followers: Array.isArray(user.followers) ? user.followers.length : user.followers || 0,
    following: Array.isArray(user.following) ? user.following.length : user.following || 0,
    savedThoughts: Array.isArray(user.savedThoughts) ? user.savedThoughts.length : user.savedThoughts || 0,
    role: user.role,
    createdAt: user.createdAt
  };
}

function authResponse(res, user, status = 200) {
  const token = signToken({ id: user._id.toString() });
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: env.nodeEnv === 'production' ? 'none' : 'lax',
    secure: env.nodeEnv === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
  return res.status(status).json({ token, user: publicUser(user) });
}

// 1. Send OTP for Registration
export const sendRegisterOtp = asyncHandler(async (req, res) => {
  const { name, username, email, password } = req.body;
  if (!name || !username || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (String(password).length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const cleanUsername = String(username).trim().toLowerCase();

  const [existingEmail, existingUsername] = await Promise.all([
    User.findOne({ email: cleanEmail }),
    User.findOne({ username: cleanUsername })
  ]);

  if (existingEmail) {
    return res.status(409).json({ message: 'An account with this email already exists' });
  }
  if (existingUsername) {
    return res.status(409).json({ message: 'This username is already taken' });
  }

  // Invalidate any existing unused register OTPs for this email
  await OtpToken.updateMany(
    { contact: cleanEmail, purpose: 'register', isUsed: false },
    { isUsed: true }
  );

  const code = generateOtpCode();
  const ttlMinutes = env.otpTtlMinutes || 10;
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

  await OtpToken.create({
    contact: cleanEmail,
    code,
    purpose: 'register',
    payload: {
      name: String(name).trim(),
      username: cleanUsername,
      email: cleanEmail,
      password: String(password)
    },
    expiresAt
  });

  await deliverOtp({
    contact: cleanEmail,
    code,
    purpose: 'register'
  });

  res.json({
    message: `A 6-digit verification code has been sent to ${cleanEmail}`,
    email: cleanEmail,
    previewOtp: env.nodeEnv === 'production' ? undefined : code
  });
});

// 2. Verify OTP & Complete Registration
export const verifyRegisterOtp = asyncHandler(async (req, res) => {
  const { email, otp, name, username, password } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and verification code are required' });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const cleanOtp = String(otp).trim();

  const otpDoc = await OtpToken.findOne({
    contact: cleanEmail,
    code: cleanOtp,
    purpose: 'register',
    isUsed: false,
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 });

  if (!otpDoc) {
    return res.status(400).json({ message: 'Invalid or expired verification code' });
  }

  // Mark OTP as used
  otpDoc.isUsed = true;
  await otpDoc.save();

  const regName = (otpDoc.payload && otpDoc.payload.name) || (name ? String(name).trim() : '');
  const regUsername = (otpDoc.payload && otpDoc.payload.username) || (username ? String(username).trim().toLowerCase() : '');
  const regPassword = (otpDoc.payload && otpDoc.payload.password) || password;

  if (!regName || !regUsername || !regPassword) {
    return res.status(400).json({ message: 'Registration payload missing. Please try registering again.' });
  }

  const [existingEmail, existingUsername] = await Promise.all([
    User.findOne({ email: cleanEmail }),
    User.findOne({ username: regUsername })
  ]);

  if (existingEmail) {
    return res.status(409).json({ message: 'An account with this email already exists' });
  }
  if (existingUsername) {
    return res.status(409).json({ message: 'This username is already taken' });
  }

  const user = await User.create({
    name: regName,
    username: regUsername,
    email: cleanEmail,
    password: regPassword,
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(regName)}`
  });

  const safeUser = await User.findById(user._id).select('-password');
  authResponse(res, safeUser, 201);
});

// 3. Send OTP for Login
export const sendLoginOtp = asyncHandler(async (req, res) => {
  const { identifier } = req.body;
  if (!identifier) {
    return res.status(400).json({ message: 'Email or username is required' });
  }

  const cleanIdentifier = String(identifier).trim().toLowerCase();
  const user = await User.findOne({
    $or: [{ email: cleanIdentifier }, { username: cleanIdentifier }]
  });

  if (!user) {
    return res.status(404).json({ message: 'No account found with this email or username' });
  }

  await OtpToken.updateMany(
    { contact: user.email, purpose: 'login', isUsed: false },
    { isUsed: true }
  );

  const code = generateOtpCode();
  const ttlMinutes = env.otpTtlMinutes || 10;
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

  await OtpToken.create({
    contact: user.email,
    code,
    purpose: 'login',
    expiresAt
  });

  await deliverOtp({
    contact: user.email,
    code,
    purpose: 'login'
  });

  res.json({
    message: `A 6-digit login code has been sent to ${user.email}`,
    email: user.email,
    previewOtp: env.nodeEnv === 'production' ? undefined : code
  });
});

// 4. Verify OTP for Login
export const verifyLoginOtp = asyncHandler(async (req, res) => {
  const { identifier, otp } = req.body;
  if (!identifier || !otp) {
    return res.status(400).json({ message: 'Email/username and verification code are required' });
  }

  const cleanIdentifier = String(identifier).trim().toLowerCase();
  const cleanOtp = String(otp).trim();

  const user = await User.findOne({
    $or: [{ email: cleanIdentifier }, { username: cleanIdentifier }]
  });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const otpDoc = await OtpToken.findOne({
    contact: user.email,
    code: cleanOtp,
    purpose: 'login',
    isUsed: false,
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 });

  if (!otpDoc) {
    return res.status(400).json({ message: 'Invalid or expired login code' });
  }

  otpDoc.isUsed = true;
  await otpDoc.save();

  const safeUser = await User.findById(user._id).select('-password');
  authResponse(res, safeUser);
});

// Direct Password Register
export const register = asyncHandler(async (req, res) => {
  const { name, username, email, password } = req.body;
  if (!name || !username || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const cleanUsername = String(username).trim().toLowerCase();

  const [existingEmail, existingUsername] = await Promise.all([
    User.findOne({ email: cleanEmail }),
    User.findOne({ username: cleanUsername })
  ]);

  if (existingEmail) {
    return res.status(409).json({ message: 'An account with this email already exists' });
  }
  if (existingUsername) {
    return res.status(409).json({ message: 'This username is already taken' });
  }

  const user = await User.create({
    name: String(name).trim(),
    username: cleanUsername,
    email: cleanEmail,
    password,
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`
  });

  const safeUser = await User.findById(user._id).select('-password');
  authResponse(res, safeUser, 201);
});

// Direct Password Login
export const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ message: 'Email/username and password are required' });
  }

  const cleanIdentifier = String(identifier).trim().toLowerCase();

  const user = await User.findOne({
    $or: [{ email: cleanIdentifier }, { username: cleanIdentifier }]
  }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Invalid email/username or password' });
  }

  const safeUser = await User.findById(user._id).select('-password');
  authResponse(res, safeUser);
});

export const logout = asyncHandler(async (_req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

// 5. Send OTP for Forgot Password
export const sendForgotPasswordOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email address is required' });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const user = await User.findOne({ email: cleanEmail });

  if (!user) {
    return res.status(404).json({ message: 'No account found with this email address' });
  }

  await OtpToken.updateMany(
    { contact: cleanEmail, purpose: 'reset-password', isUsed: false },
    { isUsed: true }
  );

  const code = generateOtpCode();
  const ttlMinutes = env.otpTtlMinutes || 10;
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

  await OtpToken.create({
    contact: cleanEmail,
    code,
    purpose: 'reset-password',
    expiresAt
  });

  await deliverOtp({
    contact: cleanEmail,
    code,
    purpose: 'reset-password'
  });

  res.json({
    message: `A 6-digit password reset code has been sent to ${cleanEmail}`,
    email: cleanEmail,
    previewOtp: env.nodeEnv === 'production' ? undefined : code
  });
});

// 6. Verify OTP & Reset Password
export const verifyResetPasswordOtp = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) {
    return res.status(400).json({ message: 'Email, verification code, and new password are required' });
  }

  if (String(newPassword).length < 8) {
    return res.status(400).json({ message: 'New password must be at least 8 characters' });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const cleanOtp = String(otp).trim();

  const user = await User.findOne({ email: cleanEmail });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const otpDoc = await OtpToken.findOne({
    contact: cleanEmail,
    code: cleanOtp,
    purpose: 'reset-password',
    isUsed: false,
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 });

  if (!otpDoc) {
    return res.status(400).json({ message: 'Invalid or expired password reset code' });
  }

  otpDoc.isUsed = true;
  await otpDoc.save();

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  const safeUser = await User.findById(user._id).select('-password');
  authResponse(res, safeUser);
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ user: publicUser(user) });
});

export const forgotPassword = sendForgotPasswordOtp;
export const resetPassword = verifyResetPasswordOtp;



