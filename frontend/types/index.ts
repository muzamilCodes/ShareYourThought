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
  featured?: boolean;
  createdAt: string;
  updatedAt?: string;
  author: User;
};

export type Comment = {
  _id: string;
  content: string;
  author: User;
  thought: string;
  parentComment?: string | null;
  replies?: Comment[];
  likes?: Array<string | User>;
  createdAt: string;
};

export type Notification = {
  _id: string;
  type: 'follow' | 'like' | 'comment' | 'reply' | 'system';
  title: string;
  body: string;
  read: boolean;
  actor: User;
  thought?: Thought | null;
  comment?: Comment | null;
  createdAt: string;
};

export type Category = {
  _id: string;
  name: string;
  slug: string;
  description: string;
  accent: string;
  thoughtCount: number;
};

export type User = {
  _id?: string;
  id?: string;
  name: string;
  username: string;
  email?: string;
  bio: string;
  avatar: string;
  website?: string;
  location?: string;
  followers?: number | Array<string | User>;
  following?: number | Array<string | User>;
  savedThoughts?: number | Array<string | Thought>;
  role?: string;
  createdAt?: string;
};

export type AuthSession = {
  token: string;
  user: User;
};
