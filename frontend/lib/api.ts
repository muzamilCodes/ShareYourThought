import type { AuthSession, Category, Comment, Conversation, Message, Notification, Thought, User } from '../types';

function getBaseUrl(): string {
  let url = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api').trim();
  // Strip trailing slashes
  url = url.replace(/\/+$/, '');
  // If base URL doesn't end with /api, append /api
  if (!url.endsWith('/api')) {
    url = `${url}/api`;
  }
  return url;
}

const API_BASE_URL = getBaseUrl();

export type ApiError = { message: string };

type RequestOptions = RequestInit & {
  token?: string;
};

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`);
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const fullUrl = `${API_BASE_URL}${normalizedPath}`;

  const response = await fetch(fullUrl, {
    ...options,
    headers,
    cache: 'no-store'
  });

  const text = await response.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text || `HTTP ${response.status} ${response.statusText}` };
  }

  if (!response.ok) {
    throw new Error(data.message || data.error || `Request failed (${response.status})`);
  }
  return data as T;
}

export function readStoredSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem('thoughtshare-session');
  return raw ? (JSON.parse(raw) as AuthSession) : null;
}

export function saveStoredSession(session: AuthSession) {
  window.localStorage.setItem('thoughtshare-session', JSON.stringify(session));
}

export function clearStoredSession() {
  window.localStorage.removeItem('thoughtshare-session');
}

export const api = {
  health: () => apiFetch<{ ok: boolean; service: string }>('/health'),
  
  // OTP Registration
  sendRegisterOtp: (payload: { name: string; username?: string; email: string; password: string }) =>
    apiFetch<{ message: string; email: string; previewOtp?: string }>('/auth/otp/send-register', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  verifyRegisterOtp: (payload: { email: string; otp: string; name?: string; username?: string; password?: string }) =>
    apiFetch<AuthSession>('/auth/otp/verify-register', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  // OTP Login
  sendLoginOtp: (payload: { identifier: string }) =>
    apiFetch<{ message: string; email: string; previewOtp?: string }>('/auth/otp/send-login', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  verifyLoginOtp: (payload: { identifier: string; otp: string }) =>
    apiFetch<AuthSession>('/auth/otp/verify-login', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  // OTP Forgot Password
  sendForgotPasswordOtp: (payload: { email: string }) =>
    apiFetch<{ message: string; email: string; previewOtp?: string }>('/auth/otp/send-forgot-password', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  verifyResetPasswordOtp: (payload: { email: string; otp: string; newPassword: string }) =>
    apiFetch<AuthSession>('/auth/otp/verify-reset-password', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  // Standard Password Auth
  register: (payload: { name: string; username?: string; email: string; password: string }) =>
    apiFetch<AuthSession>('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload: { identifier: string; password: string }) =>
    apiFetch<AuthSession>('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  logout: (token?: string) => apiFetch<{ message: string }>('/auth/logout', { method: 'POST', token }),
  me: (token: string) => apiFetch<{ user: User }>('/auth/me', { token }),
  forgotPassword: (payload: { email: string }) =>
    apiFetch<{ message: string; previewResetUrl?: string }>('/auth/forgot-password', { method: 'POST', body: JSON.stringify(payload) }),
  resetPassword: (payload: { email: string; token: string; password: string }) =>
    apiFetch<AuthSession>('/auth/reset-password', { method: 'POST', body: JSON.stringify(payload) }),
  getThoughts: (params: Record<string, string | number | undefined> = {}, token?: string) =>
    apiFetch<{ thoughts: Thought[]; total: number }>(
      '/thoughts?' +
        new URLSearchParams(
          Object.entries(params)
            .filter(([, value]) => value !== undefined)
            .map(([key, value]) => [key, String(value)])
        ),
      { token }
    ),
  getThought: (id: string, token?: string) => apiFetch<{ thought: Thought }>(`/thoughts/${id}`, { token }),
  createThought: (payload: { content: string; imageUrl?: string; category: string; hashtags: string; visibility?: string }, token: string) =>
    apiFetch<{ thought: Thought }>('/thoughts', { method: 'POST', token, body: JSON.stringify(payload) }),
  updateThought: (id: string, payload: Partial<{ content: string; imageUrl: string; category: string; hashtags: string; visibility: string }>, token: string) =>
    apiFetch<{ thought: Thought }>(`/thoughts/${id}`, { method: 'PATCH', token, body: JSON.stringify(payload) }),
  deleteThought: (id: string, token: string) => apiFetch<{ message: string }>(`/thoughts/${id}`, { method: 'DELETE', token }),
  likeThought: (id: string, token: string) => apiFetch<{ liked: boolean; likes: number }>(`/likes/thoughts/${id}`, { method: 'POST', token }),
  saveThought: (id: string, token: string) => apiFetch<{ saved: boolean; saves: number }>(`/thoughts/${id}/save`, { method: 'POST', token }),
  shareThought: (id: string, token?: string) => apiFetch<{ shares: number }>(`/thoughts/${id}/share`, { method: 'POST', token }),
  recordView: (id: string) => apiFetch<{ views: number }>(`/thoughts/${id}/view`, { method: 'POST' }),
  searchThoughts: (q: string) => apiFetch<{ thoughts: Thought[] }>(`/thoughts/search?q=${encodeURIComponent(q)}`),
  exploreThoughts: (page = 1, sort = 'trending') => apiFetch<{ thoughts: Thought[]; total: number }>(`/thoughts/explore/all?page=${page}&sort=${sort}`),
  trendingThoughts: () => apiFetch<{ thoughts: Thought[] }>('/thoughts/trending/top'),
  thoughtByCategory: (slug: string) => apiFetch<{ thoughts: Thought[] }>(`/thoughts/category/${slug}`),
  getComments: (thoughtId: string) => apiFetch<{ comments: Comment[] }>(`/comments/thoughts/${thoughtId}`),
  createComment: (thoughtId: string, payload: { content: string; parentComment?: string | null }, token: string) =>
    apiFetch<{ comment: Comment }>(`/comments/thoughts/${thoughtId}`, { method: 'POST', token, body: JSON.stringify(payload) }),
  likeComment: (id: string, token: string) => apiFetch<{ liked: boolean; likes: number }>(`/likes/comments/${id}`, { method: 'POST', token }),
  searchUsers: (q: string) => apiFetch<{ users: User[] }>(`/users/search?q=${encodeURIComponent(q)}`),
  getProfile: (username: string, token?: string) =>
    apiFetch<{ profile: User; thoughts: Thought[]; isFollowing: boolean; isRequested?: boolean; isPrivateLocked?: boolean }>(
      `/users/${username}`,
      { token }
    ),
  getFollowers: (username: string, token?: string) =>
    apiFetch<{ followers: User[]; isPrivateLocked?: boolean }>(`/users/${username}/followers`, { token }),
  getFollowing: (username: string, token?: string) =>
    apiFetch<{ following: User[]; isPrivateLocked?: boolean }>(`/users/${username}/following`, { token }),
  updateMe: (payload: Partial<{ name: string; username: string; bio: string; avatar: string; website: string; location: string; isPrivate: boolean }>, token: string) =>
    apiFetch<{ user: User }>('/users/me', { method: 'PATCH', token, body: JSON.stringify(payload) }),
  savedThoughts: (token: string) => apiFetch<{ thoughts: Thought[] }>('/users/saved/thoughts', { token }),
  followUser: (userId: string, token: string) =>
    apiFetch<{ following: boolean; requested?: boolean; followers: number; followingCount: number }>(
      `/follows/${userId}`,
      { method: 'POST', token }
    ),
  getFollowRequests: (token: string) =>
    apiFetch<{ requests: User[] }>('/follows/requests', { token }),
  acceptFollowRequest: (requesterId: string, token: string) =>
    apiFetch<{ success: boolean; followers: number }>(`/follows/requests/${requesterId}/accept`, {
      method: 'POST',
      token
    }),
  declineFollowRequest: (requesterId: string, token: string) =>
    apiFetch<{ success: boolean }>(`/follows/requests/${requesterId}/decline`, {
      method: 'POST',
      token
    }),
  listNotifications: (token: string) => apiFetch<{ notifications: Notification[]; unreadCount: number }>('/notifications', { token }),
  markAllNotificationsRead: (token: string) => apiFetch<{ message: string }>('/notifications/read-all', { method: 'PATCH', token }),
  listCategories: () => apiFetch<{ categories: Category[] }>('/categories'),
  getStats: () =>
    apiFetch<{
      totalThoughts: number;
      totalUsers: number;
      totalCategories: number;
      totalLikes: number;
      totalComments: number;
      totalViews: number;
    }>('/thoughts/stats/summary'),
  report: (payload: { targetType: 'thought' | 'comment' | 'user'; targetId: string; reason: string; details?: string }, token: string) =>
    apiFetch<{ report: unknown }>('/reports', { method: 'POST', token, body: JSON.stringify(payload) }),
  getConversations: (token: string) =>
    apiFetch<{ conversations: Conversation[] }>('/messages/conversations', { token }),
  getMessages: (userId: string, token: string) =>
    apiFetch<{ partner: User; messages: Message[] }>(`/messages/${userId}`, { token }),
  sendMessage: (userId: string, content: string, token: string) =>
    apiFetch<{ message: Message }>(`/messages/${userId}`, {
      method: 'POST',
      token,
      body: JSON.stringify({ content })
    }),
  getUnreadMessagesCount: (token: string) =>
    apiFetch<{ unreadCount: number }>('/messages/unread-count', { token })
};
