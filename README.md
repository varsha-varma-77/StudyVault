# 📚 StudyVault

A full-stack academic resource sharing platform built for college students — upload notes, PYQs, and study materials, discover what others have shared, and bookmark resources for later.

---

## ✨ Features

- 🔐 **Authentication** — Signup / Login with JWT sessions
- 📤 **Upload Resources** — Share PDFs, DOCX, PPTX, ZIP files with metadata
- 🔍 **Browse & Filter** — Search by title, course code, department, or file format
- 🗃️ **My Vault** — Bookmarked resources saved to your profile
- 📁 **My Uploads** — Manage everything you've uploaded, with delete confirmation
- 📊 **Stats** — Download counts tracked per resource
- 🌙 **Modern UI** — Glassmorphism header, dark footer, smooth animations

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, Vanilla JS |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas (Mongoose) |
| Auth | JWT + bcryptjs |
| File Uploads | Multer |
| Dev Server | Vite (with API proxy) |
| Process Manager | Nodemon + Concurrently |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- A free [MongoDB Atlas](https://cloud.mongodb.com) cluster

### 1.  Install

```bash
cd studyvault
npm install
```

### 2. Configure Environment

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/studyvault
JWT_SECRET=your_long_random_secret_key
PORT=5000
```

> **MongoDB Atlas setup:** Create a free M0 cluster → add your IP to Network Access → copy the connection string.

### 3. Run

```bash
npm run dev
```

This starts both servers together:

| Server | URL |
|---|---|
| Frontend (Vite) | http://localhost:3000 |
| Backend (Express) | http://localhost:5000 |

The backend will auto-seed 8 demo resources on first run.

---

## 📁 Project Structure

```
studyvault/
├── index.html          # Homepage
├── resources.html      # Browse resources
├── upload.html         # Upload a resource
├── profile.html        # User profile & vault
├── auth.html           # Login / Signup
├── css/
│   └── styles.css      # All styles
├── js/
│   ├── api.js          # REST API client (JWT-aware)
│   ├── main.js         # Shared UI (modals, toasts, nav)
│   ├── home.js         # Homepage logic
│   ├── resources.js    # Browse page logic
│   ├── upload.js       # Upload form logic
│   ├── profile.js      # Profile & vault logic
│   └── auth.js         # Auth forms logic
├── server/
│   ├── server.js       # Express entry point
│   ├── config/
│   │   └── db.js       # MongoDB connection + seed
│   ├── models/
│   │   ├── User.js     # User schema
│   │   └── Resource.js # Resource schema
│   ├── routes/
│   │   ├── auth.js     # /api/auth/*
│   │   ├── resources.js# /api/resources/*
│   │   └── bookmarks.js# /api/bookmarks/*
│   └── middleware/
│       ├── authMiddleware.js  # JWT protect / optionalAuth
│       └── upload.js          # Multer file handler
├── uploads/            # Uploaded files (gitignored)
├── .env                # Secrets (not committed)
├── .env.example        # Safe env template
└── vite.config.js      # Vite + API proxy config
```

---

## 🔌 API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/signup` | — | Register a new user |
| `POST` | `/api/auth/login` | — | Login, returns JWT |
| `GET` | `/api/auth/me` | ✅ | Get current user |
| `GET` | `/api/resources` | — | List/filter resources |
| `POST` | `/api/resources` | ✅ | Upload a new resource |
| `GET` | `/api/resources/:id` | — | Get single resource |
| `DELETE` | `/api/resources/:id` | ✅ | Delete own resource |
| `POST` | `/api/resources/:id/download` | — | Increment download count |
| `GET` | `/api/resources/user/uploads` | ✅ | Get user's uploads |
| `GET` | `/api/bookmarks` | ✅ | Get bookmark IDs |
| `POST` | `/api/bookmarks/:id` | ✅ | Toggle bookmark |
| `GET` | `/api/bookmarks/resources` | ✅ | Get bookmarked resources |

---

## 📜 Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start both frontend and backend together |
| `npm run client` | Start Vite frontend only |
| `npm run server` | Start Express backend only (with nodemon) |
| `npm run build` | Build frontend for production |

---
