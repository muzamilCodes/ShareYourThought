import express from 'express';
import {
  getConversations,
  getMessages,
  sendMessage,
  markMessageRead,
  markAllUserMessagesRead,
  deleteMessage,
  getUnreadCount
} from '../controllers/messageController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/conversations', getConversations);
router.get('/unread-count', getUnreadCount);
router.patch('/:id/read', markMessageRead);
router.delete('/:id', deleteMessage);
router.patch('/:userId/read-all', markAllUserMessagesRead);

router.route('/:userId')
  .get(getMessages)
  .post(sendMessage);

export default router;
