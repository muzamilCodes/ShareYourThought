import User from '../models/User.js';
import Thought from '../models/Thought.js';
import Comment from '../models/Comment.js';
import Message from '../models/Message.js';
import Notification from '../models/Notification.js';
import RefreshToken from '../models/RefreshToken.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createNotification } from '../utils/notifications.js';

function safeUser(user) {
  if (!user) return null;
  return {
    _id: user._id,
    id: user._id,
    name: user.name,
    username: user.username,
    email: user.email,
    bio: user.bio,
    avatar: user.avatar,
    website: user.website,
    location: user.location,
    isPrivate: Boolean(user.isPrivate),
    followers: Array.isArray(user.followers) ? user.followers.length : user.followers || 0,
    following: Array.isArray(user.following) ? user.following.length : user.following || 0,
    savedThoughts: Array.isArray(user.savedThoughts) ? user.savedThoughts.length : user.savedThoughts || 0,
    role: user.role,
    createdAt: user.createdAt
  };
}

export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ user: safeUser(user) });
});

export const updateMe = asyncHandler(async (req, res) => {
  const { name, username, bio, avatar, website, location, isPrivate } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (username && username.toLowerCase() !== user.username) {
    const taken = await User.findOne({ username: username.toLowerCase(), _id: { $ne: user._id } });
    if (taken) return res.status(409).json({ message: 'Username already taken' });
    user.username = username.toLowerCase();
  }

  if (name !== undefined) user.name = name.trim();
  if (bio !== undefined) user.bio = bio;
  if (avatar !== undefined) user.avatar = avatar;
  if (website !== undefined) user.website = website;
  if (location !== undefined) user.location = location;
  if (isPrivate !== undefined) user.isPrivate = Boolean(isPrivate);

  await user.save();
  const updated = await User.findById(user._id).select('-password');
  res.json({ user: safeUser(updated) });
});

export const deleteMe = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // 1. Delete all thoughts created by this user
  await Thought.deleteMany({ author: userId });

  // 2. Delete all comments created by this user
  await Comment.deleteMany({ author: userId });

  // 3. Remove this user from all other users' followers, following, and followRequests
  await User.updateMany(
    {},
    {
      $pull: {
        followers: userId,
        following: userId,
        followRequests: userId
      }
    }
  );

  // 4. Remove this user's likes & saves from all remaining thoughts and comments
  await Promise.all([
    Thought.updateMany({}, { $pull: { likes: userId, saves: userId } }),
    Comment.updateMany({}, { $pull: { likes: userId } }),
    Message.deleteMany({ $or: [{ sender: userId }, { recipient: userId }] }),
    Notification.deleteMany({ $or: [{ recipient: userId }, { actor: userId }] }),
    RefreshToken.deleteMany({ user: userId })
  ]);

  // 5. Delete the user document
  await User.findByIdAndDelete(userId);

  res.json({ message: 'Account and all associated posts, comments, and messages deleted successfully.' });
});

export const searchUsers = asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.json({ users: [] });
  const users = await User.find({
    $or: [
      { name: { $regex: q, $options: 'i' } },
      { username: { $regex: q, $options: 'i' } },
      { bio: { $regex: q, $options: 'i' } }
    ]
  }).select('-password').limit(20);
  res.json({ users: users.map(safeUser) });
});

export const getSuggestedUsers = asyncHandler(async (req, res) => {
  const currentUserId = req.user?._id;
  const filter = currentUserId ? { _id: { $ne: currentUserId } } : {};
  const users = await User.find(filter)
    .sort({ createdAt: -1 })
    .limit(8)
    .select('-password');

  const currentUserIdStr = currentUserId ? currentUserId.toString() : '';
  const result = users.map((u) => {
    const isFollowing = currentUserIdStr
      ? (u.followers || []).some((id) => id.toString() === currentUserIdStr)
      : false;
    return {
      ...safeUser(u),
      isFollowing
    };
  });
  res.json({ users: result });
});

export const getProfile = asyncHandler(async (req, res) => {
  const profile = await User.findOne({ username: req.params.username.toLowerCase() }).select('-password');
  if (!profile) return res.status(404).json({ message: 'Profile not found' });

  const currentUserIdStr = req.user?._id ? req.user._id.toString() : '';
  const isSelf = currentUserIdStr === profile._id.toString();
  const isFollowing = currentUserIdStr
    ? (profile.followers || []).some((id) => id.toString() === currentUserIdStr)
    : false;
  const isRequested = currentUserIdStr
    ? (profile.followRequests || []).some((id) => id.toString() === currentUserIdStr)
    : false;

  // Private Account Protection
  const isPrivateLocked = Boolean(profile.isPrivate) && !isSelf && !isFollowing;

  if (isPrivateLocked) {
    return res.json({
      profile: safeUser(profile),
      thoughts: [],
      isFollowing: false,
      isRequested,
      isPrivateLocked: true
    });
  }

  const thoughts = await Thought.find({ author: profile._id })
    .sort({ createdAt: -1 })
    .limit(40)
    .populate('author', 'name username avatar bio');

  res.json({
    profile: safeUser(profile),
    thoughts,
    isFollowing,
    isRequested: false,
    isPrivateLocked: false
  });
});

export const getSavedThoughts = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: 'savedThoughts',
    populate: { path: 'author', select: 'name username avatar bio' }
  });
  res.json({ thoughts: (user?.savedThoughts || []).filter(Boolean) });
});

export const toggleFollow = asyncHandler(async (req, res) => {
  const target = await User.findById(req.params.userId);
  if (!target) return res.status(404).json({ message: 'User not found' });
  if (target._id.toString() === req.user._id.toString()) {
    return res.status(400).json({ message: 'You cannot follow yourself' });
  }

  const current = await User.findById(req.user._id);
  const isFollowing = current.following.some((id) => id.toString() === target._id.toString());
  const isRequested = (target.followRequests || []).some((id) => id.toString() === current._id.toString());

  // 1. If currently following: UNFOLLOW
  if (isFollowing) {
    current.following = current.following.filter((id) => id.toString() !== target._id.toString());
    target.followers = target.followers.filter((id) => id.toString() !== current._id.toString());
    await Promise.all([current.save(), target.save()]);
    return res.json({
      following: false,
      requested: false,
      followers: target.followers.length,
      followingCount: current.following.length
    });
  }

  // 2. If target account is PRIVATE:
  if (target.isPrivate) {
    if (isRequested) {
      // Cancel follow request
      target.followRequests = (target.followRequests || []).filter((id) => id.toString() !== current._id.toString());
      await target.save();
      return res.json({
        following: false,
        requested: false,
        followers: target.followers.length,
        followingCount: current.following.length
      });
    } else {
      // Send follow request
      if (!target.followRequests) target.followRequests = [];
      target.followRequests.push(current._id);
      await target.save();
      await createNotification({
        recipient: target._id,
        actor: current._id,
        type: 'follow_request',
        title: `${current.name} requested to follow you`,
        body: `@${current.username} wants to view your private thoughts and profile.`
      });
      return res.json({
        following: false,
        requested: true,
        followers: target.followers.length,
        followingCount: current.following.length
      });
    }
  }

  // 3. If target account is PUBLIC: Immediate follow
  current.following.push(target._id);
  target.followers.push(current._id);
  await createNotification({
    recipient: target._id,
    actor: current._id,
    type: 'follow',
    title: `${current.name} started following you`,
    body: `${current.username} is now part of your thought stream.`
  });

  await Promise.all([current.save(), target.save()]);
  res.json({
    following: true,
    requested: false,
    followers: target.followers.length,
    followingCount: current.following.length
  });
});

export const acceptFollowRequest = asyncHandler(async (req, res) => {
  const current = await User.findById(req.user._id);
  const requester = await User.findById(req.params.requesterId);
  if (!requester) return res.status(404).json({ message: 'Requester not found' });

  // Remove from followRequests
  current.followRequests = (current.followRequests || []).filter(
    (id) => id.toString() !== requester._id.toString()
  );

  // Add to followers and following
  if (!current.followers.some((id) => id.toString() === requester._id.toString())) {
    current.followers.push(requester._id);
  }
  if (!requester.following.some((id) => id.toString() === current._id.toString())) {
    requester.following.push(current._id);
  }

  await Promise.all([current.save(), requester.save()]);

  // Send notification to requester
  await createNotification({
    recipient: requester._id,
    actor: current._id,
    type: 'follow',
    title: `${current.name} accepted your follow request`,
    body: `You can now view @${current.username}'s published thoughts and profile.`
  });

  res.json({ success: true, followers: current.followers.length });
});

export const declineFollowRequest = asyncHandler(async (req, res) => {
  const current = await User.findById(req.user._id);
  current.followRequests = (current.followRequests || []).filter(
    (id) => id.toString() !== req.params.requesterId
  );
  await current.save();
  res.json({ success: true });
});

export const getFollowRequests = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate(
    'followRequests',
    'name username avatar bio isPrivate'
  );
  res.json({ requests: (user?.followRequests || []).map(safeUser) });
});

export const getFollowers = asyncHandler(async (req, res) => {
  const user = await User.findOne({ username: req.params.username.toLowerCase() }).populate('followers', 'name username avatar bio isPrivate');
  if (!user) return res.status(404).json({ message: 'Profile not found' });

  const isSelf = req.user && req.user._id.toString() === user._id.toString();
  const isFollowing = req.user
    ? (user.followers || []).some((f) => (f._id || f).toString() === req.user._id.toString())
    : false;

  if (user.isPrivate && !isSelf && !isFollowing) {
    return res.json({ followers: [], isPrivateLocked: true });
  }

  res.json({ followers: (user.followers || []).map(safeUser) });
});

export const getFollowing = asyncHandler(async (req, res) => {
  const user = await User.findOne({ username: req.params.username.toLowerCase() }).populate('following', 'name username avatar bio isPrivate');
  if (!user) return res.status(404).json({ message: 'Profile not found' });

  const isSelf = req.user && req.user._id.toString() === user._id.toString();
  const isFollowing = req.user
    ? (user.followers || []).some((f) => (f._id || f).toString() === req.user._id.toString())
    : false;

  if (user.isPrivate && !isSelf && !isFollowing) {
    return res.json({ following: [], isPrivateLocked: true });
  }

  res.json({ following: (user.following || []).map(safeUser) });
});
