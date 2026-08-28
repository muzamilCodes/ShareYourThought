# ThoughtShare Backend API

Modern, production-ready Node.js + Express + MongoDB backend for the ThoughtShare social publishing platform.

## Features
- **JWT Authentication**: Register, login, session validation, logout, and password reset.
- **Thought Stream**: Create, edit, delete, explore, trending algorithm, category filtering, and search.
- **Social Engagement**: Likes, bookmarks/saves, shares, follow/unfollow system.
- **Nested Discussions**: Comments and threaded replies.
- **Real-Time Notifications**: Activity feed for likes, comments, replies, and new followers.
- **Rate Limiting & Security**: Helmet, CORS, mongo-sanitize, and express-rate-limit.

## Setup & Running

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   copy .env.example .env
   ```

3. **Seed Database (Optional)**:
   ```bash
   npm run seed
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```

## Key API Endpoints
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Authenticate
- `GET /api/auth/me` - Get current session
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `GET /api/thoughts` - Paginated thoughts feed
- `GET /api/thoughts/explore/all` - Explore thoughts
- `GET /api/thoughts/trending/top` - Ranked trending thoughts
- `POST /api/thoughts` - Publish a new thought
- `GET /api/thoughts/:id` - Thought detail
- `POST /api/likes/thoughts/:id` - Like / unlike thought
- `POST /api/thoughts/:id/save` - Save / unsave thought
- `GET /api/comments/thoughts/:thoughtId` - Get comments
- `POST /api/comments/thoughts/:thoughtId` - Post comment / reply
- `GET /api/users/:username` - Public user profile
- `POST /api/follows/:userId` - Follow / unfollow user
- `GET /api/notifications` - User notifications
