import Notification from '../models/Notification.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listNotifications = asyncHandler(async (req, res) => {
  const [notifications, unreadCount] = await Promise.all([
    Notification.find({ recipient: req.user._id })
      .populate('actor', 'name username avatar')
      .populate('thought', 'content imageUrl')
      .populate('comment', 'content')
      .sort({ createdAt: -1 })
      .limit(60),
    Notification.countDocuments({ recipient: req.user._id, read: false })
  ]);

  res.json({ notifications, unreadCount });
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({ _id: req.params.id, recipient: req.user._id });
  if (!notification) return res.status(404).json({ message: 'Notification not found' });

  notification.read = true;
  await notification.save();

  res.json({ success: true, notification });
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, read: false }, { $set: { read: true } });
  res.json({ message: 'All notifications marked as read' });
});

export const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user._id });
  if (!notification) return res.status(404).json({ message: 'Notification not found' });

  res.json({ success: true, message: 'Notification deleted' });
});
