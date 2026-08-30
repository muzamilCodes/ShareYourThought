export type Thought = {
  _id: string;
  content: string;
  imageUrl?: string;
  category: string;
  hashtags: string[];
  likes: Array<string | User>;
  saves: Array<string | User>;
  sharesCount: number;
  commentsCount: number;
  viewsCount?: number;
  views?: number;
  shares?: number;
  featured?: boolean;
  isStory?: boolean;
  storyExpiresAt?: string;
  gradient?: string;
  createdAt: string;
  updatedAt?: string;
  author: User;
};

export type CreateThoughtInput = {
  content: string;
  imageUrl?: string;
  category: string;
  hashtags?: string | string[];
  gradient?: string;
  isStory?: boolean;
};

export type Comment = {
  _id: string;
  content: string;
  author: User;
  thought: string;
  parentComment?: string | null;
  parentCommentId?: string | null;
  replies?: Comment[];
  likes?: Array<string | User>;
  createdAt: string;
};

export type Notification = {
  _id: string;
  type: 'follow' | 'follow_request' | 'follow_accepted' | 'like' | 'comment' | 'reply' | 'message' | 'system';
  title: string;
  body: string;
  read: boolean;
  actor: User;
  thought?: Thought | null;
  comment?: Comment | null;
  createdAt: string;
};

export type User = {
  _id: string;
  id?: string;
  name: string;
  username: string;
  email?: string;
  bio?: string;
  avatar?: string;
  role: 'user' | 'admin';
  isPrivate?: boolean;
  website?: string;
  location?: string;
  followers?: string[] | User[] | number;
  following?: string[] | User[] | number;
  savedThoughts?: string[] | Thought[] | number;
  pendingFollowRequests?: string[] | User[];
  createdAt?: string;
};

export type Category = {
  _id: string;
  name: string;
  slug: string;
  description: string;
  accent: string;
  count?: number;
  thoughtCount?: number;
};

export type AuthSession = {
  token: string;
  user: User;
};

export type Conversation = {
  partner: User;
  lastMessage: {
    content: string;
    createdAt: string;
    isSender: boolean;
  };
  unreadCount: number;
};

export type Message = {
  _id: string;
  sender: User | string;
  recipient: User | string;
  content: string;
  read: boolean;
  status?: 'sent' | 'delivered' | 'seen';
  seenAt?: string;
  createdAt: string;
};

export type Draft = {
  _id: string;
  author: string | User;
  content: string;
  imageUrl?: string;
  category?: string;
  hashtags?: string;
  isStory?: boolean;
  gradient?: string;
  createdAt: string;
  updatedAt: string;
};

export type Report = {
  _id: string;
  reporter: User | string;
  targetType: 'thought' | 'comment' | 'user';
  targetId: string;
  reason: 'spam' | 'harassment' | 'hate_speech' | 'misinformation' | 'inappropriate' | 'other';
  details?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  reviewedBy?: User | string;
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreatorAnalytics = {
  periodDays?: number;
  metrics?: {
    totalThoughts: number;
    totalLikes: number;
    totalSaves?: number;
    totalComments: number;
    totalShares: number;
    totalViews: number;
    totalFollowers: number;
    totalFollowing?: number;
    followersCount?: number;
    followingCount?: number;
    engagementRate: number | string;
    viewsPerThought: number | string;
    likesPerThought: number | string;
    commentsPerThought: number | string;
  };
  timeline?: Array<{
    day?: string;
    date: string;
    formattedDate?: string;
    posts?: number;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    thoughts?: number;
  }>;
  topThoughts?: Thought[];
  categoryBreakdown?: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
  creator?: {
    _id: string;
    name: string;
    username: string;
    avatar?: string;
    joinedDate?: string;
  };
  totals?: any;
  performance?: any;
  dailyTrends?: any[];
};

export type HashtagSummary = {
  tag: string;
  count: number;
};
