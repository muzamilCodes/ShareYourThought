import { Router } from 'express';
import {
  deleteMe,
  getFollowers,
  getFollowing,
  getMe,
  getProfile,
  getSavedThoughts,
  getSuggestedUsers,
  searchUsers,
  updateMe
} from '../controllers/userController.js';
import { optionalAuth, protect } from '../middleware/auth.js';

const router = Router();
router.get('/me', protect, getMe);
router.patch('/me', protect, updateMe);
router.delete('/me', protect, deleteMe);
router.get('/search', searchUsers);
router.get('/suggested', optionalAuth, getSuggestedUsers);
router.get('/saved/thoughts', protect, getSavedThoughts);
router.get('/:username/followers', optionalAuth, getFollowers);
router.get('/:username/following', optionalAuth, getFollowing);
router.get('/:username', optionalAuth, getProfile);

export default router;
