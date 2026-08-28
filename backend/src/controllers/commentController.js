import Comment from '../models/Comment.js';
import Thought from '../models/Thought.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createNotification } from '../utils/notifications.js';

function populateCommentQuery(query) {
  return query
    .populate('author', 'name username avatar bio')
    .populate({
      path: 'replies',
      populate: { path: 'author', select: 'name username avatar bio' }
    });
}

export const getCommentsByThought = asyncHandler(async (req, res) => {
  const comments = await populateCommentQuery(
    Comment.find({ thought: req.params.thoughtId, parentComment: null }).sort({ createdAt: -1 })
  );
  res.json({ comments: comments || [] });
});

export const createComment = asyncHandler(async (req, res) => {
  const { content, parentComment } = req.body;
  if (!content || !String(content).trim()) {
    return res.status(400).json({ message: 'Comment text is required' });
  }

  const thought = await Thought.findById(req.params.thoughtId);
  if (!thought) return res.status(404).json({ message: 'Thought not found' });

  const comment = await Comment.create({
    thought: thought._id,
    author: req.user._id,
    content: String(content).trim(),
    parentComment: parentComment || null
  });

  if (parentComment) {
    await Comment.findByIdAndUpdate(parentComment, { $push: { replies: comment._id } });
  } else {
    thought.commentsCount = (thought.commentsCount || 0) + 1;
    await thought.save();
  }

  const populated = await populateCommentQuery(Comment.findById(comment._id));

  let recipient = thought.author;
  if (parentComment) {
    const parentDoc = await Comment.findById(parentComment);
    if (parentDoc) recipient = parentDoc.author;
  }

  await createNotification({
    recipient,
    actor: req.user._id,
    type: parentComment ? 'reply' : 'comment',
    title: parentComment ? `${req.user.name} replied to your comment` : `${req.user.name} commented on your thought`,
    body: String(content).slice(0, 120),
    thought: thought._id,
    comment: comment._id
  });

  res.status(201).json({ comment: populated });
});

export const updateComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) return res.status(404).json({ message: 'Comment not found' });
  if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'You can only edit your own comment' });
  }

  if (req.body.content !== undefined) comment.content = String(req.body.content).trim();
  await comment.save();
  res.json({ comment: await populateCommentQuery(Comment.findById(comment._id)) });
});

export const deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) return res.status(404).json({ message: 'Comment not found' });
  if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'You can only delete your own comment' });
  }

  if (comment.parentComment) {
    await Comment.findByIdAndUpdate(comment.parentComment, { $pull: { replies: comment._id } });
  } else {
    await Thought.findByIdAndUpdate(comment.thought, { $inc: { commentsCount: -1 } });
    if (comment.replies?.length) {
      await Comment.deleteMany({ _id: { $in: comment.replies } });
    }
  }

  await Comment.deleteOne({ _id: comment._id });
  res.json({ message: 'Comment deleted successfully' });
});

export const toggleCommentLike = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) return res.status(404).json({ message: 'Comment not found' });

  const userId = req.user._id.toString();
  const liked = comment.likes.some((like) => like.toString() === userId);
  if (liked) {
    comment.likes = comment.likes.filter((like) => like.toString() !== userId);
  } else {
    comment.likes.push(req.user._id);
  }
  await comment.save();
  res.json({ liked: !liked, likes: comment.likes.length });
});
