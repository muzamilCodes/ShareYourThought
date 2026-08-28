import { verifyToken } from '../utils/jwt.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return req.cookies?.token || null;
}

export const protect = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid authentication token' });
    }

    req.user = user;
    next();
  } catch (_error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
});

export const optionalAuth = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id).select('-password');
    req.user = user || null;
  } catch (_error) {
    req.user = null;
  }

  next();
});
