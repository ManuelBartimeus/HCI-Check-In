# Church Attendance & Leaderboard Web App

A production-quality church attendance tracking and leaderboard system built with **React + Vite** (frontend) and **Flask + SQLAlchemy** (backend).

## ✨ Features

- **Member Check-In** — Real-time name search with autocomplete, smart meeting detection by day/time
- **Leaderboard** — Animated post-check-in leaderboard with blur effect and percentage-ahead calculation
- **Admin Dashboard** — 10+ stat widgets, recent activity, and mini trend chart
- **Members** — CRUD, profile pages, streak tracking, points history charts
- **Meetings** — Recurring + one-time meetings, day selector, enable/archive/delete
- **Attendance** — Filterable table, CSV/Excel export, undo attendance
- **Analytics** — 5 Recharts visualizations: trend, popularity, top members, pie, heatmap
- **CSV Import** — Drag-and-drop bulk member import with duplicate detection
- **Dark-Canvas Design** — Framer aesthetic with Mona Sans display type and gradient spotlight cards

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+

### 1. Backend

```bash
cd backend

# Install dependencies
py -m pip install -r requirements.txt

# Copy env file and configure
cp ../.env.example .env

# Run (auto-seeds database on first startup)
py run.py
```

Backend starts at **http://localhost:5000**

### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend starts at **http://localhost:5173**

---

## 🔑 Default Credentials

| Username | Password |
|----------|----------|
| `admin`  | `passw0rd` |

Configure via `.env`:
```
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
```

## 📁 Project Structure

```
ChurchAttendance/
├── frontend/          # React + Vite + TailwindCSS
│   └── src/
│       ├── api/       # Axios API layer
│       ├── components/ # UI + layout components
│       ├── pages/     # Route-level pages
│       ├── store/     # Zustand state
│       ├── hooks/     # Custom hooks
│       └── utils/     # Formatters
├── backend/           # Flask + SQLAlchemy
│   └── app/
│       ├── models/    # SQLAlchemy models
│       ├── routes/    # Blueprint route handlers
│       └── services/  # Business logic
├── .env.example       # Environment template
├── docker-compose.yml # Docker deployment
└── README.md
```

## 🐳 Docker

```bash
cp .env.example .env
# Edit .env with your values
docker-compose up -d
```

App available at **http://localhost:3000**

## 🏗️ API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | No | Admin login |
| GET | `/api/members/search?q=` | No | Autocomplete |
| POST | `/api/attendance/checkin` | No | Member check-in |
| GET | `/api/leaderboard` | No | Public leaderboard |
| GET | `/api/members` | ✅ | List members |
| POST | `/api/members` | ✅ | Create member |
| GET | `/api/meetings` | ✅ | List meetings |
| POST | `/api/meetings` | ✅ | Create meeting |
| GET | `/api/analytics/dashboard` | ✅ | Dashboard stats |
| GET | `/api/analytics/trends` | ✅ | Trend data |
| POST | `/api/import/members` | ✅ | CSV import |
| GET | `/api/export/attendance/csv` | ✅ | Export CSV |

## 🎨 Design System

Based on **DESIGN-framer.md** — Framer's dark-canvas marketing aesthetic:
- `#090909` canvas, `#141414` surface-1, `#1c1c1c` surface-2
- Mona Sans display type with aggressive negative tracking
- White pill CTAs, charcoal secondary pills
- Violet/magenta/orange gradient spotlight cards as accent tiles
- `#0099ff` accent reserved for focus rings and links only

## 🌱 Seed Data

On first startup, the database is auto-populated with:
- **50 Ghanaian member names**
- **6 recurring meetings** (Sunday Family Service, Cell Meeting, Midweek Service, Prayer Investment Hour, Compulsory Family Prayer Ties, Sunday Service Set-Up)
- **~6 weeks of randomized historical attendance** (May 24 – July 2, 2026)

## 🗄️ Database Migration

The app uses SQLite by default. To switch to PostgreSQL:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/church_attendance
```

Install psycopg2: `py -m pip install psycopg2-binary`
