# Architecture

## Repo layout

- `backend/` — FastAPI service + Alembic migrations
- `frontend/` — Next.js UI
- `infra/` — local infrastructure (docker-compose)
- `docs/` — design docs & diagrams

## Runtime components

```mermaid
flowchart LR
  U[User/Developer] --> FE[Next.js (frontend)]
  FE --> API[FastAPI (backend)]
  API --> PG[(Postgres)]

  subgraph Local Dev
    FE
    API
    PG
  end
```

## Data layer

- Postgres is the system of record.
- Alembic manages schema migrations.

Planned core entities:
- prompts (registry + versions)
- runs (per execution)
- spans/traces (observability)
- eval datasets + results
