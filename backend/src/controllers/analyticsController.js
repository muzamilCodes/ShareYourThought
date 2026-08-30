import Thought from '../models/Thought.js';
import Comment from '../models/Comment.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getCreatorAnalytics = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const [user, userThoughts] = await Promise.all([
    User.findById(userId).select('followers following createdAt name username avatar bio role'),
    Thought.find({ author: userId, isStory: { $ne: true } })
      .sort({ createdAt: -1 })
      .lean()
  ]);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const thoughtIds = userThoughts.map((t) => t._id);

  // Fetch all comments received on user's thoughts
  const allComments = await Comment.find({
    thought: { $in: thoughtIds }
  }).lean();

  const totalThoughts = userThoughts.length;
  let totalViews = 0;
  let totalLikes = 0;
  let totalSaves = 0;
  let totalShares = 0;

  const categoryCounts = {};

  userThoughts.forEach((t) => {
    totalViews += t.viewsCount || 0;
    totalLikes += Array.isArray(t.likes) ? t.likes.length : (t.likes || 0);
    totalSaves += Array.isArray(t.saves) ? t.saves.length : (t.saves || 0);
    totalShares += t.sharesCount || 0;

    const cat = t.category || 'General';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  const totalComments = allComments.length;
  const followersCount = Array.isArray(user.followers) ? user.followers.length : (user.followers || 0);
  const followingCount = Array.isArray(user.following) ? user.following.length : (user.following || 0);

  // Real Engagement Calculation
  const totalInteractions = totalLikes + totalComments + totalSaves + totalShares;
  const engagementRate = totalViews > 0
    ? ((totalInteractions / totalViews) * 100).toFixed(1)
    : totalThoughts > 0
      ? ((totalInteractions / totalThoughts) * 10).toFixed(1)
      : '0.0';

  const viewsPerThought = totalThoughts > 0 ? (totalViews / totalThoughts).toFixed(1) : '0';
  const likesPerThought = totalThoughts > 0 ? (totalLikes / totalThoughts).toFixed(1) : '0';
  const commentsPerThought = totalThoughts > 0 ? (totalComments / totalThoughts).toFixed(1) : '0';

  // Real Top Performing Thoughts (ranked by actual interactions & views)
  const topThoughts = [...userThoughts]
    .sort((a, b) => {
      const aLikes = Array.isArray(a.likes) ? a.likes.length : (a.likes || 0);
      const bLikes = Array.isArray(b.likes) ? b.likes.length : (b.likes || 0);
      const aComments = allComments.filter((c) => String(c.thought) === String(a._id)).length;
      const bComments = allComments.filter((c) => String(c.thought) === String(b._id)).length;
      const scoreA = (a.viewsCount || 0) + aLikes * 3 + aComments * 2 + (a.sharesCount || 0) * 2;
      const scoreB = (b.viewsCount || 0) + bLikes * 3 + bComments * 2 + (b.sharesCount || 0) * 2;
      return scoreB - scoreA;
    })
    .slice(0, 5)
    .map((t) => {
      const likesCount = Array.isArray(t.likes) ? t.likes.length : (t.likes || 0);
      const thoughtCommentsCount = allComments.filter((c) => String(c.thought) === String(t._id)).length;
      return {
        _id: t._id,
        content: t.content,
        category: t.category,
        views: t.viewsCount || 0,
        viewsCount: t.viewsCount || 0,
        likes: likesCount,
        likesCount,
        comments: thoughtCommentsCount,
        commentsCount: thoughtCommentsCount,
        shares: t.sharesCount || 0,
        sharesCount: t.sharesCount || 0,
        createdAt: t.createdAt
      };
    });

  // Real 7-Day Performance Timeline (calculated from real MongoDB timestamps)
  const daysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const timeline = [];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const targetDay = new Date(now);
    targetDay.setDate(now.getDate() - i);

    const startOfDay = new Date(targetDay.getFullYear(), targetDay.getMonth(), targetDay.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(targetDay.getFullYear(), targetDay.getMonth(), targetDay.getDate(), 23, 59, 59, 999);

    const thoughtsOnDay = userThoughts.filter((t) => {
      const d = new Date(t.createdAt);
      return d >= startOfDay && d <= endOfDay;
    });

    const commentsOnDay = allComments.filter((c) => {
      const d = new Date(c.createdAt);
      return d >= startOfDay && d <= endOfDay;
    });

    let dayViews = 0;
    let dayLikes = 0;
    let dayShares = 0;

    thoughtsOnDay.forEach((t) => {
      dayViews += t.viewsCount || 0;
      dayLikes += Array.isArray(t.likes) ? t.likes.length : (t.likes || 0);
      dayShares += t.sharesCount || 0;
    });

    timeline.push({
      day: daysShort[startOfDay.getDay()],
      date: startOfDay.toISOString().split('T')[0],
      formattedDate: `${startOfDay.toLocaleString('default', { month: 'short' })} ${startOfDay.getDate()}`,
      posts: thoughtsOnDay.length,
      views: dayViews,
      likes: dayLikes,
      comments: commentsOnDay.length,
      shares: dayShares
    });
  }

  // Category Breakdown array
  const categoryBreakdown = Object.entries(categoryCounts).map(([name, count]) => ({
    name,
    count,
    percentage: totalThoughts > 0 ? Math.round((count / totalThoughts) * 100) : 0
  }));

  res.json({
    metrics: {
      totalThoughts,
      totalViews,
      totalLikes,
      totalSaves,
      totalComments,
      totalShares,
      totalFollowers: followersCount,
      totalFollowing: followingCount,
      followersCount,
      followingCount,
      engagementRate: `${engagementRate}%`,
      viewsPerThought,
      likesPerThought,
      commentsPerThought
    },
    topThoughts,
    timeline,
    categoryBreakdown,
    creator: {
      _id: user._id,
      name: user.name,
      username: user.username,
      avatar: user.avatar,
      joinedDate: user.createdAt
    }
  });
});
