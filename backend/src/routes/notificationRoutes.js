import { Router } from 'express';
import { listNotifications, markAllRead, markRead } from '../controllers/notificationController.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.get('/', protect, listNotifications);
router.patch('/read-all', protect, markAllRead);
router.patch('/:id/read', protect, markRead);
export default router;
