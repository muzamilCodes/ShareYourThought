import { Router } from 'express';
import { toggleCommentLike } from '../controllers/commentController.js';
import { toggleLikeThought } from '../controllers/thoughtController.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.post('/thoughts/:id', protect, toggleLikeThought);
router.post('/comments/:id', protect, toggleCommentLike);
export default router;
