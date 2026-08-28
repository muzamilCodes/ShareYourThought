import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import { seedCategories } from '../utils/seedCategories.js';
import User from '../models/User.js';
import Thought from '../models/Thought.js';
import Comment from '../models/Comment.js';
import Notification from '../models/Notification.js';
import Category from '../models/Category.js';

const demoUsers = [
  {
    name: 'Mina Hart',
    username: 'minahart',
    email: 'mina@example.com',
    password: 'Password123!',
    bio: 'I collect tiny truths and turn them into essays.',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Mina%20Hart'
  },
  {
    name: 'Jonah Vale',
    username: 'jonahvale',
    email: 'jonah@example.com',
    password: 'Password123!',
    bio: 'Building in public, one honest thought at a time.',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Jonah%20Vale'
  },
  {
    name: 'Ari Chen',
    username: 'arichen',
    email: 'ari@example.com',
    password: 'Password123!',
    bio: 'Writing about culture, work, and the long middle.',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Ari%20Chen'
  }
];

const demoThoughts = [
  {
    username: 'minahart',
    content: 'A good life is rarely a loud one. It is usually just a set of small promises kept with care.',
    category: 'life',
    hashtags: ['life', 'reflection', 'slow'],
    featured: true
  },
  {
    username: 'jonahvale',
    content: 'Productivity becomes meaningful the moment it stops asking you to become someone else.',
    category: 'business',
    hashtags: ['work', 'clarity', 'design'],
    featured: false
  },
  {
    username: 'arichen',
    content: 'The best technology is not the one that feels futuristic. It is the one that feels invisible.',
    category: 'technology',
    hashtags: ['tech', 'future', 'product'],
    featured: true
  }
];

async function seed() {
  await connectDB();
  await Promise.all([
    User.deleteMany({}),
    Thought.deleteMany({}),
    Comment.deleteMany({}),
    Notification.deleteMany({}),
    Category.deleteMany({})
  ]);

  await seedCategories();

  const users = {};
  for (const item of demoUsers) {
    const user = await User.create(item);
    users[item.username] = user;
  }

  // Set follow relationships
  users.minahart.followers.push(users.jonahvale._id, users.arichen._id);
  users.jonahvale.following.push(users.minahart._id);
  users.arichen.following.push(users.minahart._id);
  await Promise.all([users.minahart.save(), users.jonahvale.save(), users.arichen.save()]);

  const thoughts = [];
  for (const thought of demoThoughts) {
    const doc = await Thought.create({
      author: users[thought.username]._id,
      content: thought.content,
      category: thought.category,
      hashtags: thought.hashtags,
      featured: thought.featured || false,
      imageUrl: '',
      likes: [users.minahart._id, users.jonahvale._id]
    });
    await Category.updateOne({ slug: thought.category }, { $inc: { thoughtCount: 1 } });
    thoughts.push(doc);
  }

  const c1 = await Comment.create({
    thought: thoughts[0]._id,
    author: users.jonahvale._id,
    content: 'This is exactly the kind of thought this platform should amplify.'
  });
  const c2 = await Comment.create({
    thought: thoughts[0]._id,
    author: users.arichen._id,
    content: 'Quiet ideas travel the farthest when they are written well.'
  });

  thoughts[0].commentsCount = 2;
  await thoughts[0].save();

  console.log(`Successfully seeded ${Object.keys(users).length} users, ${thoughts.length} thoughts, and categories!`);
  await mongoose.disconnect();
}

seed().catch((error) => {
  console.error('Seed script error:', error);
  process.exit(1);
});
