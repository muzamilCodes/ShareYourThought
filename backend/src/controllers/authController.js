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

async function generateUniqueUsername(name, email) {
  let raw = (name || (email ? email.split('@')[0] : 'user'))
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '');

  if (!raw || raw.length < 2) {
    raw = 'user';
  }

  let candidate = raw.slice(0, 25);
  let existing = await User.findOne({ username: candidate });
  if (!existing) return candidate;

  while (existing) {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    candidate = `${raw.slice(0, 20)}${randomSuffix}`;
    existing = await User.findOne({ username: candidate });
  }

  return candidate;
}

// 1. Send OTP for Registration
export const sendRegisterOtp = asyncHandler(async (req, res) => {
  const { name, username, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }

  if (String(password).length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const cleanName = String(name).trim();

  const existingEmail = await User.findOne({ email: cleanEmail });
  if (existingEmail) {
    return res.status(409).json({ message: 'An account with this email already exists' });
  }

  let finalUsername = username ? String(username).trim().toLowerCase() : '';
  if (finalUsername) {
    const existingUsername = await User.findOne({ username: finalUsername });
    if (existingUsername) {
      finalUsername = await generateUniqueUsername(cleanName, cleanEmail);
    }
  } else {
    finalUsername = await generateUniqueUsername(cleanName, cleanEmail);
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
      name: cleanName,
      username: finalUsername,
      email: cleanEmail,
      password: String(password)
    },
    expiresAt
  });

  // Deliver OTP in background so user transitions to OTP screen immediately
  deliverOtp({
    contact: cleanEmail,
    code,
    purpose: 'register'
  }).catch((err) => console.error('[Background Register OTP Email Error]:', err.message));

  res.json({
    message: `A 6-digit verification code has been sent to ${cleanEmail}`,
    email: cleanEmail
  });
});

// 2. Verify OTP & Complete Registration
export const verifyRegisterOtp = asyncHandler(async (req, res) => {
  const rawEmail = req.body.email || req.body.identifier;
  const rawOtp = req.body.otp || req.body.code;
  const { name, username, password } = req.body;
  if (!rawEmail || !rawOtp) {
    return res.status(400).json({ message: 'Email and verification code are required' });
  }

  const cleanEmail = String(rawEmail).trim().toLowerCase();
  const cleanOtp = String(rawOtp).trim();

  const otpDoc = await OtpToken.findOne({
    contact: cleanEmail,
    code: cleanOtp,
    purpose: 'register',
    isUsed: false,
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 });

  if (!otpDoc) {
    console.log(`[Verify Register OTP] ❌ Invalid code for email ${cleanEmail}: entered "${cleanOtp}"`);
    return res.status(400).json({ message: 'Invalid or expired verification code' });
  }

  // Mark OTP as used
  otpDoc.isUsed = true;
  await otpDoc.save();

  const regName = (otpDoc.payload && otpDoc.payload.name) || (name ? String(name).trim() : '') || 'Thought Creator';
  const regPassword = (otpDoc.payload && otpDoc.payload.password) || password || 'Password123!';
  let regUsername = (otpDoc.payload && otpDoc.payload.username) || (username ? String(username).trim().replace(/^@/, '').toLowerCase() : '');

  const existingEmail = await User.findOne({ email: cleanEmail });
  if (existingEmail) {
    const safeUser = await User.findById(existingEmail._id).select('-password');
    return authResponse(res, safeUser, 200);
  }

  if (!regUsername) {
    regUsername = await generateUniqueUsername(regName, cleanEmail);
  } else {
    const existingUser = await User.findOne({ username: regUsername });
    if (existingUser) {
      regUsername = await generateUniqueUsername(regName, cleanEmail);
    }
  }

  const user = await User.create({
    name: regName,
    username: regUsername,
    email: cleanEmail,
    password: regPassword,
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(regName)}`
  });

  console.log(`[Verify Register OTP] ✅ User created successfully: @${user.username} (${user.email})`);
  const safeUser = await User.findById(user._id).select('-password');
  authResponse(res, safeUser, 201);
});


// 3. Send OTP for Login
export const sendLoginOtp = asyncHandler(async (req, res) => {
  const rawIdentifier = req.body.identifier || req.body.email || req.body.username;
  if (!rawIdentifier) {
    return res.status(400).json({ message: 'Email or username is required' });
  }

  const cleanIdentifier = String(rawIdentifier).trim().replace(/^@/, '').toLowerCase();
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

  // Deliver OTP in background
  deliverOtp({
    contact: user.email,
    code,
    purpose: 'login'
  }).catch((err) => console.error('[Background Login OTP Email Error]:', err.message));

  res.json({
    message: `A 6-digit login code has been sent to ${user.email}`,
    email: user.email
  });
});

// 4. Verify OTP for Login
export const verifyLoginOtp = asyncHandler(async (req, res) => {
  const rawIdentifier = req.body.identifier || req.body.email || req.body.username;
  const rawOtp = req.body.otp || req.body.code;
  if (!rawIdentifier || !rawOtp) {
    return res.status(400).json({ message: 'Email/username and verification code are required' });
  }

  const cleanIdentifier = String(rawIdentifier).trim().replace(/^@/, '').toLowerCase();
  const cleanOtp = String(rawOtp).trim();

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
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const cleanName = String(name).trim();

  const existingEmail = await User.findOne({ email: cleanEmail });
  if (existingEmail) {
    return res.status(409).json({ message: 'An account with this email already exists' });
  }

  let finalUsername = username ? String(username).trim().replace(/^@/, '').toLowerCase() : '';
  if (!finalUsername) {
    finalUsername = await generateUniqueUsername(cleanName, cleanEmail);
  } else {
    const existingUsername = await User.findOne({ username: finalUsername });
    if (existingUsername) {
      finalUsername = await generateUniqueUsername(cleanName, cleanEmail);
    }
  }

  const user = await User.create({
    name: cleanName,
    username: finalUsername,
    email: cleanEmail,
    password,
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}`
  });

  const safeUser = await User.findById(user._id).select('-password');
  authResponse(res, safeUser, 201);
});

// Direct Password Login
export const login = asyncHandler(async (req, res) => {
  const rawIdentifier = req.body.identifier || req.body.email || req.body.username;
  const password = req.body.password;
  if (!rawIdentifier || !password) {
    return res.status(400).json({ message: 'Email/username and password are required' });
  }

  const cleanIdentifier = String(rawIdentifier).trim().replace(/^@/, '').toLowerCase();

  const user = await User.findOne({
    $or: [{ email: cleanIdentifier }, { username: cleanIdentifier }]
  }).select('+password');

  if (!user) {
    console.log(`[Auth Login] ❌ No user found for identifier: "${cleanIdentifier}"`);
    return res.status(401).json({ message: 'Invalid email/username or password' });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    console.log(`[Auth Login] ❌ Password mismatch for user: "@${user.username}" (${user.email})`);
    return res.status(401).json({ message: 'Invalid email/username or password' });
  }

  console.log(`[Auth Login] ✅ Successfully logged in: @${user.username} (${user.role})`);
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

  deliverOtp({
    contact: cleanEmail,
    code,
    purpose: 'reset-password'
  }).catch((err) => console.error('[Background Reset Password OTP Email Error]:', err.message));

  res.json({
    message: `A 6-digit password reset code has been sent to ${cleanEmail}`,
    email: cleanEmail
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



