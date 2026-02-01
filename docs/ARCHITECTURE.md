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

### Prompt Registry (v0)

We store immutable prompt *versions* under a stable prompt identity:

```mermaid
erDiagram
  prompts {
    uuid id PK
    string name "unique"
    text description
    timestamptz created_at
  }

  prompt_versions {
    uuid id PK
    uuid prompt_id FK
    int version "(prompt_id, version) unique"
    text content
    jsonb parameters
    timestamptz created_at
  }

  prompts ||--o{ prompt_versions : has
```

Planned next entities:
- runs (per execution)
- spans/traces (observability)
- eval datasets + results
