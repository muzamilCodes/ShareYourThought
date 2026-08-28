export const demoCategories = [
  'Life',
  'Technology',
  'Motivation',
  'Education',
  'Business',
  'Sports',
  'Travel',
  'Relationships',
  'Creativity',
  'Other'
];

export const demoThoughts = [
  {
    _id: 'demo-1',
    content: 'A calm mind does not mean a quiet life. It means the noise no longer gets to decide the shape of the day.',
    category: 'life',
    hashtags: ['life', 'reflection', 'slow'],
    likes: [],
    saves: [],
    sharesCount: 12,
    commentsCount: 4,
    featured: true,
    createdAt: '2026-08-24T10:00:00.000Z',
    author: {
      name: 'Mina Hart',
      username: 'minahart',
      bio: 'I collect tiny truths and turn them into essays.',
      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Mina%20Hart'
    }
  },
  {
    _id: 'demo-2',
    content: 'Good products do not beg for attention. They keep solving the same problem until people trust them enough to stop noticing the mechanism.',
    category: 'technology',
    hashtags: ['product', 'build', 'tech'],
    likes: [],
    saves: [],
    sharesCount: 15,
    commentsCount: 6,
    createdAt: '2026-08-23T10:00:00.000Z',
    author: {
      name: 'Jonah Vale',
      username: 'jonahvale',
      bio: 'Building in public, one honest thought at a time.',
      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Jonah%20Vale'
    }
  },
  {
    _id: 'demo-3',
    content: 'Education becomes powerful when it stops performing certainty and starts teaching how to ask better questions.',
    category: 'education',
    hashtags: ['education', 'learning', 'questions'],
    likes: [],
    saves: [],
    sharesCount: 9,
    commentsCount: 2,
    createdAt: '2026-08-22T12:00:00.000Z',
    author: {
      name: 'Ari Chen',
      username: 'arichen',
      bio: 'Writing about culture, work, and the long middle.',
      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Ari%20Chen'
    }
  }
];

export const demoProfile = {
  name: 'Mina Hart',
  username: 'minahart',
  bio: 'I collect tiny truths and turn them into essays.',
  followers: 10984,
  following: 314,
  avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Mina%20Hart'
};

export const demoStats = [
  { value: '10K+', label: 'People sharing ideas' },
  { value: '42K', label: 'Thoughts shared' },
  { value: '8.1K', label: 'Active users today' },
  { value: '17K', label: 'Comments posted' }
];
