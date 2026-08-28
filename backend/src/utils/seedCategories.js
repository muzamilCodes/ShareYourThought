import Category from '../models/Category.js';

const categories = [
  { name: 'Life', slug: 'life', description: 'Stories about everyday living and personal growth.', accent: 'ember' },
  { name: 'Technology', slug: 'technology', description: 'Product thinking, tools, AI, and the future of building.', accent: 'graphite' },
  { name: 'Motivation', slug: 'motivation', description: 'Encouragement, momentum, and energy for the day.', accent: 'gold' },
  { name: 'Education', slug: 'education', description: 'Learning, research, and ideas worth teaching.', accent: 'paper' },
  { name: 'Business', slug: 'business', description: 'Founders, strategy, operations, and markets.', accent: 'ink' },
  { name: 'Sports', slug: 'sports', description: 'Competition, discipline, and physical culture.', accent: 'ember' },
  { name: 'Travel', slug: 'travel', description: 'Places, routes, and the feeling of being elsewhere.', accent: 'sea' },
  { name: 'Relationships', slug: 'relationships', description: 'Friendship, love, family, and the people who shape us.', accent: 'rose' },
  { name: 'Creativity', slug: 'creativity', description: 'Writing, art, design, and original thinking.', accent: 'violet' },
  { name: 'Other', slug: 'other', description: 'For everything else that still deserves to be heard.', accent: 'neutral' }
];

export async function seedCategories() {
  const count = await Category.countDocuments();
  if (count > 0) return;
  await Category.insertMany(categories);
}

export { categories as defaultCategories };
