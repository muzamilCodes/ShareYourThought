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
  const featured = thought.featured ? 6 : 0;
  return likesCount * 2.5 + comments * 3 + shares * 1.5 + featured + 8 / Math.sqrt(ageHours);
}

export const createThought = asyncHandler(async (req, res) => {
  const { content, imageUrl, category, hashtags, visibility } = req.body;
  if (!content || !String(content).trim() || !category) {
    return res.status(400).json({ message: 'Content and category are required' });
  }

  const categoryDoc = await Category.findOne({ slug: String(category).trim().toLowerCase() });
  if (!categoryDoc) {
    return res.status(400).json({ message: 'Category does not exist' });
  }

  const thought = await Thought.create({
    author: req.user._id,
    content: String(content).trim(),
    imageUrl: imageUrl ? String(imageUrl).trim() : '',
    category: categoryDoc.slug,
    hashtags: parseHashtags(hashtags),
    visibility: visibility === 'followers' ? 'followers' : 'public'
  });

  categoryDoc.thoughtCount = (categoryDoc.thoughtCount || 0) + 1;
  await categoryDoc.save();

  const populated = await populateThought(Thought.findById(thought._id));
  res.status(201).json({ thought: populated });
});

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

  const thoughts = await populateThought(Thought.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit));
  const total = await Thought.countDocuments(filters);

  res.json({ thoughts, page, limit, total, totalPages: Math.ceil(total / limit) });
});

export const getThought = asyncHandler(async (req, res) => {
  const thought = await populateThought(Thought.findById(req.params.id));
  if (!thought) return res.status(404).json({ message: 'Thought not found' });
  res.json({ thought });
});

export const updateThought = asyncHandler(async (req, res) => {
  const thought = await Thought.findById(req.params.id);
  if (!thought) return res.status(404).json({ message: 'Thought not found' });
  if (thought.author.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'You can only edit your own thought' });
  }

  if (req.body.content !== undefined) thought.content = String(req.body.content).trim();
  if (req.body.imageUrl !== undefined) thought.imageUrl = String(req.body.imageUrl).trim();
  if (req.body.category) thought.category = String(req.body.category).toLowerCase();
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

export const getTrendingThoughts = asyncHandler(async (_req, res) => {
  const thoughts = await populateThought(Thought.find({}).limit(80));
  const ranked = thoughts.sort((a, b) => thoughtScore(b) - thoughtScore(a)).slice(0, 12);
  res.json({ thoughts: ranked });
});

export const getExploreThoughts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const thoughts = await populateThought(Thought.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit));
  const total = await Thought.countDocuments();
  res.json({ thoughts, page, limit, total, totalPages: Math.ceil(total / limit) });
});

export const searchThoughts = asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.json({ thoughts: [] });
  const thoughts = await populateThought(
    Thought.find({
      $or: [
        { content: { $regex: q, $options: 'i' } },
        { hashtags: { $elemMatch: { $regex: q, $options: 'i' } } }
      ]
    }).sort({ createdAt: -1 }).limit(24)
  );
  res.json({ thoughts });
});

export const getThoughtByCategory = asyncHandler(async (req, res) => {
  const thoughts = await populateThought(
    Thought.find({ category: req.params.slug.toLowerCase() }).sort({ createdAt: -1 }).limit(24)
  );
  res.json({ thoughts });
});
