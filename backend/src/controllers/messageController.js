import mongoose from 'mongoose';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createNotification } from '../utils/notifications.js';

function safeUser(u) {
  if (!u) return null;
  return {
    id: u._id || u.id,
    _id: u._id || u.id,
    name: u.name,
    username: u.username,
    avatar: u.avatar || '',
    bio: u.bio || '',
    isPrivate: Boolean(u.isPrivate)
  };
}

export const getConversations = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;

  const messages = await Message.find({
    $or: [{ sender: currentUserId }, { recipient: currentUserId }]
  })
    .sort({ createdAt: -1 })
    .populate('sender', 'name username avatar bio isPrivate')
    .populate('recipient', 'name username avatar bio isPrivate');

  const conversationsMap = new Map();

  for (const msg of messages) {
    if (!msg.sender || !msg.recipient) continue;
    const isSender = msg.sender._id.toString() === currentUserId.toString();
    const partner = isSender ? msg.recipient : msg.sender;
    if (!partner || !partner._id) continue;
    const partnerId = partner._id.toString();

    if (!conversationsMap.has(partnerId)) {
      conversationsMap.set(partnerId, {
        partner: safeUser(partner),
        lastMessage: {
          _id: msg._id,
          content: msg.content,
          createdAt: msg.createdAt,
          isSender,
          read: msg.read,
          status: msg.status || (msg.read ? 'seen' : 'delivered')
        },
        unreadCount: 0
      });
    }

    if (!isSender && !msg.read) {
      const conv = conversationsMap.get(partnerId);
      conv.unreadCount += 1;
    }
  }

  const conversations = Array.from(conversationsMap.values());
  res.json({ conversations });
});

export const getMessages = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;
  const targetParam = req.params.userId;

  let partner = null;
  if (mongoose.Types.ObjectId.isValid(targetParam)) {
    partner = await User.findById(targetParam);
  }
  if (!partner) {
    partner = await User.findOne({ username: targetParam.toLowerCase() });
  }

  if (!partner) {
    return res.status(404).json({ message: 'User not found' });
  }

  const partnerId = partner._id;

  // Mark all incoming messages from partner as seen
  await Message.updateMany(
    { sender: partnerId, recipient: currentUserId, read: false },
    { $set: { read: true, status: 'seen', seenAt: new Date() } }
  );

  const messages = await Message.find({
    $or: [
      { sender: currentUserId, recipient: partnerId },
      { sender: partnerId, recipient: currentUserId }
    ]
  })
    .sort({ createdAt: 1 })
    .limit(150)
    .populate('sender', 'name username avatar')
    .populate('recipient', 'name username avatar');

  res.json({
    partner: safeUser(partner),
    messages
  });
});

export const sendMessage = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;
  const targetParam = req.params.userId;
  const content = String(req.body.content || '').trim();

  if (!content) {
    return res.status(400).json({ message: 'Message content cannot be empty' });
  }

  let recipient = null;
  if (mongoose.Types.ObjectId.isValid(targetParam)) {
    recipient = await User.findById(targetParam);
  }
  if (!recipient) {
    recipient = await User.findOne({ username: targetParam.toLowerCase() });
  }

  if (!recipient) {
    return res.status(404).json({ message: 'Recipient not found' });
  }

  const message = await Message.create({
    sender: currentUserId,
    recipient: recipient._id,
    content,
    status: 'delivered'
  });

  const populated = await Message.findById(message._id)
    .populate('sender', 'name username avatar')
    .populate('recipient', 'name username avatar');

  // Trigger push notification if available
  await createNotification({
    recipient: recipient._id,
    actor: currentUserId,
    type: 'message',
    title: `${req.user.name} sent you a message`,
    body: content.length > 60 ? `${content.substring(0, 57)}...` : content
  }).catch(() => {});

  res.status(201).json({ message: populated });
});

export const markMessageRead = asyncHandler(async (req, res) => {
  const message = await Message.findOne({ _id: req.params.id, recipient: req.user._id });
  if (!message) return res.status(404).json({ message: 'Message not found' });

  message.read = true;
  message.status = 'seen';
  message.seenAt = new Date();
  await message.save();

  res.json({ success: true, message });
});

export const markAllUserMessagesRead = asyncHandler(async (req, res) => {
  const targetId = req.params.userId;
  await Message.updateMany(
    { sender: targetId, recipient: req.user._id, read: false },
    { $set: { read: true, status: 'seen', seenAt: new Date() } }
  );

  res.json({ success: true });
});

export const deleteMessage = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.id);
  if (!message) return res.status(404).json({ message: 'Message not found' });

  const userId = req.user._id.toString();
  if (message.sender.toString() !== userId && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'You can only delete your own messages' });
  }

  await message.deleteOne();
  res.json({ success: true, message: 'Message deleted' });
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const unreadCount = await Message.countDocuments({
    recipient: req.user._id,
    read: false
  });
  res.json({ unreadCount });
});
