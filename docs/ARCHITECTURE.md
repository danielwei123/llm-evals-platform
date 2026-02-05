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

#### API (v0)

- `POST /api/prompts` → create prompt + version 1
- `GET /api/prompts` → list prompts (includes latest version)
- `GET /api/prompts/{prompt_id}` → prompt detail w/ versions
- `PATCH /api/prompts/{prompt_id}` → update prompt metadata
- `POST /api/prompts/{prompt_id}/versions` → create new version
- `DELETE /api/prompts/{prompt_id}` → delete prompt (cascades versions)

#### UI routes (v0)

- `/prompts` → list prompts (shows latest version snippet)
- `/prompts/new` → create prompt (creates v1)
- `/prompts/{prompt_id}` → prompt detail + versions list + create new version

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

#### Create flow (v0)

```mermaid
sequenceDiagram
  autonumber
  participant FE as Next.js UI
  participant API as FastAPI
  participant PG as Postgres

  FE->>API: POST /api/prompts {name,description,content,parameters}
  API->>PG: INSERT prompts
  API->>PG: INSERT prompt_versions (version=1)
  PG-->>API: rows
  API-->>FE: 201 PromptDetailOut (prompt + versions)
```

Planned next entities:
- runs (per execution)
- spans/traces (observability)
- eval datasets + results
