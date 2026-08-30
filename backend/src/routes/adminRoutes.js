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

// All admin routes require authentication and admin permissions
router.use(protect, async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  // Allow admins and project developers
  if (req.user.role !== 'admin' && req.user.username !== 'burhan') {
    return res.status(403).json({ message: 'Access denied: Admin role required' });
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
