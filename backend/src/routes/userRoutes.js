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
  toggleFollow,
  updateMe
} from '../controllers/userController.js';
import { optionalAuth, protect } from '../middleware/auth.js';

const router = Router();

// Current User profile & settings
router.get('/me', protect, getMe);
router.patch('/me', protect, updateMe);
router.patch('/profile', protect, updateMe);
router.delete('/me', protect, deleteMe);

// Discovery & Suggested
router.get('/search', searchUsers);
router.get('/suggested', optionalAuth, getSuggestedUsers);
router.get('/saved/thoughts', protect, getSavedThoughts);
router.get('/me/saved', protect, getSavedThoughts);

// Follow / Unfollow endpoints under /api/users
router.post('/:userId/follow', protect, toggleFollow);
router.delete('/:userId/follow', protect, toggleFollow);
router.post('/follow/:userId', protect, toggleFollow);
router.delete('/follow/:userId', protect, toggleFollow);
router.post('/:userId/toggle-follow', protect, toggleFollow);

// Social Lists
router.get('/:username/followers', optionalAuth, getFollowers);
router.get('/:username/following', optionalAuth, getFollowing);
router.get('/:username', optionalAuth, getProfile);

export default router;
