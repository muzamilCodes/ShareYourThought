import Report from '../models/Report.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createReport = asyncHandler(async (req, res) => {
  const { targetType, targetId, reason, details } = req.body;
  if (!targetType || !targetId || !reason) {
    return res.status(400).json({ message: 'Target type, target ID and reason are required' });
  }

  const report = await Report.create({
    reporter: req.user._id,
    targetType,
    targetId,
    reason,
    details: details || ''
  });

  res.status(201).json({ report });
});

export const listReports = asyncHandler(async (_req, res) => {
  const reports = await Report.find({}).sort({ createdAt: -1 }).populate('reporter', 'name username avatar');
  res.json({ reports });
});
