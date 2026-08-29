import { Router } from 'express';
import {
  createThought,
  deleteThought,
  getExploreThoughts,
  getThought,
  getThoughtByCategory,
  getThoughts,
  getTrendingThoughts,
  recordView,
  searchThoughts,
  shareThought,
  toggleLikeThought,
  toggleSaveThought,
  updateThought
} from '../controllers/thoughtController.js';
import { optionalAuth, protect } from '../middleware/auth.js';

const router = Router();

router.get('/', optionalAuth, getThoughts);
router.get('/explore/all', optionalAuth, getExploreThoughts);
router.get('/trending/top', optionalAuth, getTrendingThoughts);
router.get('/search', optionalAuth, searchThoughts);
router.get('/category/:slug', optionalAuth, getThoughtByCategory);
router.get('/:id', optionalAuth, getThought);

router.post('/', protect, createThought);
router.patch('/:id', protect, updateThought);
router.delete('/:id', protect, deleteThought);
router.post('/:id/like', protect, toggleLikeThought);
router.post('/:id/save', protect, toggleSaveThought);
router.post('/:id/share', optionalAuth, shareThought);
router.post('/:id/view', optionalAuth, recordView);

export default router;

