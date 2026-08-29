import mongoose from 'mongoose';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';

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

  // Find all messages involving current user
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
          read: msg.read
        },
        unreadCount: 0
      });
    }

    // If incoming unread message
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

  // Mark all incoming messages from partner as read
  await Message.updateMany(
    { sender: partnerId, recipient: currentUserId, read: false },
    { $set: { read: true } }
  );

  const messages = await Message.find({
    $or: [
      { sender: currentUserId, recipient: partnerId },
      { sender: partnerId, recipient: currentUserId }
    ]
  })
    .sort({ createdAt: 1 })
    .limit(100)
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

  if (recipient._id.toString() === currentUserId.toString()) {
    return res.status(400).json({ message: 'You cannot message yourself' });
  }

  const message = await Message.create({
    sender: currentUserId,
    recipient: recipient._id,
    content
  });

  const populated = await Message.findById(message._id)
    .populate('sender', 'name username avatar')
    .populate('recipient', 'name username avatar');

  res.status(201).json({ message: populated });
});

export const getUnreadMessagesCount = asyncHandler(async (req, res) => {
  const count = await Message.countDocuments({
    recipient: req.user._id,
    read: false
  });
  res.json({ unreadCount: count });
});
