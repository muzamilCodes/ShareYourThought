import Report from '../models/Report.js';
import Thought from '../models/Thought.js';
import Comment from '../models/Comment.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createReport = asyncHandler(async (req, res) => {
  const { targetType, targetId, reason, description, details } = req.body;
  if (!targetType || !targetId || !reason) {
    return res.status(400).json({ message: 'Target type, target ID and reason are required' });
  }

  const validTypes = ['thought', 'comment', 'user'];
  if (!validTypes.includes(targetType)) {
    return res.status(400).json({ message: 'Invalid target type' });
  }

  const report = await Report.create({
    reporter: req.user._id,
    targetType,
    targetId,
    reason: reason.toLowerCase(),
    details: details || description || '',
    status: 'pending'
  });

  res.status(201).json({ report });
});

export const listReports = asyncHandler(async (req, res) => {
  const { status, targetType, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status && status !== 'all') filter.status = status;
  if (targetType && targetType !== 'all') filter.targetType = targetType;

  const skip = (Number(page) - 1) * Number(limit);

  const [reports, total] = await Promise.all([
    Report.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('reporter', 'name username avatar role')
      .populate('reviewedBy', 'name username avatar'),
    Report.countDocuments(filter)
  ]);

  res.json({ reports, total, page: Number(page) });
});

export const updateReport = asyncHandler(async (req, res) => {
  const { status, action } = req.body;
  const report = await Report.findById(req.params.id);
  if (!report) return res.status(404).json({ message: 'Report not found' });

  if (status) report.status = status;
  report.reviewedBy = req.user._id;
  report.reviewedAt = new Date();
  await report.save();

  // If action is 'delete_target', delete the offending item
  if (action === 'delete_target') {
    if (report.targetType === 'thought') {
      await Thought.findByIdAndDelete(report.targetId);
      await Comment.deleteMany({ thought: report.targetId });
    } else if (report.targetType === 'comment') {
      await Comment.findByIdAndDelete(report.targetId);
    }
  }

  res.json({ success: true, report });
});

export const deleteReport = asyncHandler(async (req, res) => {
  const report = await Report.findByIdAndDelete(req.params.id);
  if (!report) return res.status(404).json({ message: 'Report not found' });
  res.json({ success: true, message: 'Report dismissed' });
});
