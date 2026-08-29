import { Router } from 'express';
import {
  getConversations,
  getMessages,
  getUnreadMessagesCount,
  sendMessage
} from '../controllers/messageController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.get('/conversations', protect, getConversations);
router.get('/unread-count', protect, getUnreadMessagesCount);
router.get('/:userId', protect, getMessages);
router.post('/:userId', protect, sendMessage);

export default router;
