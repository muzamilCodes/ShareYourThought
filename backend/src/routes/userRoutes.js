import { Router } from 'express';
import {
  getFollowers,
  getFollowing,
  getMe,
  getProfile,
  getSavedThoughts,
  searchUsers,
  updateMe
} from '../controllers/userController.js';
import { optionalAuth, protect } from '../middleware/auth.js';

const router = Router();
router.get('/me', protect, getMe);
router.patch('/me', protect, updateMe);
router.get('/search', searchUsers);
router.get('/saved/thoughts', protect, getSavedThoughts);
router.get('/:username/followers', getFollowers);
router.get('/:username/following', getFollowing);
router.get('/:username', optionalAuth, getProfile);

export default router;
