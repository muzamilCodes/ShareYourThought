# ⚙️ ThoughtShare Backend API — Deep Architectural Reference & Guide

A production-grade, highly scalable, and modular **Node.js (ES Modules) + Express 5 + MongoDB (Mongoose 8 ODM)** backend powering the ThoughtShare social media platform.

---

## 📑 Table of Contents
1. [Backend Overview & Architecture](#1-backend-overview--architecture)
2. [Relationship with Frontend](#2-relationship-with-frontend)
3. [Folder & Directory Structure](#3-folder--directory-structure)
4. [Database Schemas & Mongoose Models](#4-database-schemas--mongoose-models)
5. [Complete API Endpoints Reference](#5-complete-api-endpoints-reference)
6. [Multi-Tier Feed Ranking Algorithm](#6-multi-tier-feed-ranking-algorithm)
7. [Email Deliverability Engine (Resend + Brevo + SMTP)](#7-email-deliverability-engine)
8. [Security & Middleware Pipeline](#8-security--middleware-pipeline)
9. [Environment Variables Reference (`.env`)](#9-environment-variables-reference-env)
10. [Local Development & Render Deployment Guide](#10-local-development--render-deployment-guide)

---

## 1. Backend Overview & Architecture

The ThoughtShare backend is designed with a clean separation of concerns:
- **Express 5 Router**: Dispatches HTTP requests with route prefixes (`/api/auth`, `/api/thoughts`, `/api/users`, etc.) and fallback root routes.
- **Async Error Handling**: Wrapped with `asyncHandler` to eliminate try-catch boilerplate and pipe errors to a centralized `errorHandler`.
- **Stateless Authentication**: JWT tokens stored in HttpOnly cookies or passed in `Authorization: Bearer <token>` headers.
- **High-Performance MongoDB Indexing**: Optimized compound indexes for fast sorting on timestamps, views, likes, and hashtags.

```
                    [ Client Browser / PWA Frontend ]
                                  │
                                  ▼ (HTTPS REST API / JSON)
               ┌─────────────────────────────────────┐
               │         Express 5 Middleware        │
               │  - trust proxy (Render / Vercel)    │
               │  - Helmet & CORS Policy             │
               │  - NoSQL Injection Sanitizer        │
               │  - JSON / URLencoded (15MB Limit)   │
               │  - Cookie Parser & Morgan Logger    │
               └──────────────────┬──────────────────┘
                                  │
                 ┌────────────────┼────────────────┐
                 ▼                ▼                ▼
          [ Auth Routes ]  [ Thoughts Routes ] [ User Routes ]
                 │                │                │
                 ▼                ▼                ▼
         [ Controllers ]  [ Controllers ]   [ Controllers ]
                 │                │                │
                 ▼                ▼                ▼
          [ Mongoose ODM Models ] ──▶ [ MongoDB Atlas Database ]
                 │
                 ▼
          [ Email Engine: Resend REST -> Brevo REST -> SMTP ]
```

---

## 2. Relationship with Frontend

The backend exposes a JSON REST API consumed by `frontend/lib/api.ts`.
- **Token Passing**: When a user logs in or verifies an OTP, the backend returns a signed JWT token:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { "_id": "66d...", "username": "burhan", "role": "admin" }
  }
  ```
- **Protected Endpoints**: The frontend attaches `Authorization: Bearer <token>` in headers.
- **Event Synchronization**: When the frontend creates or deletes thoughts or stories, it invokes the corresponding REST endpoints and uses custom browser events (`thought-created`, `story-created`) to re-sync.

---

## 3. Folder & Directory Structure

```bash
backend/
├── src/
│   ├── config/
│   │   ├── db.js                 # MongoDB connection logic with retry handlers
│   │   └── env.js                # Centralized environment variable validator
│   ├── controllers/
│   │   ├── adminController.js    # Metrics, user management, and role promotion
│   │   ├── authController.js     # Register, login, OTP verification, password reset
│   │   ├── categoryController.js # Category listings and top topics
│   │   ├── commentController.js  # Threaded discussions & replies
│   │   ├── followController.js   # Follow, unfollow, private follow requests
│   │   ├── likeController.js     # Thought and comment likes
│   │   ├── messageController.js  # Direct messaging between users
│   │   ├── notificationController.js # Unread badge counts and notification stream
│   │   ├── reportController.js   # Content moderation reports
│   │   ├── thoughtController.js  # Thoughts, 24h stories, trending feed sorting
│   │   └── userController.js     # Profiles, avatar updates, suggestions
│   ├── middleware/
│   │   ├── auth.js               # JWT protector & optionalAuth middleware
│   │   ├── errorHandler.js       # Centralized 500 error handler with stack traces
│   │   └── notFound.js           # 404 route fallback handler
│   ├── models/
│   │   ├── Category.js           # Category names, slugs, accents, thought counts
│   │   ├── Comment.js            # Nested comments schema
│   │   ├── Message.js            # Direct messages schema
│   │   ├── Notification.js       # Activity notifications schema
│   │   ├── OtpToken.js           # 6-digit email OTPs with 10-minute TTL expiry
│   │   ├── Report.js             # Content flags and moderation reports
│   │   ├── Thought.js            # Thoughts & 24h Stories schema
│   │   └── User.js               # User accounts, privacy, roles, follower arrays
│   ├── routes/
│   │   ├── adminRoutes.js
│   │   ├── authRoutes.js
│   │   ├── categoryRoutes.js
│   │   ├── commentRoutes.js
│   │   ├── followRoutes.js
│   │   ├── likeRoutes.js
│   │   ├── messageRoutes.js
│   │   ├── notificationRoutes.js
│   │   ├── reportRoutes.js
│   │   ├── thoughtRoutes.js
│   │   └── userRoutes.js
│   ├── utils/
│   │   ├── asyncHandler.js       # Async wrapper for clean routes
│   │   ├── notifications.js      # Notification dispatcher helper
│   │   ├── otp.js                # Multi-Provider Email OTP Dispatcher
│   │   ├── paginate.js           # Limit and offset pagination helper
│   │   └── seedCategories.js     # Default topic categories seeder
│   ├── app.js                    # Express app initialization, middleware, routes mounting
│   └── server.js                 # Server entry point with port listener
├── package.json
└── README.md
```

---

## 4. Database Schemas & Mongoose Models

### 1. `Thought` Model (`src/models/Thought.js`)
Handles both standard feed thoughts and 24-hour Stories:
```javascript
{
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, trim: true, maxlength: 2000 },
  imageUrl: { type: String, default: '' },
  category: { type: String, default: 'life', lowercase: true, index: true },
  hashtags: [{ type: String, lowercase: true, trim: true }],
  visibility: { type: String, enum: ['public', 'followers'], default: 'public' },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  viewsCount: { type: Number, default: 0, index: true },
  sharesCount: { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
  
  // 24-Hour Story Spark Fields:
  isStory: { type: Boolean, default: false, index: true },
  storyExpiresAt: { type: Date, default: null, index: true },
  gradient: { type: String, default: '' }
}
```

### 2. `User` Model (`src/models/User.js`)
```javascript
{
  name: { type: String, required: true, trim: true },
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  avatar: { type: String, default: '' },
  bio: { type: String, default: '', maxlength: 500 },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isPrivate: { type: Boolean, default: false },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  followRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  savedThoughts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Thought' }]
}
```

### 3. `Comment` Model (`src/models/Comment.js`)
Supports threaded discussions up to multiple hierarchy depths:
```javascript
{
  thought: { type: mongoose.Schema.Types.ObjectId, ref: 'Thought', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, trim: true, maxlength: 1000 },
  parentComment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}
```

### 4. `OtpToken` Model (`src/models/OtpToken.js`)
```javascript
{
  email: { type: String, required: true, lowercase: true },
  code: { type: String, required: true },
  purpose: { type: String, enum: ['registration', 'login', 'password-reset'], required: true },
  expiresAt: { type: Date, required: true, index: { expires: '10m' } }
}
```

---

## 5. Complete API Endpoints Reference

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/send-register-otp` | Sends 6-digit registration OTP to user's email | No |
| `POST` | `/api/auth/verify-register-otp`| Verifies OTP and creates user account with JWT | No |
| `POST` | `/api/auth/send-login-otp` | Sends passwordless login OTP | No |
| `POST` | `/api/auth/verify-login-otp` | Verifies login OTP and returns JWT | No |
| `POST` | `/api/auth/login` | Traditional email + password login | No |
| `GET` | `/api/auth/me` | Fetches current logged-in user profile | Yes (`Bearer Token`) |
| `POST` | `/api/auth/logout` | Clears cookies and session | Optional |

### ✍️ Thoughts & Stories (`/api/thoughts`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/thoughts?sort=trending` | Universal feed sorted by trending / views / newest | Optional |
| `GET` | `/api/thoughts/stories/active` | Active 24-hour stories only (`storyExpiresAt > now`) | Optional |
| `POST` | `/api/thoughts` | Publish thought or 24-hour Story Spark (`isStory: true`) | Yes |
| `GET` | `/api/thoughts/:id` | Get single thought with author details | Optional |
| `PATCH`| `/api/thoughts/:id` | Edit thought content/category/visibility | Yes (Author/Admin) |
| `DELETE`| `/api/thoughts/:id` | Delete thought or story permanently | Yes (Author/Admin) |
| `POST` | `/api/thoughts/:id/view` | Increments thought views count | No |
| `POST` | `/api/thoughts/:id/save` | Bookmark / save thought to collection | Yes |

### 👥 Users & Social Graph (`/api/users` & `/api/follows`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/users/:username` | Public profile with follower counts & privacy checks | Optional |
| `GET` | `/api/users/suggested` | Suggested creator recommendations for you | Optional |
| `PATCH`| `/api/users/me` | Update name, username, bio, avatar, private toggle | Yes |
| `POST` | `/api/follows/:userId` | Follow or unfollow user (handles private requests) | Yes |
| `GET` | `/api/follows/requests` | List pending follow requests for private accounts | Yes |
| `POST` | `/api/follows/requests/:id/accept` | Accept pending follow request | Yes |

### 🛡️ Admin Command Center (`/api/admin`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/admin/stats` | Complete platform analytics, metrics & timeline | Admin Only |
| `GET` | `/api/admin/users` | Paginated user management table with role filters | Admin Only |
| `PATCH`| `/api/admin/users/:id/role`| Promote user to admin or demote to user | Admin Only |
| `DELETE`| `/api/admin/users/:id` | Delete user account and cascade clean thoughts | Admin Only |

---

## 6. Multi-Tier Feed Ranking Algorithm

Feed queries execute multi-tier ranking in `src/controllers/thoughtController.js`:

1. **Tier 3 (Author's Own Posts)**:
   - When a creator publishes a new post, it is scored with **Tier 3** and immediately ranks **#1 at the top of their own feed**.
2. **Tier 2 (Followed Creators)**:
   - Followed authors receive **Tier 2** priority, ensuring their fresh posts appear at the top for all their followers.
3. **Tier 1 (General Discovery)**:
   - Discovery thoughts are ranked with the time-decay gravity formula:
     $$\text{Score} = \frac{(\text{Likes} \times 5) + (\text{Comments} \times 4) + (\text{Saves} \times 4) + (\text{Views} \times 1)}{(\text{Age in Hours} + 2)^{1.3}}$$
4. **Dynamic Refresh Rotation**:
   - Rotates discovery thoughts on page refresh to ensure diverse content discovery rather than a frozen static list.

---

## 7. Email Deliverability Engine

Located in `src/utils/otp.js`, the email subsystem delivers 6-digit verification codes using a 3-stage fallback strategy:

1. **Stage 1 (Resend REST API)**: HTTPS Port 443 calls directly to `https://api.resend.com/emails` (bypasses ISP SMTP port blocking).
2. **Stage 2 (Brevo REST API)**: HTTPS calls to `https://api.brevo.com/v3/smtp/email`.
3. **Stage 3 (Nodemailer SMTP Pool)**: Connects to Gmail / Hostinger with automated connection pooling.

---

## 8. Security & Middleware Pipeline

- **`app.set('trust proxy', 1)`**: Configured so reverse proxies on Render and Vercel pass the real client IP via `X-Forwarded-For`.
- **NoSQL Injection Sanitizer**: Recursively strips `$` and `.` prefixes from `req.body` and `req.params`.
- **Flexible CORS**: Supports origin reflections across custom domains, localhost, and cloud hosts.
- **Helmet**: Secures HTTP response headers.

---

## 9. Environment Variables Reference (`.env`)

Create a `.env` file inside `backend/`:
```env
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/thoughtshare?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=30d
CLIENT_URL=https://share-your-thought-eight.vercel.app

# Email Provider Configuration (Any 1 or more)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
BREVO_API_KEY=xkeysib-xxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=ThoughtShare <onboarding@resend.dev>

# Optional SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

---

## 10. Local Development & Render Deployment Guide

### Local Development:
```bash
# 1. Install dependencies
cd backend
npm install

# 2. Start development server with nodemon
npm run dev
```

### Render Production Deployment:
1. Create a **Web Service** on [Render.com](https://render.com).
2. Set Root Directory to `backend`.
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Add all Environment Variables under the **Environment** tab.
