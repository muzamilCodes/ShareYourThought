# 🎨 ThoughtShare Frontend — Complete Architecture & Component Guide

A state-of-the-art, mobile-first **Next.js 15 (App Router) + React 19 + TypeScript** Progressive Web Application (PWA) with Instagram-style stories, responsive feeds, and real-time social interactions.

---

## 📑 Table of Contents
1. [Frontend Overview & Tech Stack](#1-frontend-overview--tech-stack)
2. [Relationship with Backend (`lib/api.ts`)](#2-relationship-with-backend-libapits)
3. [Folder & Directory Structure](#3-folder--directory-structure)
4. [Core Components Breakdown](#4-core-components-breakdown)
5. [Story Sparks System (24-Hour Expiry & Creation)](#5-story-sparks-system)
6. [State Management & Event Bus](#6-state-management--event-bus)
7. [Progressive Web App (PWA) Architecture](#7-progressive-web-app-pwa-architecture)
8. [Design System & CSS Tokens](#8-design-system--css-tokens)
9. [Environment Variables (`.env.local`)](#9-environment-variables-envlocal)
10. [Local Development & Vercel Deployment Guide](#10-local-development--vercel-deployment-guide)

---

## 1. Frontend Overview & Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Server Components & Client Hydration)
- **UI Engine**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Styling**: Vanilla CSS Design Tokens with Dark Mode support (`[data-theme='dark']`)
- **PWA Capabilities**: Service Worker (`public/sw.js`), Web Manifest (`public/manifest.json`), Offline Fallback (`app/offline/page.tsx`), Add-to-Homescreen banner
- **Audio & Visual**: Web Audio synthesized haptic sounds (`lib/soundUtils.ts`), HTML5 Canvas Image Compressor (`lib/imageUtils.ts`)

---

## 2. Relationship with Backend (`lib/api.ts`)

The frontend interacts with the Express backend strictly through `lib/api.ts`:

```typescript
// lib/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (options.token) headers['Authorization'] = `Bearer ${options.token}`;
  
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: options.method || 'GET',
    headers,
    body: options.body,
    credentials: 'omit'
  });
  // Handles JSON parsing and unified error messaging
}
```

- **Session Handling**: `useSession` hook checks `localStorage.getItem('token')` and validates against `GET /api/auth/me`.
- **Cross-Component Events**: Custom browser events (`thought-created`, `story-created`, `follow-status-updated`) allow instant feed and tray updates without page refreshes.

---

## 3. Folder & Directory Structure

```bash
frontend/
├── app/
│   ├── admin/page.tsx            # Admin Command Center (Analytics, Moderation, User Roles)
│   ├── bookmarks/page.tsx        # Saved thoughts collection
│   ├── category/[slug]/page.tsx  # Topic-specific thought stream
│   ├── create/page.tsx           # Full thought & story creation page
│   ├── explore/page.tsx          # Algorithmic discovery & category tabs
│   ├── forgot-password/page.tsx  # OTP-based password reset
│   ├── login/page.tsx            # Passwordless & traditional login form
│   ├── messages/page.tsx         # Direct messaging conversations
│   ├── notifications/page.tsx    # Notification inbox
│   ├── offline/page.tsx          # PWA offline fallback screen
│   ├── profile/[username]/page.tsx # Creator profile with thoughts, followers & privacy lock
│   ├── register/page.tsx         # Email OTP registration form
│   ├── search/page.tsx           # Search thoughts and creators
│   ├── settings/page.tsx         # Profile settings, bio, privacy toggle
│   ├── stats/page.tsx            # Platform metrics & rankings
│   ├── thought/[id]/page.tsx     # Single thought detail with comment tree
│   ├── layout.tsx                # Root layout with Navbar, BottomNav, PwaManager
│   ├── page.tsx                  # Home Feed (Stories, Quick Bar, Feed Stream, Suggested Creators)
│   └── globals.css               # Global CSS design system & component styles
├── components/
│   ├── AuthForm.tsx              # Email OTP verification form
│   ├── BottomNav.tsx             # Mobile sticky bottom navigation with badges
│   ├── CreateThought.tsx         # Post creation card with 24h story spark toggle
│   ├── InstagramRightRail.tsx    # Desktop sidebar with user profile & suggested creators
│   ├── MobileSuggestedUsers.tsx  # In-feed suggested creator cards with dismiss button
│   ├── Navbar.tsx                # Desktop and mobile responsive top navigation
│   ├── PwaManager.tsx            # PWA installation banner and service worker registration
│   ├── RealtimeNotifications.tsx # Smart notification toast listener
│   ├── StoryCreatorModal.tsx     # 24-hour story creator modal with photo upload
│   ├── StoryTray.tsx             # Top horizontal story avatar rings
│   ├── StoryViewer.tsx           # Interactive full-screen story player with delete modal
│   └── ThoughtCard.tsx           # Double-tap like, photo lightbox, and social actions
├── hooks/
│   └── useSession.ts             # Global authentication session hook
├── lib/
│   ├── api.ts                    # Backend API client SDK
│   ├── imageUtils.ts             # Client-side canvas photo compression
│   └── soundUtils.ts             # Synthesized UI sounds
├── public/
│   ├── manifest.json             # Web App Manifest for mobile installation
│   ├── sw.js                     # Service Worker for asset caching
│   └── icons/                    # App icons (192x192, 512x512)
├── package.json
└── README.md
```

---

## 4. Core Components Breakdown

### 1. `StoryTray.tsx` & `StoryViewer.tsx`
- **Story Tray**: Fetches active 24-hour stories from `GET /api/thoughts/stories/active`. Renders user's own story avatar with a `+` badge and other creators with active glowing rings.
- **Story Viewer**: Fullscreen modal with auto-advancing progress bars (5 seconds per story), photo backdrop blur, caption overlays, double-tap likes, inline replies, and a **dedicated in-story delete confirmation modal**.

### 2. `CreateThought.tsx` & `StoryCreatorModal.tsx`
- **Create Thought**: Offers topic selection, auto-tag suggestions, photo attachments, and a **`✨ Share as 24-Hour Story Spark`** checkbox toggle.
- **Story Creator Modal**: Instant camera / gallery upload, live story card preview, and vibrant background gradient selectors (`Sunset Ember`, `Twilight`, `Ocean Wave`, `Emerald Forest`, `Velvet Dark`).

### 3. `ThoughtCard.tsx`
- Interactive post card with double-tap heart burst animation, photo lightbox, author badges, likes counter, comment drawer, bookmark toggle, and copy-link share button.

### 4. `MobileSuggestedUsers.tsx`
- Compact, in-feed creator recommendations placed seamlessly after the 2nd post in the feed stream.
- Automatically filters out users you already follow and provides a clean `✕` dismiss button.

### 5. `AdminPanel` (`app/admin/page.tsx`)
- Reserved for platform administrators (`session?.user?.role === 'admin'`).
- Live metrics: Total Users, Total Thoughts, Total Views, Likes, Shares, Categories.
- Interactive User Management table: Search users, filter by role, promote to Admin, demote to User, or permanently delete accounts.

---

## 5. Story Sparks System

Stories are distinct from standard thoughts:
1. **24-Hour Expiration**: Only stories created within the last 24 hours (`storyExpiresAt > now`) are shown.
2. **Feed Segregation**: Stories are marked `isStory: true` and are excluded from regular feed queries (`{ isStory: { $ne: true } }`), ensuring feeds remain uncluttered.
3. **In-Story Delete**: Creators and admins can delete stories with 1 tap using the custom in-story confirmation dialog.

---

## 6. State Management & Event Bus

The frontend uses custom DOM events for instant, cross-component reactivity without full page reloads:
- `thought-created`: Dispatched when a thought is published; triggers feed refresh and boosts new post to #1.
- `story-created`: Dispatched when a story is published or deleted; triggers `StoryTray` to re-fetch active stories.
- `follow-status-updated`: Dispatched on follow/unfollow; re-ranks feed with follow priority.
- `unread-count-updated`: Dispatched on notification check; updates badge numbers on `Navbar` and `BottomNav`.

---

## 7. Progressive Web App (PWA) Architecture

- **Manifest (`public/manifest.json`)**: Configures display mode `standalone`, theme color `#c86d34`, background `#0e0e11`, and mobile icons.
- **Service Worker (`public/sw.js`)**: Caches static assets, fonts, and stylesheets for offline speed.
- **Offline Page (`app/offline/page.tsx`)**: Displays an offline retry interface if the user loses connectivity.

---

## 8. Design System & CSS Tokens

The design system is defined in `app/globals.css`:
```css
:root {
  --sand: #fbf9f5;
  --paper: #ffffff;
  --dark-soft: #f4efe6;
  --ink: #141411;
  --muted: #6b6960;
  --line: #e6dfd5;
  --ember: #c86d34;
  --ember-dark: #a8531e;
  --gold: #f59e0b;
}

[data-theme='dark'] {
  --sand: #0c0d0e;
  --paper: #141618;
  --dark-soft: #1c1f22;
  --ink: #f3f4f6;
  --muted: #9ca3af;
  --line: #2d3339;
}
```

---

## 9. Environment Variables (`.env.local`)

Create a `.env.local` file inside `frontend/`:
```env
NEXT_PUBLIC_API_URL=https://shareyourthought-1.onrender.com/api
NEXT_PUBLIC_APP_URL=https://share-your-thought-eight.vercel.app
```

For local development against local backend:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 10. Local Development & Vercel Deployment Guide

### Local Development:
```bash
# 1. Install dependencies
cd frontend
npm install

# 2. Start Next.js development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Vercel Production Deployment:
1. Import your GitHub repository to [Vercel](https://vercel.com).
2. Set Root Directory to `frontend`.
3. Add `NEXT_PUBLIC_API_URL` under **Environment Variables** pointing to your Render backend API.
4. Click **Deploy**.
