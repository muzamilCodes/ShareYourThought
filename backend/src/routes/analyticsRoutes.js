import express from 'express';
import { getCreatorAnalytics } from '../controllers/analyticsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/me', protect, getCreatorAnalytics);

export default router;
