import crypto from 'crypto';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { signToken } from '../utils/jwt.js';
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

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ user: publicUser(user) });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  const cleanEmail = String(email).trim().toLowerCase();
  const user = await User.findOne({ email: cleanEmail });
  if (!user) {
    return res.json({ message: 'If the account exists, a reset link was sent' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  user.resetPasswordToken = hash;
  user.resetPasswordExpires = Date.now() + 1000 * 60 * 30; // 30 mins
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${env.clientUrl}/settings?reset=${token}&email=${encodeURIComponent(user.email)}`;
  await sendResetPasswordEmail({ to: user.email, resetUrl });

  res.json({
    message: 'If the account exists, a reset link was sent',
    previewResetUrl: env.nodeEnv === 'production' ? undefined : resetUrl
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { email, token, password } = req.body;
  if (!email || !token || !password) {
    return res.status(400).json({ message: 'Email, token and password are required' });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const hash = crypto.createHash('sha256').update(String(token).trim()).digest('hex');

  const user = await User.findOne({
    email: cleanEmail,
    resetPasswordToken: hash,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({ message: 'Reset token is invalid or has expired' });
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  const safeUser = await User.findById(user._id).select('-password');
  authResponse(res, safeUser);
});
