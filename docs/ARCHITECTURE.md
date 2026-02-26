# Architecture

## Repo layout

- `backend/` — FastAPI service + Alembic migrations
- `frontend/` — Next.js UI
- `infra/` — local infrastructure (docker-compose)
- `docs/` — design docs & diagrams

## Runtime components (local dev)

```mermaid
flowchart LR
  U[User/Developer] --> FE[Next.js (frontend)]
  FE --> API[FastAPI (backend)]
  API --> PG[(Postgres)]

  subgraph Local Dev (docker-compose)
    API
    PG
  end

  subgraph Local Dev (host machine)
    FE
  end
```

## Backend structure

The backend is intentionally layered so we can grow into runs/traces/evals without turning into a ball of mud.

```mermaid
flowchart TB
  R[FastAPI router\napp/api/*] --> S[Schemas\napp/schemas/*]
  R --> DB[DB session\napp/db.py]
  DB --> M[Models\napp/models/*]
  M --> PG[(Postgres)]
  R --> Settings[Settings\napp/settings.py]
```

## Data layer

- Postgres is the system of record.
- Alembic manages schema migrations.
- `infra/docker-compose.yml` provides a consistent local environment.

### Prompt Registry (v0)

#### API (v0)

- `POST /api/prompts` → create prompt + version 1
- `GET /api/prompts?q=&tag=&limit=&offset=` → list prompts (includes latest version; supports simple search + tag filter + pagination; implemented as a single join query + 2nd query for tags)
- `GET /api/prompts/by-name/{name}` → resolve stable prompt name to its active version (runner read path)
- `GET /api/prompts/{prompt_id}` → prompt detail w/ versions
- `PATCH /api/prompts/{prompt_id}` → update prompt metadata
- `POST /api/prompts/{prompt_id}/versions` → create new version (allocates next sequential version; DB-enforced uniqueness with retry on concurrent writes)
- `POST /api/prompts/{prompt_id}/activate` → set the prompt’s `active_version` (promotion/rollback)
- `DELETE /api/prompts/{prompt_id}` → delete prompt (cascades versions)

#### UI routes (v0)

- `/prompts` → list prompts (shows latest version snippet; supports `?q=` search + `?tag=` filter)
- `/prompts/new` → create prompt (creates v1)
- `/prompts/{prompt_id}` → prompt detail + versions list + create new version + delete prompt

We store immutable prompt *versions* under a stable prompt identity.

**Prompt names are normalized to lowercase** on create and must only contain:
- letters `a-z`
- numbers `0-9`
- separators `_ - . /`

This makes prompt names safe to use as stable identifiers in code, config, and runners.


```mermaid
erDiagram
  prompts {
    uuid id PK
    string name "unique"
    text description
    int active_version
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

  tags {
    uuid id PK
    string name "unique"
    timestamptz created_at
  }

  prompt_tags {
    uuid prompt_id FK
    uuid tag_id FK
    timestamptz created_at
  }

  prompts ||--o{ prompt_versions : has
  prompts ||--o{ prompt_tags : labeled
  tags ||--o{ prompt_tags : used
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

## Runs (v0 scaffold)

We now have a minimal `runs` table + API to **queue** executions. This is intentionally small
and will evolve once the Codex runner is wired in.

### API (v0 scaffold)

- `POST /api/runs` → create a queued run for a prompt’s *active* version
- `GET /api/runs?prompt_id=&limit=&offset=` → list runs (newest first)
- `GET /api/runs/{run_id}` → run detail

```mermaid
erDiagram
  runs {
    uuid id PK
    uuid prompt_id FK
    int prompt_version
    string status "queued|running|succeeded|failed"
    jsonb input
    text output
    text error
    timestamptz created_at
    timestamptz started_at
    timestamptz finished_at
  }

  prompts ||--o{ runs : executed
```

### UI routes (v0 scaffold)

- `/runs` → list runs
- `/runs/new` → queue a run (creates a `queued` run record)
- `/runs/{run_id}` → run detail

Planned next entities:
- spans/traces (observability)
- eval datasets + results
