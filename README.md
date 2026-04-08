# Nuzul 🏠

Real estate management platform for university student housing.

Built with **FastAPI** (backend) + **React + Vite** (frontend) + **Supabase** (auth + database).

---

## Project structure

```
Nuzul/
├── backend/                  # FastAPI · Python 3.12
│   ├── app/
│   │   ├── api/routers/      # auth, properties, bookings
│   │   ├── core/             # config, database, security (JWT)
│   │   ├── models/           # SQLModel ORM models
│   │   ├── schemas/          # Pydantic request/response schemas
│   │   └── main.py           # FastAPI app entry point
│   ├── alembic/              # DB migrations
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/                 # React 18 · Vite · TypeScript · Tailwind
│   ├── src/
│   │   ├── components/       # Navbar, ProtectedRoute, shared UI
│   │   ├── hooks/            # useAuth (Supabase ↔ Zustand)
│   │   ├── lib/              # supabase.ts client
│   │   ├── pages/            # Login, Register, Listings, Dashboard
│   │   ├── services/         # api.ts (axios), auth.ts, properties.ts
│   │   ├── store/            # Zustand auth store
│   │   └── types/            # Shared TypeScript interfaces
│   ├── package.json
│   └── Dockerfile
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## Prerequisites

- Python 3.12+
- Node 20+
- A [Supabase](https://supabase.com) project (free tier works)

---

## 1. Supabase setup

1. Create a new project at [supabase.com](https://supabase.com).
2. Go to **Authentication → Providers** and enable **Google**.
3. Note down from **Project Settings → API**:
   - `Project URL`
   - `anon / public` key
   - `JWT Secret` (Settings → API → JWT Secret)

---

## 2. Backend setup

```bash
cd backend
cp .env.example .env      # fill in your Supabase values
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API runs at → `http://localhost:8000`
Interactive docs → `http://localhost:8000/docs`

### Run migrations (production)

```bash
alembic revision --autogenerate -m "initial"
alembic upgrade head
```

---

## 3. Frontend setup

```bash
cd frontend
cp .env.example .env      # fill in your Supabase values
npm install
npm run dev
```

App runs at → `http://localhost:5173`

---

## 4. Docker (full stack)

```bash
# From the repo root
cp backend/.env.example backend/.env    # fill in values
docker compose up --build
```

- Frontend → `http://localhost:5173`
- Backend  → `http://localhost:8000`

---

## API endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | — | Health check |
| `POST` | `/api/v1/auth/register` | JWT | Register user in DB after Supabase signup |
| `GET` | `/api/v1/auth/me` | JWT | Get current user profile |
| `PATCH` | `/api/v1/auth/me` | JWT | Update profile |
| `GET` | `/api/v1/properties` | — | List/filter properties |
| `GET` | `/api/v1/properties/{id}` | — | Get single property |
| `POST` | `/api/v1/properties` | JWT | Create property |
| `PATCH` | `/api/v1/properties/{id}` | JWT | Update property (owner only) |
| `DELETE` | `/api/v1/properties/{id}` | JWT | Delete property (owner only) |
| `GET` | `/api/v1/bookings/my` | JWT | List my bookings |
| `POST` | `/api/v1/bookings` | JWT | Create booking |
| `PATCH` | `/api/v1/bookings/{id}` | JWT | Update booking status |

---

## Frontend routes

| Path | Auth | Description |
|------|------|-------------|
| `/listings` | Public | Browse available properties |
| `/login` | Public | Email + Google sign in |
| `/register` | Public | Create account |
| `/auth/callback` | Public | OAuth redirect handler |
| `/dashboard` | Protected | User dashboard |

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend framework | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS |
| Routing | React Router v6 |
| State | Zustand |
| HTTP client | Axios |
| Auth | Supabase (Email + Google OAuth) |
| Backend | FastAPI + Python 3.12 |
| ORM | SQLModel (SQLAlchemy + Pydantic) |
| Database | PostgreSQL (Supabase-hosted) |
| Migrations | Alembic |
| Containers | Docker + Docker Compose |
