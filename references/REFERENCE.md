# Nuzul — Project Reference Document
> Real estate management platform for university student housing.
> Last updated: April 2026

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Repository Structure](#3-repository-structure)
4. [Architecture](#4-architecture)
5. [Backend — Deep Dive](#5-backend--deep-dive)
6. [Frontend — Deep Dive](#6-frontend--deep-dive)
7. [Database Schema](#7-database-schema)
8. [API Reference](#8-api-reference)
9. [Auth Flow](#9-auth-flow)
10. [Environment Variables](#10-environment-variables)
11. [Running the Project](#11-running-the-project)
12. [What's Built vs What's TODO](#12-whats-built-vs-whats-todo)

---

## 1. Project Overview

Nuzul is a full-stack web platform that connects **university students** looking for housing with **landlords** who manage properties near universities.

**Core features (planned):**
- Browse and filter available property listings
- Student registration and profile management
- Landlord property listing management (create, update, delete)
- Booking requests from students to landlords
- Auth via Email/Password and Google OAuth

**Current status:** Project base is fully scaffolded and running. Backend API is live. Frontend renders with routing and auth wired up. Database tables need to be created in Supabase SQL editor.

---

## 2. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Backend framework | FastAPI | 0.135+ |
| Backend language | Python | 3.11 |
| Backend server | Uvicorn | 0.44+ |
| Auth provider | Supabase Auth | — |
| Database | PostgreSQL (Supabase-hosted) | — |
| Supabase client | supabase-py | 2.28+ |
| Frontend framework | React | 18 |
| Frontend language | TypeScript | 5 |
| Frontend build tool | Vite | 8 |
| Styling | Tailwind CSS | v4 |
| Routing | React Router | v6 |
| State management | Zustand | 4 |
| HTTP client | Axios | 1 |
| Containerization | Docker + Docker Compose | — |

---

## 3. Repository Structure

```
Nuzul/                          ← Monorepo root
├── backend/                    ← FastAPI application
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py             ← App entry point, middleware, router registration
│   │   ├── api/
│   │   │   └── routers/
│   │   │       ├── auth.py     ← /api/v1/auth endpoints
│   │   │       ├── properties.py ← /api/v1/properties endpoints
│   │   │       └── bookings.py ← /api/v1/bookings endpoints
│   │   ├── core/
│   │   │   ├── config.py       ← Environment settings (pydantic-settings)
│   │   │   ├── database.py     ← Supabase client singletons
│   │   │   └── security.py     ← JWT verification via Supabase Auth
│   │   ├── models/             ← SQLModel ORM models (reference only, not used at runtime)
│   │   │   ├── user.py
│   │   │   ├── property.py
│   │   │   └── booking.py
│   │   └── schemas/            ← Pydantic schemas (reference only)
│   │       ├── user.py
│   │       ├── property.py
│   │       └── booking.py
│   ├── alembic/                ← DB migrations (not active — tables created via SQL editor)
│   ├── requirements.txt        ← Python dependencies
│   ├── .env.example            ← Environment variable template
│   ├── .env                    ← Your local secrets (never commit)
│   └── Dockerfile
│
├── frontend/                   ← React application
│   ├── src/
│   │   ├── main.tsx            ← React entry point
│   │   ├── App.tsx             ← Router setup, auth bootstrap
│   │   ├── index.css           ← Tailwind v4 import
│   │   ├── lib/
│   │   │   └── supabase.ts     ← Supabase JS client (anon key)
│   │   ├── services/
│   │   │   ├── api.ts          ← Axios instance with auto JWT header
│   │   │   ├── auth.ts         ← Auth service (sign in, sign up, Google OAuth)
│   │   │   └── properties.ts   ← Properties API calls
│   │   ├── hooks/
│   │   │   └── useAuth.ts      ← Auth state hook + bootstrap
│   │   ├── store/
│   │   │   └── authStore.ts    ← Zustand auth store
│   │   ├── types/
│   │   │   └── index.ts        ← Shared TypeScript interfaces
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.tsx
│   │   │   │   └── ProtectedRoute.tsx
│   │   │   └── ui/             ← Empty — ready for shared UI components
│   │   └── pages/
│   │       ├── LoginPage.tsx
│   │       ├── RegisterPage.tsx
│   │       ├── AuthCallbackPage.tsx  ← Google OAuth redirect handler
│   │       ├── ListingsPage.tsx
│   │       └── DashboardPage.tsx
│   ├── public/
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   ├── tsconfig.node.json
│   ├── package.json
│   ├── .env                    ← Your local secrets (never commit)
│   └── Dockerfile
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## 4. Architecture

```
Browser (React)
     │
     │  1. User logs in → Supabase issues JWT
     │  2. Frontend attaches JWT to every API request
     │
     ▼
FastAPI Backend (port 8000)
     │
     ├── Verifies JWT via Supabase Auth (get_user call)
     ├── Uses service-role Supabase client for DB operations
     │
     ▼
Supabase (PostgreSQL + Auth)
     ├── auth.users     ← Managed by Supabase Auth automatically
     ├── users          ← Our app user profiles
     ├── properties     ← Property listings
     └── bookings       ← Booking requests
```

**Key design decision:** The backend does NOT connect to PostgreSQL directly. It uses the Supabase Python client (`supabase-py`) which communicates via the Supabase REST API. This eliminates the need for a `DATABASE_URL` and works on any network (no IPv4/IPv6 issues).

---

## 5. Backend — Deep Dive

### 5.1 Entry Point — `app/main.py`

- Creates the FastAPI app with lifespan context
- On startup: pings the `users` table to verify Supabase connection
- Registers CORS middleware (allows `localhost:5173` and `localhost:3000`)
- Mounts all routers under `/api/v1`
- Exposes `/health` endpoint (no auth required)
- `/docs` and `/redoc` are available in debug mode

### 5.2 Config — `app/core/config.py`

Uses `pydantic-settings` to load environment variables from `.env`. Cached with `@lru_cache` so Settings is only instantiated once.

**Required env vars:**
```
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

**Optional env vars (have defaults):**
```
APP_NAME         default: "Nuzul"
APP_ENV          default: "development"
DEBUG            default: true
ALLOWED_ORIGINS  default: "http://localhost:5173,http://localhost:3000"
```

### 5.3 Database — `app/core/database.py`

Two Supabase clients:

**`get_db()`** — Service-role singleton client
- Used for all database read/write operations
- Bypasses Row Level Security (RLS)
- Must NEVER be exposed to or used by the frontend
- Initialized once and reused (singleton pattern)

**`get_auth_client()`** — Fresh anon-key client
- Used ONLY for JWT token verification
- A new instance created each call to avoid session state bleeding into the service client

### 5.4 Security — `app/core/security.py`

**`verify_supabase_token`** — FastAPI dependency
- Extracts Bearer token from `Authorization` header
- Calls `auth_client.auth.get_user(token)` to verify with Supabase
- Returns `{ id, email, user_metadata, app_metadata }` on success
- Raises `401 Unauthorized` on failure

**`get_current_user_id`** — Shortcut dependency
- Wraps `verify_supabase_token`
- Returns just the Supabase user UUID string
- Used in routers that only need the user ID

### 5.5 Routers

#### `app/api/routers/auth.py` — prefix: `/api/v1/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | JWT | Creates user row in `users` table after Supabase signup. Idempotent — safe to call multiple times. |
| GET | `/me` | JWT | Returns current user's profile from `users` table. |
| PATCH | `/me` | JWT | Updates `full_name` or `avatar_url` only. |

#### `app/api/routers/properties.py` — prefix: `/api/v1/properties`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Public | List properties. Supports query filters: `city`, `min_price`, `max_price`, `rooms`, `available_only`. |
| GET | `/{property_id}` | Public | Get single property by UUID. |
| POST | `/` | JWT | Create new property. Sets `owner_id` from authenticated user. |
| PATCH | `/{property_id}` | JWT | Update property. Only the owner can update. |
| DELETE | `/{property_id}` | JWT | Delete property. Only the owner can delete. Returns 204. |

#### `app/api/routers/bookings.py` — prefix: `/api/v1/bookings`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/my` | JWT | List all bookings made by the current student. |
| POST | `/` | JWT | Create booking request. Sets `student_id` from authenticated user, status defaults to `pending`. |
| PATCH | `/{booking_id}` | JWT | Update booking. Only the student who made it can update. Allowed fields: `status`, `move_out_date`. |

### 5.6 Models — `app/models/`

SQLModel models exist as **reference/documentation** for the database schema. They are NOT used at runtime (no SQLAlchemy engine). Use them to understand the table structure when writing SQL in the Supabase editor.

### 5.7 Schemas — `app/schemas/`

Pydantic schemas for **reference only** — since the routers accept raw `dict` and use allowlist filtering, these schemas document the expected request/response shapes.

---

## 6. Frontend — Deep Dive

### 6.1 Entry Point — `src/main.tsx`

Standard React 18 entry. Wraps `<App />` in `<StrictMode>`.

### 6.2 Routing — `src/App.tsx`

Calls `useAuthBootstrap()` once at root to sync Supabase session into Zustand.

**Routes:**
| Path | Auth | Component |
|------|------|-----------|
| `/` | Public | Redirects to `/listings` |
| `/listings` | Public | `ListingsPage` |
| `/login` | Public | `LoginPage` |
| `/register` | Public | `RegisterPage` |
| `/auth/callback` | Public | `AuthCallbackPage` |
| `/dashboard` | Protected | `DashboardPage` |
| `*` | Public | Redirects to `/listings` |

### 6.3 Auth System

**`src/lib/supabase.ts`**
Creates and exports the Supabase JS client using `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

**`src/store/authStore.ts`**
Zustand store holding:
- `session` — Supabase session object
- `user` — Our backend user profile
- `isLoading` — Bootstrap loading state

**`src/hooks/useAuth.ts`**
Two exports:
- `useAuthBootstrap()` — Call ONCE at app root. Sets up Supabase auth listener, syncs state to Zustand, calls `/auth/register` on first sign-in.
- `useAuth()` — Use anywhere in the app to read `{ session, user, isLoading }`.

**`src/components/layout/ProtectedRoute.tsx`**
Wraps protected routes. Shows loading spinner while auth bootstraps, redirects to `/login` if no session.

### 6.4 Services

**`src/services/api.ts`** — Axios instance
- Base URL: `/api/v1` (proxied to `localhost:8000` in dev via Vite)
- Request interceptor: automatically fetches Supabase session and attaches `Authorization: Bearer <token>` header
- Response interceptor: auto sign-out on `401` responses

**`src/services/auth.ts`**
- `signInWithEmail(email, password)`
- `signUpWithEmail(email, password)`
- `signInWithGoogle()` — redirects to `/auth/callback`
- `signOut()`
- `registerInBackend()` — calls `POST /api/v1/auth/register`
- `getMe()` — calls `GET /api/v1/auth/me`
- `updateMe(data)` — calls `PATCH /api/v1/auth/me`

**`src/services/properties.ts`**
- `list(params?)` — supports `city`, `min_price`, `max_price`, `rooms`, `available_only`
- `getById(id)`
- `create(data)`
- `update(id, data)`
- `delete(id)`

### 6.5 TypeScript Types — `src/types/index.ts`

```typescript
User        { id, supabase_id, email, full_name, avatar_url, role, is_active, created_at }
Property    { id, owner_id, title, description, address, city, price_per_month, rooms, is_available, near_university, image_url, created_at, updated_at }
Booking     { id, property_id, student_id, status, move_in_date, move_out_date, message, created_at }

PropertyCreate  = Omit<Property, 'id' | 'owner_id' | 'created_at' | 'updated_at'>
PropertyUpdate  = Partial<PropertyCreate>
BookingCreate   = Pick<Booking, 'property_id' | 'move_in_date' | 'move_out_date' | 'message'>
BookingUpdate   = Partial<Pick<Booking, 'status' | 'move_out_date'>>
```

### 6.6 Pages

**`LoginPage.tsx`** — Email + Google sign in form. Error display. Redirects to `/dashboard` on success.

**`RegisterPage.tsx`** — Email sign up form. Shows "check your email" confirmation screen after signup. Google OAuth button.

**`AuthCallbackPage.tsx`** — Handles Google OAuth redirect. Reads session from URL, redirects to `/dashboard` or `/login`.

**`ListingsPage.tsx`** — Fetches and displays available properties using `propertiesService.list()`. Starter card grid UI — ready to be styled by frontend dev.

**`DashboardPage.tsx`** — Shows logged-in user's name and role. Placeholder stat cards. Ready to be expanded with booking history, saved listings, etc.

---

## 7. Database Schema

Tables must be created manually in the **Supabase SQL Editor**. Here is the SQL:

```sql
-- Users table (mirrors Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supabase_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'landlord', 'admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Properties table
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  price_per_month NUMERIC NOT NULL,
  rooms INTEGER DEFAULT 1,
  is_available BOOLEAN DEFAULT true,
  near_university TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Bookings table
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  move_in_date TIMESTAMPTZ NOT NULL,
  move_out_date TIMESTAMPTZ,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 8. API Reference

**Base URL (dev):** `http://localhost:8000`
**API prefix:** `/api/v1`
**Auth:** `Authorization: Bearer <supabase_access_token>`

### Health
```
GET /health
→ { status, app, env, supabase }
```

### Auth
```
POST   /api/v1/auth/register   JWT   Create user in DB after signup
GET    /api/v1/auth/me         JWT   Get current user profile
PATCH  /api/v1/auth/me         JWT   Update { full_name, avatar_url }
```

### Properties
```
GET    /api/v1/properties                    Public   List/filter properties
GET    /api/v1/properties/{id}              Public   Get single property
POST   /api/v1/properties                   JWT      Create property
PATCH  /api/v1/properties/{id}             JWT      Update property (owner only)
DELETE /api/v1/properties/{id}             JWT      Delete property (owner only)
```

Query params for `GET /api/v1/properties`:
```
city           string   Filter by city
min_price      float    Minimum price per month
max_price      float    Maximum price per month
rooms          int      Number of rooms
available_only bool     Default: true
```

### Bookings
```
GET    /api/v1/bookings/my         JWT   List my bookings
POST   /api/v1/bookings            JWT   Create booking request
PATCH  /api/v1/bookings/{id}       JWT   Update booking (student only)
```

---

## 9. Auth Flow

### Email Sign Up
```
1. User fills RegisterPage form
2. authService.signUpWithEmail(email, password) → Supabase sends confirmation email
3. User clicks confirmation link
4. Supabase redirects back, onAuthStateChange fires with SIGNED_IN
5. useAuthBootstrap calls authService.registerInBackend()
   → POST /api/v1/auth/register (creates row in users table)
6. useAuthBootstrap calls authService.getMe()
   → GET /api/v1/auth/me (fetches user profile)
7. User profile saved to Zustand store
```

### Google OAuth
```
1. User clicks "Continue with Google"
2. authService.signInWithGoogle() → redirect to Google
3. Google redirects to /auth/callback
4. AuthCallbackPage reads session, redirects to /dashboard
5. Same as steps 4–7 above
```

### Every API Request
```
1. api.ts request interceptor runs
2. Fetches current Supabase session
3. Attaches Authorization: Bearer <access_token> header
4. FastAPI security.py calls get_user(token) on Supabase
5. If valid → handler runs
6. If invalid → 401 Unauthorized returned
```

---

## 10. Environment Variables

### Backend — `backend/.env`
```env
APP_NAME=Nuzul
APP_ENV=development
DEBUG=true

SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

Where to find values:
- `SUPABASE_URL` → Supabase → Project Settings → API → Project URL
- `SUPABASE_ANON_KEY` → Supabase → Project Settings → API Keys → anon/public
- `SUPABASE_SERVICE_ROLE_KEY` → Supabase → Project Settings → API Keys → service_role

### Frontend — `frontend/.env`
```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
VITE_API_BASE_URL=http://localhost:8000
```

---

## 11. Running the Project

### Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # Mac/Linux
pip install fastapi[standard] sqlmodel asyncpg alembic python-jose[cryptography] supabase
cp .env.example .env          # fill in your values
uvicorn app.main:app --reload --port 8000
```

API docs: `http://localhost:8000/docs`

### Frontend
```bash
cd frontend
npm install
cp .env.example .env          # fill in your values
npm run dev
```

App: `http://localhost:5173`

### Create Database Tables
Go to **Supabase → SQL Editor** and run the SQL from Section 7.

---

## 12. What's Built vs What's TODO

### ✅ Done
- Full project structure and monorepo setup
- Backend: FastAPI app with CORS, lifespan, health check
- Backend: Supabase auth integration (JWT verification)
- Backend: All 3 routers with CRUD operations (auth, properties, bookings)
- Backend: Service-role DB client and anon auth client
- Backend: Environment config with pydantic-settings
- Frontend: Vite + React 18 + TypeScript setup
- Frontend: Tailwind CSS v4
- Frontend: React Router v6 with protected routes
- Frontend: Supabase JS client
- Frontend: Axios with auto JWT injection
- Frontend: Zustand auth store
- Frontend: Auth bootstrap hook
- Frontend: Login page (email + Google)
- Frontend: Register page (email + Google)
- Frontend: Auth callback page
- Frontend: Listings page (data fetching wired up)
- Frontend: Dashboard page (placeholder)
- Frontend: Navbar with auth state
- Frontend: TypeScript types for all entities
- Docker + Docker Compose setup

### 🔲 TODO — Backend
- Add Pydantic request validation to routers (replace raw `dict`)
- Add pagination to `GET /properties`
- Add landlord role check on property creation
- Add landlord booking management (confirm/cancel)
- Add `GET /properties/my` for landlord's own listings
- Add Supabase Storage integration for property images
- Add input validation and better error messages
- Write tests

### 🔲 TODO — Frontend
- Style all pages properly with Tailwind
- Property detail page
- Property creation form (for landlords)
- Booking request form
- User profile page
- Dashboard with real booking data
- Search and filter UI on listings page
- Image upload for properties
- Error boundary and loading states
- Mobile responsive layout
