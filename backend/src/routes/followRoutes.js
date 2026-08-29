import { Router } from 'express';
import {
  acceptFollowRequest,
  declineFollowRequest,
  getFollowRequests,
  getFollowers,
  getFollowing,
  toggleFollow
} from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.get('/requests', protect, getFollowRequests);
router.post('/requests/:requesterId/accept', protect, acceptFollowRequest);
router.post('/requests/:requesterId/decline', protect, declineFollowRequest);
router.post('/:userId', protect, toggleFollow);
router.get('/:username/followers', getFollowers);
router.get('/:username/following', getFollowing);
export default router;
