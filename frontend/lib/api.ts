import type {
  AuthSession,
  Category,
  Comment,
  Conversation,
  CreateThoughtInput,
  CreatorAnalytics,
  Draft,
  HashtagSummary,
  Message,
  Notification,
  Report,
  Thought,
  User
} from '../types';

function getBaseUrl(): string {
  let url = (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api').trim();
  url = url.replace(/\/+$/, '');
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

export const TOKEN_STORAGE_KEY = 'thoughtshare_token';
export const SESSION_STORAGE_KEY = 'thoughtshare_session';

export function readStoredSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveStoredSession(session: AuthSession | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (session) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      if (session.token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, session.token);
      }
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {}
}

export function clearStoredSession(): void {
  saveStoredSession(null);
}

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

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message = (typeof data === 'object' && data?.message) ? data.message : 'An error occurred';
    throw new Error(message);
  }

  return data as T;
}

export const api = {
  // System Health
  health: () => apiFetch<{ status: string; timestamp?: string }>('/health'),

  // Current user me
  me: (token: string) => apiFetch<{ user: User }>('/users/me', { token }),

  deleteAccount: (token: string) =>
    apiFetch<{ message: string }>('/users/me', { method: 'DELETE', token }),

  // Auth & OTP endpoints
  sendRegisterOtp: (payload: { name: string; email: string; password?: string }) =>
    apiFetch<{ success: boolean; message: string; email?: string }>('/auth/register/send-otp', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  verifyRegisterOtp: (payload: { email: string; code?: string; otp?: string; name?: string; password?: string }) =>
    apiFetch<AuthSession>('/auth/register/verify-otp', {
      method: 'POST',
      body: JSON.stringify({
        email: payload.email,
        identifier: payload.email,
        code: payload.code || payload.otp,
        otp: payload.otp || payload.code,
        name: payload.name,
        password: payload.password
      })
    }),

  sendLoginOtp: (payload: { email?: string; identifier?: string }) =>
    apiFetch<{ success: boolean; message: string; email?: string }>('/auth/login/send-otp', {
      method: 'POST',
      body: JSON.stringify({
        email: payload.email || payload.identifier,
        identifier: payload.identifier || payload.email
      })
    }),

  verifyLoginOtp: (payload: { email?: string; identifier?: string; code?: string; otp?: string }) =>
    apiFetch<AuthSession>('/auth/login/verify-otp', {
      method: 'POST',
      body: JSON.stringify({
        email: payload.email || payload.identifier,
        identifier: payload.identifier || payload.email,
        code: payload.code || payload.otp,
        otp: payload.otp || payload.code
      })
    }),

  login: (payload: { email?: string; identifier?: string; username?: string; password?: string }) =>
    apiFetch<AuthSession>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: payload.email || payload.identifier || payload.username,
        identifier: payload.identifier || payload.email || payload.username,
        username: payload.username || payload.identifier || payload.email,
        password: payload.password
      })
    }),

  logout: (token?: string) =>
    apiFetch<{ message: string }>('/auth/logout', {
      method: 'POST',
      token
    }),

  sendForgotPasswordOtp: (payload: { email: string }) =>
    apiFetch<{ success: boolean; message: string; email?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({
        email: payload.email,
        identifier: payload.email
      })
    }),

  forgotPassword: (payload: { email: string }) =>
    apiFetch<{ success: boolean; message: string; email?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({
        email: payload.email,
        identifier: payload.email
      })
    }),

  verifyResetPasswordOtp: (payload: { email: string; code?: string; otp?: string; newPassword?: string; password?: string }) =>
    apiFetch<AuthSession>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        email: payload.email,
        identifier: payload.email,
        code: payload.code || payload.otp,
        otp: payload.otp || payload.code,
        newPassword: payload.newPassword || payload.password,
        password: payload.password || payload.newPassword
      })
    }),

  resetPasswordWithCode: (payload: { email: string; code: string; newPassword: string }) =>
    apiFetch<{ success: boolean; message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  resetPassword: (payload: { email: string; token?: string; code?: string; password?: string; newPassword?: string }) =>
    apiFetch<AuthSession>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        email: payload.email,
        code: payload.token || payload.code,
        newPassword: payload.password || payload.newPassword
      })
    }),

  updateProfile: (payload: Partial<User>, token: string) =>
    apiFetch<{ message: string; user: User }>('/users/profile', {
      method: 'PATCH',
      token,
      body: JSON.stringify(payload)
    }),

  updateMe: (payload: Partial<User>, token: string) =>
    apiFetch<{ message: string; user: User }>('/users/profile', {
      method: 'PATCH',
      token,
      body: JSON.stringify(payload)
    }),

  // Thoughts & Feed
  getThoughts: (sort: string = 'trending', page: number = 1, limit: number = 20, token?: string) =>
    apiFetch<{ thoughts: Thought[]; total: number; totalPages: number }>(
      `/thoughts?sort=${encodeURIComponent(sort)}&page=${page}&limit=${limit}`,
      { token }
    ),

  trendingThoughts: () =>
    apiFetch<{ thoughts: Thought[] }>('/thoughts?sort=trending'),

  getDailyThought: () => apiFetch<{ thought: Thought }>('/thoughts/featured/daily'),

  getStories: (token?: string) =>
    apiFetch<{ stories: Thought[]; groups?: any[] }>('/thoughts/stories/active', { token }),

  createThought: (payload: CreateThoughtInput | Partial<Thought> | Record<string, any>, token: string) =>
    apiFetch<{ message: string; thought: Thought }>('/thoughts', {
      method: 'POST',
      token,
      body: JSON.stringify(payload)
    }),

  getThought: (id: string, token?: string) =>
    apiFetch<{ thought: Thought }>(`/thoughts/${id}`, { token }),

  updateThought: (id: string, payload: Partial<Thought> | Record<string, any>, token: string) =>
    apiFetch<{ message: string; thought: Thought }>(`/thoughts/${id}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify(payload)
    }),

  deleteThought: (id: string, token: string) =>
    apiFetch<{ message: string }>(`/thoughts/${id}`, {
      method: 'DELETE',
      token
    }),

  likeThought: (id: string, token: string) =>
    apiFetch<{ liked: boolean; likes: number }>(`/thoughts/${id}/like`, {
      method: 'POST',
      token
    }),

  saveThought: (id: string, token: string) =>
    apiFetch<{ saved: boolean; saves: number }>(`/thoughts/${id}/save`, {
      method: 'POST',
      token
    }),

  shareThought: (id: string, token: string) =>
    apiFetch<{ shares: number }>(`/thoughts/${id}/share`, {
      method: 'POST',
      token
    }),

  recordView: (id: string) =>
    apiFetch<{ views: number }>(`/thoughts/${id}/view`, {
      method: 'POST'
    }),

  // Comments
  listComments: (thoughtId: string) =>
    apiFetch<{ comments: Comment[] }>(`/thoughts/${thoughtId}/comments`),

  getComments: (thoughtId: string) =>
    apiFetch<{ comments: Comment[] }>(`/thoughts/${thoughtId}/comments`),

  createComment: (thoughtId: string, payload: { content: string; parentCommentId?: string; parentComment?: string }, token: string) =>
    apiFetch<{ message: string; comment: Comment }>(`/thoughts/${thoughtId}/comments`, {
      method: 'POST',
      token,
      body: JSON.stringify({
        content: payload.content,
        parentCommentId: payload.parentCommentId || payload.parentComment
      })
    }),

  deleteComment: (thoughtId: string, commentId: string, token: string) =>
    apiFetch<{ message: string }>(`/thoughts/${thoughtId}/comments/${commentId}`, {
      method: 'DELETE',
      token
    }),

  likeComment: (thoughtId: string, commentId: string, token: string) =>
    apiFetch<{ liked: boolean; likes: number }>(`/thoughts/${thoughtId}/comments/${commentId}/like`, {
      method: 'POST',
      token
    }),

  // AI Assistant
  aiAssist: (payload: { mode: string; text?: string; prompt?: string }, token?: string) =>
    apiFetch<{ result: string; mode: string }>('/ai/assist', {
      method: 'POST',
      token,
      body: JSON.stringify(payload)
    }),

  assistWithAi: (payload: { mode: string; text?: string; prompt?: string }, token?: string) =>
    apiFetch<{ result: string; mode: string }>('/ai/assist', {
      method: 'POST',
      token,
      body: JSON.stringify(payload)
    }),

  // Drafts
  getDrafts: (token: string) =>
    apiFetch<{ drafts: Draft[] }>('/drafts', { token }),

  createDraft: (payload: Partial<Draft>, token: string) =>
    apiFetch<{ message: string; draft: Draft }>('/drafts', {
      method: 'POST',
      token,
      body: JSON.stringify(payload)
    }),

  updateDraft: (id: string, payload: Partial<Draft>, token: string) =>
    apiFetch<{ message: string; draft: Draft }>(`/drafts/${id}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify(payload)
    }),

  deleteDraft: (id: string, token: string) =>
    apiFetch<{ message: string }>(`/drafts/${id}`, {
      method: 'DELETE',
      token
    }),

  // Creator Analytics
  getCreatorAnalytics: (token: string) =>
    apiFetch<CreatorAnalytics>('/analytics/me', { token }),

  // Search & Hashtags
  universalSearch: (q: string) =>
    apiFetch<{ thoughts: Thought[]; users: User[]; hashtags: string[]; categories: Category[] }>(
      `/search/search/all?q=${encodeURIComponent(q)}`
    ),

  getTrendingHashtags: () =>
    apiFetch<{ hashtags: HashtagSummary[] }>('/hashtags/trending'),

  getHashtagThoughts: (tag: string, sort = 'trending') =>
    apiFetch<{ thoughts: Thought[]; tag: string; count: number }>(
      `/hashtags/${encodeURIComponent(tag)}?sort=${sort}`
    ),

  searchThoughts: (query: string) =>
    apiFetch<{ thoughts: Thought[] }>(`/thoughts?search=${encodeURIComponent(query)}`),

  searchUsers: (query: string) =>
    apiFetch<{ users: User[] }>(`/users/search?q=${encodeURIComponent(query)}`),

  // Categories
  listCategories: () =>
    apiFetch<{ categories: Category[] }>('/categories'),

  // Social & Users
  getProfile: (username: string, token?: string) =>
    apiFetch<{ profile: User; thoughts: Thought[]; isFollowing?: boolean; isRequested?: boolean; isPrivateLocked?: boolean }>(
      `/users/${username}`,
      { token }
    ),

  getFollowers: (username: string, token?: string) =>
    apiFetch<{ followers: User[] }>(`/users/${username}/followers`, { token }),

  getFollowing: (username: string, token?: string) =>
    apiFetch<{ following: User[] }>(`/users/${username}/following`, { token }),

  followUser: (userIdOrUsername: string, token: string) =>
    apiFetch<{ following: boolean; requested?: boolean; followers: number; followingCount?: number; message?: string }>(
      `/users/${encodeURIComponent(userIdOrUsername)}/follow`,
      {
        method: 'POST',
        token
      }
    ),

  getFollowRequests: (token: string) =>
    apiFetch<{ requests: User[] }>('/users/follow-requests', { token }),

  acceptFollowRequest: (requesterId: string, token: string) =>
    apiFetch<{ message: string }>(`/users/follow-requests/${requesterId}/accept`, {
      method: 'POST',
      token
    }),

  declineFollowRequest: (requesterId: string, token: string) =>
    apiFetch<{ message: string }>(`/users/follow-requests/${requesterId}/decline`, {
      method: 'POST',
      token
    }),

  getSuggestedUsers: (token?: string) =>
    apiFetch<{ users: (User & { isFollowing?: boolean })[] }>('/users/suggested', { token }),

  savedThoughts: (token: string) =>
    apiFetch<{ thoughts: Thought[] }>('/users/me/saved', { token }),

  // Messaging
  getConversations: (token: string) =>
    apiFetch<{ conversations: Conversation[] }>('/messages/conversations', { token }),

  getMessages: (partnerIdOrUsername: string, token: string) =>
    apiFetch<{ messages: Message[]; partner: User }>(`/messages/${partnerIdOrUsername}`, { token }),

  sendMessage: (recipientId: string, content: string, token: string) =>
    apiFetch<{ message: Message }>('/messages', {
      method: 'POST',
      token,
      body: JSON.stringify({ recipientId, content })
    }),

  deleteMessage: (messageId: string, token: string) =>
    apiFetch<{ message: string }>(`/messages/${messageId}`, {
      method: 'DELETE',
      token
    }),

  getUnreadMessagesCount: (token: string) =>
    apiFetch<{ unreadCount: number }>('/messages/unread-count', { token }),

  // Notifications
  listNotifications: (token: string) =>
    apiFetch<{ notifications: Notification[]; unreadCount: number }>('/notifications', { token }),

  markAllNotificationsRead: (token: string) =>
    apiFetch<{ message: string }>('/notifications/read-all', {
      method: 'POST',
      token
    }),

  markNotificationRead: (id: string, token: string) =>
    apiFetch<{ message: string }>(`/notifications/${id}/read`, {
      method: 'PATCH',
      token
    }),

  deleteNotification: (id: string, token: string) =>
    apiFetch<{ message: string }>(`/notifications/${id}`, {
      method: 'DELETE',
      token
    }),

  // Reports & Moderation
  createReport: (payload: { targetType: 'thought' | 'comment' | 'user'; targetId: string; reason: string; details?: string }, token: string) =>
    apiFetch<{ message: string; report: Report }>('/reports', {
      method: 'POST',
      token,
      body: JSON.stringify(payload)
    }),

  report: (payload: { targetType: 'thought' | 'comment' | 'user'; targetId: string; reason: string; details?: string }, token: string) =>
    apiFetch<{ message: string; report: Report }>('/reports', {
      method: 'POST',
      token,
      body: JSON.stringify(payload)
    }),

  getAdminReports: (status?: string, token?: string) => {
    const qs = status ? `?status=${encodeURIComponent(status)}` : '';
    return apiFetch<{ reports: Report[] }>(`/reports/admin${qs}`, { token });
  },

  listAdminReports: (status?: string, token?: string) => {
    const qs = status ? `?status=${encodeURIComponent(status)}` : '';
    return apiFetch<{ reports: Report[] }>(`/reports/admin${qs}`, { token });
  },

  updateReportStatus: (reportId: string, status: string, reviewNotes?: string, token?: string) =>
    apiFetch<{ message: string; report: Report }>(`/reports/admin/${reportId}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify({ status, reviewNotes })
    }),

  // Admin
  getAdminStats: (token: string) =>
    apiFetch<any>('/admin/stats', { token }),

  listAdminUsers: (params: { page?: number; limit?: number; search?: string; role?: string }, token: string) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    if (params.search) qs.set('search', params.search);
    if (params.role) qs.set('role', params.role);
    const qStr = qs.toString();
    return apiFetch<{
      items: User[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/admin/users${qStr ? `?${qStr}` : ''}`, { token });
  },

  updateAdminUserRole: (userId: string, role: 'user' | 'admin', token: string) =>
    apiFetch<{ message: string; user: Partial<User> }>(`/admin/users/${userId}/role`, {
      method: 'PATCH',
      token,
      body: JSON.stringify({ role })
    }),

  deleteAdminUser: (userId: string, token: string) =>
    apiFetch<{ message: string }>(`/admin/users/${userId}`, { method: 'DELETE', token }),

  listAdminThoughts: (
    params: { page?: number; limit?: number; search?: string; category?: string; featured?: boolean | string },
    token: string
  ) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    if (params.search) qs.set('search', params.search);
    if (params.category) qs.set('category', params.category);
    if (params.featured !== undefined && params.featured !== '') qs.set('featured', String(params.featured));
    const qStr = qs.toString();
    return apiFetch<{
      items: Thought[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/admin/thoughts${qStr ? `?${qStr}` : ''}`, { token });
  },

  toggleAdminFeatureThought: (thoughtId: string, token: string) =>
    apiFetch<{ message: string; thought: Thought }>(`/admin/thoughts/${thoughtId}/feature`, {
      method: 'PATCH',
      token
    }),

  deleteAdminThought: (thoughtId: string, token: string) =>
    apiFetch<{ message: string }>(`/admin/thoughts/${thoughtId}`, { method: 'DELETE', token }),

  createAdminCategory: (payload: { name: string; description?: string; accent?: string }, token: string) =>
    apiFetch<{ message: string; category: Category }>('/admin/categories', {
      method: 'POST',
      token,
      body: JSON.stringify(payload)
    }),

  deleteAdminCategory: (categoryId: string, token: string) =>
    apiFetch<{ message: string }>(`/admin/categories/${categoryId}`, { method: 'DELETE', token }),

  exploreThoughts: (page = 1, sort = 'trending') =>
    apiFetch<{ thoughts: Thought[]; total: number }>(`/thoughts?sort=${sort}&page=${page}`)
};
