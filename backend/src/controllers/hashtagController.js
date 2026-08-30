import Thought from '../models/Thought.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getHashtagThoughts = asyncHandler(async (req, res) => {
  const tag = req.params.tag.toLowerCase().replace(/^#/, '');
  const thoughts = await Thought.find({
    hashtags: tag,
    isStory: { $ne: true }
  })
    .populate('author', 'name username avatar role isPrivate')
    .sort({ createdAt: -1 })
    .limit(30);

  const total = await Thought.countDocuments({ hashtags: tag, isStory: { $ne: true } });

  res.json({
    tag: `#${tag}`,
    total,
    thoughts
  });
});

export const getTrendingHashtags = asyncHandler(async (req, res) => {
  // Aggregate top 15 hashtags from thoughts created in the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const results = await Thought.aggregate([
    { $match: { isStory: { $ne: true }, createdAt: { $gte: thirtyDaysAgo } } },
    { $unwind: '$hashtags' },
    {
      $group: {
        _id: '$hashtags',
        count: { $sum: 1 },
        totalViews: { $sum: '$viewsCount' },
        totalLikes: { $sum: { $size: { $ifNull: ['$likes', []] } } }
      }
    },
    { $sort: { count: -1, totalViews: -1 } },
    { $limit: 15 }
  ]);

  const hashtags = results.map((r) => ({
    tag: r._id,
    count: r.count,
    views: r.totalViews,
    likes: r.totalLikes
  }));

  res.json({ hashtags });
});

export const universalSearch = asyncHandler(async (req, res) => {
  const query = (req.query.q || '').trim();
  if (!query) {
    return res.json({ users: [], thoughts: [], hashtags: [], categories: [] });
  }

  const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

  const [users, thoughts, categories] = await Promise.all([
    User.find({
      $or: [{ name: regex }, { username: regex }, { bio: regex }]
    })
      .select('name username avatar role bio followers')
      .limit(10),
    Thought.find({
      isStory: { $ne: true },
      $or: [{ content: regex }, { category: regex }, { hashtags: regex }]
    })
      .populate('author', 'name username avatar role')
      .sort({ createdAt: -1 })
      .limit(20),
    Category.find({
      $or: [{ name: regex }, { slug: regex }, { description: regex }]
    }).limit(6)
  ]);

  // Extract matching hashtags from matching thoughts
  const tagMatches = new Set();
  thoughts.forEach((t) => {
    (t.hashtags || []).forEach((h) => {
      if (h.toLowerCase().includes(query.toLowerCase().replace(/^#/, ''))) {
        tagMatches.add(h.toLowerCase());
      }
    });
  });

  res.json({
    users,
    thoughts,
    hashtags: Array.from(tagMatches).slice(0, 10),
    categories
  });
});
