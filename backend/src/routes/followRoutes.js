import { Router } from 'express';
import { getFollowers, getFollowing, toggleFollow } from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.post('/:userId', protect, toggleFollow);
router.get('/:username/followers', getFollowers);
router.get('/:username/following', getFollowing);
export default router;
