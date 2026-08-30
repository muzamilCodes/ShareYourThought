import { Router } from 'express';
import { createReport, listReports, updateReport, deleteReport } from '../controllers/reportController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.post('/', protect, createReport);
router.get('/admin', protect, listReports);
router.patch('/admin/:id', protect, updateReport);
router.delete('/admin/:id', protect, deleteReport);

export default router;
