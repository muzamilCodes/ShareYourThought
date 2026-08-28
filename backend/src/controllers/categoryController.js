import Category from '../models/Category.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listCategories = asyncHandler(async (_req, res) => {
  const categories = await Category.find({}).sort({ thoughtCount: -1, name: 1 });
  res.json({ categories });
});

export const getCategory = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug.toLowerCase() });
  if (!category) return res.status(404).json({ message: 'Category not found' });
  res.json({ category });
});
