import express from 'express';
import { assistWithAi } from '../controllers/aiController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/assist', protect, assistWithAi);

export default router;
