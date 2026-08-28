import { Router } from 'express';
import { createComment, deleteComment, getCommentsByThought, toggleCommentLike, updateComment } from '../controllers/commentController.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.get('/thoughts/:thoughtId', getCommentsByThought);
router.post('/thoughts/:thoughtId', protect, createComment);
router.patch('/:id', protect, updateComment);
router.delete('/:id', protect, deleteComment);
router.post('/:id/like', protect, toggleCommentLike);
export default router;
