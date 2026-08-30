import { Router } from 'express';
import {
  createThought,
  deleteThought,
  getDailyFeaturedThought,
  getExploreThoughts,
  getPlatformStats,
  getStories,
  getThought,
  getThoughtByCategory,
  getThoughts,
  getTrendingThoughts,
  recordView,
  searchThoughts,
  shareThought,
  toggleFeatureThought,
  toggleLikeThought,
  toggleSaveThought,
  updateThought
} from '../controllers/thoughtController.js';
import { optionalAuth, protect } from '../middleware/auth.js';

const router = Router();

router.get('/featured/daily', optionalAuth, getDailyFeaturedThought);
router.get('/stats/summary', getPlatformStats);
router.get('/stories/active', optionalAuth, getStories);
router.get('/', optionalAuth, getThoughts);
router.get('/explore/all', optionalAuth, getExploreThoughts);
router.get('/trending/top', optionalAuth, getTrendingThoughts);
router.get('/search', optionalAuth, searchThoughts);
router.get('/category/:slug', optionalAuth, getThoughtByCategory);
router.get('/:id', optionalAuth, getThought);

router.post('/', protect, createThought);
router.patch('/:id/feature', protect, toggleFeatureThought);
router.patch('/:id', protect, updateThought);
router.delete('/:id', protect, deleteThought);
router.post('/:id/like', protect, toggleLikeThought);
router.post('/:id/save', protect, toggleSaveThought);
router.post('/:id/share', optionalAuth, shareThought);
router.post('/:id/view', optionalAuth, recordView);

export default router;


