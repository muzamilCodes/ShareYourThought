import Thought from '../models/Thought.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Comment from '../models/Comment.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { paginate } from '../utils/paginate.js';
import { createNotification } from '../utils/notifications.js';

function parseHashtags(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((tag) => String(tag).trim().replace(/^#/, '').toLowerCase()).filter(Boolean);
  }
  return String(value)
    .split(/[\s,]+/)
    .map((tag) => tag.trim().replace(/^#/, '').toLowerCase())
    .filter(Boolean);
}

function populateThought(query) {
  return query.populate('author', 'name username avatar bio');
}

function thoughtScore(thought) {
  const ageHours = Math.max((Date.now() - new Date(thought.createdAt).getTime()) / 36e5, 0.1);
  const likesCount = thought.likes?.length || 0;
  const comments = thought.commentsCount || 0;
  const shares = thought.sharesCount || 0;
  const views = thought.viewsCount || 0;
  const saves = thought.saves?.length || 0;
  const featured = thought.featured ? 15 : 0;

  // Engagement points: Likes (5x), Comments (4x), Saves (4x), Shares (3x), Views (1x)
  const rawEngagement = (likesCount * 5) + (comments * 4) + (saves * 4) + (shares * 3) + (views * 1) + featured;

  // Time-decay gravity formula
  const gravity = 1.3;
  const timeDecayScore = (rawEngagement + 1) / Math.pow(ageHours + 2, gravity);

  return timeDecayScore * 50 + rawEngagement * 10;
}

async function findOrCreateCategory(categoryInput) {
  const cleanName = String(categoryInput || 'General').trim();
  const slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'general';
  
  let categoryDoc = await Category.findOne({ $or: [{ slug }, { name: new RegExp(`^${cleanName}$`, 'i') }] });
  if (!categoryDoc) {
    categoryDoc = await Category.create({
      name: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
      slug,
      description: `${cleanName} thoughts and discussions.`,
      accent: 'neutral',
      thoughtCount: 0
    });
  }
  return categoryDoc;
}

export const createThought = asyncHandler(async (req, res) => {
  const { content, imageUrl, category, hashtags, visibility } = req.body;
  if (!content || !String(content).trim() || !category) {
    return res.status(400).json({ message: 'Content and category are required' });
  }

  const categoryDoc = await findOrCreateCategory(category);

  const thought = await Thought.create({
    author: req.user._id,
    content: String(content).trim(),
    imageUrl: imageUrl ? String(imageUrl).trim() : '',
    category: categoryDoc.slug,
    hashtags: parseHashtags(hashtags),
    visibility: visibility === 'followers' ? 'followers' : 'public',
    viewsCount: 0
  });

  categoryDoc.thoughtCount = (categoryDoc.thoughtCount || 0) + 1;
  await categoryDoc.save();

  const populated = await populateThought(Thought.findById(thought._id));
  res.status(201).json({ thought: populated });
});

async function applyPrivateFilter(filters, req) {
  const currentUserIdStr = req.user?._id ? req.user._id.toString() : '';
  const followingIds = (req.user?.following || []).map((id) => id.toString());
  const allowedAuthorIds = [...(currentUserIdStr ? [currentUserIdStr] : []), ...followingIds];

  const privateUsers = await User.find({ isPrivate: true }).select('_id');
  const privateIds = privateUsers.map((u) => u._id.toString());
  const hiddenPrivateIds = privateIds.filter((id) => !allowedAuthorIds.includes(id));

  if (hiddenPrivateIds.length > 0) {
    if (filters.author) {
      if (typeof filters.author === 'string' && hiddenPrivateIds.includes(filters.author)) {
        return false;
      }
    } else {
      filters.author = { $nin: hiddenPrivateIds };
    }
  }
  return true;
}

export const getThoughts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const filters = {};
  if (req.query.category && req.query.category !== 'all') {
    filters.category = String(req.query.category).toLowerCase();
  }
  if (req.query.author) filters.author = req.query.author;
  if (req.query.q) {
    filters.$or = [
      { content: { $regex: req.query.q, $options: 'i' } },
      { hashtags: { $elemMatch: { $regex: req.query.q, $options: 'i' } } }
    ];
  }

  const allowed = await applyPrivateFilter(filters, req);
  if (!allowed) {
    return res.json({ thoughts: [], page, limit, total: 0, totalPages: 0 });
  }

  const sortMode = req.query.sort || 'newest';
  const followingIds = (req.user?.following || []).map((id) => id.toString());

  if (sortMode === 'following') {
    if (!req.user || !followingIds.length) {
      return res.json({ thoughts: [], page, limit, total: 0, totalPages: 0 });
    }
    const followingFilters = { ...filters, author: { $in: req.user.following } };
    const thoughts = await populateThought(Thought.find(followingFilters).sort({ createdAt: -1 }).skip(skip).limit(limit));
    const total = await Thought.countDocuments(followingFilters);
    return res.json({ thoughts, page, limit, total, totalPages: Math.ceil(total / limit) });
  }

  if (sortMode === 'trending') {
    const allMatching = await populateThought(Thought.find(filters).limit(200));
    const ranked = allMatching.sort((a, b) => {
      const aIsFollowed = a.author && followingIds.includes(a.author._id ? a.author._id.toString() : a.author.toString());
      const bIsFollowed = b.author && followingIds.includes(b.author._id ? b.author._id.toString() : b.author.toString());
      const aBonus = aIsFollowed ? 400 : 0;
      const bBonus = bIsFollowed ? 400 : 0;
      return (thoughtScore(b) + bBonus) - (thoughtScore(a) + aBonus);
    });
    const paginated = ranked.slice(skip, skip + limit);
    const total = allMatching.length;
    return res.json({ thoughts: paginated, page, limit, total, totalPages: Math.ceil(total / limit) });
  }

  if (sortMode === 'popular') {
    const allMatching = await populateThought(Thought.find(filters).limit(200));
    const ranked = allMatching.sort((a, b) => {
      const bTotal = (b.likes?.length || 0) + (b.commentsCount || 0) + (b.viewsCount || 0);
      const aTotal = (a.likes?.length || 0) + (a.commentsCount || 0) + (a.viewsCount || 0);
      return bTotal - aTotal;
    });
    const paginated = ranked.slice(skip, skip + limit);
    const total = allMatching.length;
    return res.json({ thoughts: paginated, page, limit, total, totalPages: Math.ceil(total / limit) });
  }

  // Newest with Followed Priority
  const allMatching = await populateThought(Thought.find(filters).limit(200));
  const ranked = allMatching.sort((a, b) => {
    const aIsFollowed = a.author && followingIds.includes(a.author._id ? a.author._id.toString() : a.author.toString()) ? 1 : 0;
    const bIsFollowed = b.author && followingIds.includes(b.author._id ? b.author._id.toString() : b.author.toString()) ? 1 : 0;
    if (aIsFollowed !== bIsFollowed) return bIsFollowed - aIsFollowed;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  const paginated = ranked.slice(skip, skip + limit);
  const total = allMatching.length;

  res.json({ thoughts: paginated, page, limit, total, totalPages: Math.ceil(total / limit) });
});

export const getThought = asyncHandler(async (req, res) => {
  const thought = await populateThought(Thought.findById(req.params.id));
  if (!thought) return res.status(404).json({ message: 'Thought not found' });

  if (thought.author) {
    const authorDoc = await User.findById(thought.author._id || thought.author);
    if (authorDoc?.isPrivate) {
      const currentUserIdStr = req.user?._id ? req.user._id.toString() : '';
      const isSelf = currentUserIdStr === authorDoc._id.toString();
      const isFollowing = currentUserIdStr
        ? (authorDoc.followers || []).some((id) => id.toString() === currentUserIdStr)
        : false;
      if (!isSelf && !isFollowing) {
        return res.status(403).json({ message: 'This account is private', isPrivateLocked: true });
      }
    }
  }

  res.json({ thought });
});

export const recordView = asyncHandler(async (req, res) => {
  const thought = await Thought.findByIdAndUpdate(
    req.params.id,
    { $inc: { viewsCount: 1 } },
    { new: true }
  );
  if (!thought) return res.status(404).json({ message: 'Thought not found' });
  res.json({ views: thought.viewsCount });
});

export const updateThought = asyncHandler(async (req, res) => {
  const thought = await Thought.findById(req.params.id);
  if (!thought) return res.status(404).json({ message: 'Thought not found' });
  if (thought.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'You can only edit your own thought' });
  }

  if (req.body.content !== undefined) thought.content = String(req.body.content).trim();
  if (req.body.imageUrl !== undefined) thought.imageUrl = String(req.body.imageUrl).trim();
  if (req.body.category) {
    const oldCategory = thought.category;
    const newCategoryDoc = await findOrCreateCategory(req.body.category);
    thought.category = newCategoryDoc.slug;

    if (oldCategory !== newCategoryDoc.slug) {
      await Category.updateOne({ slug: oldCategory }, { $inc: { thoughtCount: -1 } });
      await Category.updateOne({ slug: newCategoryDoc.slug }, { $inc: { thoughtCount: 1 } });
    }
  }
  if (req.body.hashtags !== undefined) thought.hashtags = parseHashtags(req.body.hashtags);
  if (req.body.visibility !== undefined) thought.visibility = req.body.visibility === 'followers' ? 'followers' : 'public';
  await thought.save();

  res.json({ thought: await populateThought(Thought.findById(thought._id)) });
});

export const deleteThought = asyncHandler(async (req, res) => {
  const thought = await Thought.findById(req.params.id);
  if (!thought) return res.status(404).json({ message: 'Thought not found' });
  if (thought.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'You can only delete your own thought' });
  }

  await Promise.all([
    Comment.deleteMany({ thought: thought._id }),
    User.updateMany({ savedThoughts: thought._id }, { $pull: { savedThoughts: thought._id } }),
    Category.updateOne({ slug: thought.category }, { $inc: { thoughtCount: -1 } })
  ]);

  await thought.deleteOne();
  res.json({ message: 'Thought deleted successfully' });
});

export const toggleLikeThought = asyncHandler(async (req, res) => {
  const thought = await Thought.findById(req.params.id);
  if (!thought) return res.status(404).json({ message: 'Thought not found' });

  const userId = req.user._id.toString();
  const liked = thought.likes.some((like) => like.toString() === userId);

  if (liked) {
    thought.likes = thought.likes.filter((like) => like.toString() !== userId);
  } else {
    thought.likes.push(req.user._id);
    await createNotification({
      recipient: thought.author,
      actor: req.user._id,
      type: 'like',
      title: `${req.user.name} liked your thought`,
      body: thought.content.slice(0, 80),
      thought: thought._id
    });
  }

  await thought.save();
  res.json({ liked: !liked, likes: thought.likes.length });
});

export const toggleSaveThought = asyncHandler(async (req, res) => {
  const [thought, user] = await Promise.all([
    Thought.findById(req.params.id),
    User.findById(req.user._id)
  ]);
  if (!thought) return res.status(404).json({ message: 'Thought not found' });

  const saved = user.savedThoughts.some((savedId) => savedId.toString() === thought._id.toString());
  if (saved) {
    user.savedThoughts = user.savedThoughts.filter((savedId) => savedId.toString() !== thought._id.toString());
    thought.saves = thought.saves.filter((savedId) => savedId.toString() !== user._id.toString());
  } else {
    user.savedThoughts.push(thought._id);
    thought.saves.push(user._id);
  }

  await Promise.all([user.save(), thought.save()]);
  res.json({ saved: !saved, saves: thought.saves.length });
});

export const shareThought = asyncHandler(async (req, res) => {
  const thought = await Thought.findById(req.params.id);
  if (!thought) return res.status(404).json({ message: 'Thought not found' });
  thought.sharesCount = (thought.sharesCount || 0) + 1;
  await thought.save();
  res.json({ shares: thought.sharesCount });
});

export const getTrendingThoughts = asyncHandler(async (req, res) => {
  const filters = {};
  await applyPrivateFilter(filters, req);
  const thoughts = await populateThought(Thought.find(filters).limit(120));
  const ranked = thoughts.sort((a, b) => thoughtScore(b) - thoughtScore(a)).slice(0, 16);
  res.json({ thoughts: ranked });
});

export const getExploreThoughts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const filters = {};
  await applyPrivateFilter(filters, req);
  const sortMode = req.query.sort || 'trending';

  if (sortMode === 'trending') {
    const allMatching = await populateThought(Thought.find(filters).limit(200));
    const ranked = allMatching.sort((a, b) => thoughtScore(b) - thoughtScore(a));
    const paginated = ranked.slice(skip, skip + limit);
    return res.json({ thoughts: paginated, page, limit, total: allMatching.length, totalPages: Math.ceil(allMatching.length / limit) });
  }

  const thoughts = await populateThought(Thought.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit));
  const total = await Thought.countDocuments(filters);
  res.json({ thoughts, page, limit, total, totalPages: Math.ceil(total / limit) });
});

export const searchThoughts = asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.json({ thoughts: [] });
  const filters = {
    $or: [
      { content: { $regex: q, $options: 'i' } },
      { hashtags: { $elemMatch: { $regex: q, $options: 'i' } } }
    ]
  };
  await applyPrivateFilter(filters, req);
  const thoughts = await populateThought(
    Thought.find(filters).sort({ createdAt: -1 }).limit(24)
  );
  res.json({ thoughts });
});

export const getThoughtByCategory = asyncHandler(async (req, res) => {
  const filters = { category: req.params.slug.toLowerCase() };
  await applyPrivateFilter(filters, req);
  const thoughts = await populateThought(
    Thought.find(filters).sort({ createdAt: -1 }).limit(24)
  );
  res.json({ thoughts });
});

export const getPlatformStats = asyncHandler(async (_req, res) => {
  const [totalThoughts, totalUsers, totalCategories, thoughts] = await Promise.all([
    Thought.countDocuments(),
    User.countDocuments(),
    Category.countDocuments(),
    Thought.find({}).select('likes commentsCount sharesCount viewsCount')
  ]);

  let totalLikes = 0;
  let totalComments = 0;
  let totalViews = 0;

  thoughts.forEach((t) => {
    totalLikes += t.likes?.length || 0;
    totalComments += t.commentsCount || 0;
    totalViews += t.viewsCount || 0;
  });

  res.json({
    totalThoughts,
    totalUsers,
    totalCategories,
    totalLikes,
    totalComments,
    totalViews
  });
});


