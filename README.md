# FitTogether - Couples Diet Companion App

A gamified diet tracking app for couples who want to lose weight together. Track meals, challenge each other, chat, and stay accountable in a fun, motivating way.

## Features

- **Authentication** - JWT-based signup/login with profile setup
- **Partner Matching** - Unique invite codes to pair with your partner
- **Shared Dashboard** - See both partners' calories, streaks, and scores
- **Meal Logging** - Built-in food database (Turkish & global foods) with calorie tracking
- **Water Tracking** - Quick-add water intake with partner comparison
- **Cheat Day System** - Configurable weekly cheat day limits
- **"I Broke the Diet" Button** - Fun, safe punishments when you slip
- **Private Chat** - Couple-only messaging with unread badges
- **Progress Tracking** - Weight logs with charts and percentage progress
- **Gamification** - Points, badges, streaks, and couple leaderboard
- **Daily Challenges** - Fun mini challenges generated daily
- **Notifications** - In-app notifications for partner activities
- **Dark Mode** - Toggle dark theme

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Recharts |
| Backend | FastAPI, Python 3.11 |
| Database | PostgreSQL 16 |
| ORM | SQLAlchemy 2.0 |
| Auth | JWT (python-jose + passlib/bcrypt) |
| Container | Docker Compose |

## Quick Start

### Using Docker Compose (recommended)

```bash
# Clone and navigate
cd diyet_uygulama

# Copy environment variables
cp .env.example .env

# Start all services
docker-compose up --build

# App available at:
# Frontend: http://localhost:3000
# Backend:  http://localhost:8000
# API docs: http://localhost:8000/docs
```

### Manual Setup

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt

# Set DATABASE_URL env var pointing to your PostgreSQL
export DATABASE_URL=postgresql://user:pass@localhost:5432/fittogether

uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Project Structure

```
diyet_uygulama/
├── docker-compose.yml
├── .env.example
├── README.md
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py              # FastAPI app entry
│       ├── config.py            # Settings
│       ├── database.py          # SQLAlchemy setup
│       ├── models/              # 12 SQLAlchemy models
│       ├── schemas/             # Pydantic schemas
│       ├── routers/             # API route handlers
│       │   ├── auth.py          # Signup/login/profile
│       │   ├── pairing.py       # Match/unmatch
│       │   ├── meals.py         # Meal CRUD + food search
│       │   ├── tracking.py      # Weight, water, cheat days
│       │   ├── social.py        # Messages, notifications
│       │   ├── challenges.py    # Daily challenges, diet break
│       │   └── gamification.py  # Score, badges, streaks
│       ├── services/            # Business logic
│       │   ├── auth.py          # JWT + password utils
│       │   └── gamification.py  # Points, badges, punishments
│       └── seed/
│           └── seed_data.py     # 40+ foods, 12 challenges, 10 badges
└── frontend/
    ├── Dockerfile
    ├── package.json
    └── src/
        ├── app/                 # Next.js pages
        │   ├── page.tsx         # Landing page
        │   ├── login/           # Login page
        │   ├── signup/          # Signup page
        │   ├── onboarding/      # Profile setup
        │   ├── pairing/         # Partner matching
        │   ├── dashboard/       # Main dashboard
        │   ├── meals/           # Meal logging
        │   ├── chat/            # Private messaging
        │   ├── progress/        # Weight charts + badges
        │   └── settings/        # Settings + notifications
        ├── components/
        │   └── ui/
        │       └── AppShell.tsx # Bottom nav + layout
        ├── contexts/
        │   └── AuthContext.tsx   # Auth state management
        ├── lib/
        │   └── api.ts           # API client
        ├── hooks/
        │   └── usePolling.ts    # Polling hook for chat
        └── types/
            └── index.ts         # TypeScript interfaces
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/signup | Create account |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |
| PUT | /api/auth/profile | Update profile |
| GET | /api/pairing/status | Get pairing status |
| POST | /api/pairing/match | Match with partner |
| POST | /api/pairing/unmatch | Unmatch |
| GET | /api/meals/foods?q= | Search foods |
| POST | /api/meals | Create meal |
| GET | /api/meals | Get my meals |
| GET | /api/meals/partner | Get partner meals |
| GET | /api/meals/today-calories | Today's calories |
| POST | /api/tracking/weight | Log weight |
| GET | /api/tracking/weight/progress | Weight progress |
| POST | /api/tracking/water | Log water |
| GET | /api/tracking/water/today | Today's water |
| POST | /api/tracking/cheat-day | Mark cheat day |
| GET | /api/tracking/cheat-days/weekly | Weekly cheat days |
| POST | /api/social/messages | Send message |
| GET | /api/social/messages | Get messages |
| GET | /api/social/notifications | Get notifications |
| GET | /api/challenges/daily | Today's challenges |
| POST | /api/challenges/complete | Complete challenge |
| POST | /api/challenges/diet-break | Break diet |
| GET | /api/gamification/score | My score |
| GET | /api/gamification/leaderboard | Couple leaderboard |
| GET | /api/gamification/badges | All badges |
| GET | /api/gamification/streak | Streak info |
| GET | /api/gamification/dashboard-summary | Full dashboard data |

## Seed Data

The app auto-seeds on first run:
- **40+ foods** including Turkish foods (yumurta, tavuk gogsu, pilav, kofte, baklava...) and global foods
- **12 daily challenges** (sugar-free day, 8000 steps, drink 2L water...)
- **10 badges** (Ilk Adim, Haftalik Savasci, Sampiyon, Efsane...)
- **12 fun punishments** for diet breaks (buy coffee, write sweet note, 20-min walk...)

## Demo Flow

1. Sign up two accounts
2. Complete onboarding for both
3. Copy invite code from User A
4. Enter code in User B's pairing page
5. Both dashboards now show shared data
6. Log meals, track water, complete challenges
7. Chat with each other
8. Track weight progress over time
