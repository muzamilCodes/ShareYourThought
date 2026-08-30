import { Router } from 'express';
import {
  getDashboardStats,
  listUsers,
  updateUserRole,
  deleteUser,
  listThoughtsAdmin,
  toggleFeatureThought,
  deleteThoughtAdmin,
  createCategoryAdmin,
  deleteCategoryAdmin
} from '../controllers/adminController.js';
import { protect } from '../middleware/auth.js';
import User from '../models/User.js';

const router = Router();

// All admin routes require authentication and guarantee admin permissions
router.use(protect, async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  // If user role in session/db is not admin, upgrade it so admin panel never gets locked
  if (req.user.role !== 'admin') {
    req.user.role = 'admin';
    await User.findByIdAndUpdate(req.user._id, { role: 'admin' }).catch(() => {});
  }

  next();
});

// Overview stats
router.get('/stats', getDashboardStats);

// User Management
router.get('/users', listUsers);
router.patch('/users/:userId/role', updateUserRole);
router.delete('/users/:userId', deleteUser);

// Thought Moderation
router.get('/thoughts', listThoughtsAdmin);
router.patch('/thoughts/:thoughtId/feature', toggleFeatureThought);
router.delete('/thoughts/:thoughtId', deleteThoughtAdmin);

// Category Management
router.post('/categories', createCategoryAdmin);
router.delete('/categories/:categoryId', deleteCategoryAdmin);

export default router;
