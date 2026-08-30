import Draft from '../models/Draft.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getDrafts = asyncHandler(async (req, res) => {
  const drafts = await Draft.find({ user: req.user._id }).sort({ updatedAt: -1 }).limit(20);
  res.json({ drafts });
});

export const createDraft = asyncHandler(async (req, res) => {
  const { content, imageUrl, category, hashtags, isStory, gradient } = req.body;
  const draft = await Draft.create({
    user: req.user._id,
    content: content || '',
    imageUrl: imageUrl || '',
    category: category || 'Life',
    hashtags: hashtags || '',
    isStory: Boolean(isStory),
    gradient: gradient || ''
  });
  res.status(201).json({ draft });
});

export const updateDraft = asyncHandler(async (req, res) => {
  const draft = await Draft.findOne({ _id: req.params.id, user: req.user._id });
  if (!draft) return res.status(404).json({ message: 'Draft not found' });

  const { content, imageUrl, category, hashtags, isStory, gradient } = req.body;
  if (content !== undefined) draft.content = content;
  if (imageUrl !== undefined) draft.imageUrl = imageUrl;
  if (category !== undefined) draft.category = category;
  if (hashtags !== undefined) draft.hashtags = hashtags;
  if (isStory !== undefined) draft.isStory = isStory;
  if (gradient !== undefined) draft.gradient = gradient;

  await draft.save();
  res.json({ draft });
});

export const deleteDraft = asyncHandler(async (req, res) => {
  const draft = await Draft.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!draft) return res.status(404).json({ message: 'Draft not found' });
  res.json({ message: 'Draft deleted successfully' });
});
