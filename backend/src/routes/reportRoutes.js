import { Router } from 'express';
import { createReport, listReports } from '../controllers/reportController.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.post('/', protect, createReport);
router.get('/', protect, listReports);
export default router;
