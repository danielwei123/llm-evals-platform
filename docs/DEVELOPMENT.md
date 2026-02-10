# Development Guide

This repo is intentionally **small + production-minded**: a monorepo with a FastAPI backend, Next.js frontend, and docker-compose infra for local dev.

## Quickstart (local)

Prereqs:
- Docker Desktop (or compatible)
- Python 3.11+
- Node 18+ (Node 20 is fine)

### 1) Start DB + backend (Docker)

```bash
make up
```

- Backend: http://localhost:8000
- Swagger: http://localhost:8000/docs
- Health: http://localhost:8000/health

### 2) Run migrations

Recommended (inside a one-shot container):

```bash
make migrate
```

Alternative (local python env):

```bash
cd backend
export DATABASE_URL='postgresql+psycopg://llm_evals:llm_evals@localhost:5432/llm_evals'
alembic upgrade head
```

### 3) Start the frontend

Local node (fastest):

```bash
cd frontend
npm install
npm run dev
```

Or via docker-compose (handy if you don’t want node installed locally):

```bash
make fe
```

Frontend:
- http://localhost:3000

## Environment variables

### Backend

- `DATABASE_URL` (required)
  - Example (docker-compose network): `postgresql+psycopg://llm_evals:llm_evals@db:5432/llm_evals`
  - Example (host): `postgresql+psycopg://llm_evals:llm_evals@localhost:5432/llm_evals`

### Frontend

- `NEXT_PUBLIC_API_BASE` (required for browser calls)
  - Example: `http://localhost:8000`

## Migrations workflow

We use **Alembic**.

Create a new migration (from your local env):

```bash
cd backend
export DATABASE_URL='postgresql+psycopg://llm_evals:llm_evals@localhost:5432/llm_evals'
alembic revision -m "add_runs" --autogenerate
```

Then run:

```bash
alembic upgrade head
```

Notes:
- Keep migrations **small and reversible**.
- Prefer explicit constraints + indexes.

## API conventions

- REST-ish endpoints under `/api/*`
- Pydantic schemas live in `backend/app/schemas`
- SQLAlchemy models live in `backend/app/models`

## Frontend conventions

- Keep API calls in shared helpers (see `frontend/src/lib/api/*`)
- Prefer server components for layout/structure, client components for forms where needed
