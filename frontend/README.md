# ThoughtShare Frontend

A Next.js frontend with editorial styling for ThoughtShare.

## Features
- **Editorial UI**: Halden-inspired typography, calm color palettes, and responsive layouts.
- **Client Session Management**: JWT token storage, reactive session updates, and hydration-safe rendering.
- **Thought Interactions**: Live liking, bookmarks/saves, copy-link shares, category filtering, and searches.
- **Profile & Social Feed**: User profile view, followers/following counters, follow/unfollow toggle, and author thoughts stream.
- **Discussions**: Threaded comment sections and replies.
- **Notification Inbox**: Activity stream for likes, comments, replies, and new followers.
- **Settings & Password Reset**: Profile details editing and token-based password reset.

## Run Locally

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   Copy `.env.local.example` to `.env.local`:
   ```bash
   copy .env.local.example .env.local
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) in your browser.
