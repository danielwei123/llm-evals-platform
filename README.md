# llm-evals-platform

A production-minded **LLM evaluations + monitoring platform** (Python + TypeScript), built to be a flagship portfolio project for an AI full‑stack founder.

- **Backend:** FastAPI (Python)
- **Frontend:** Next.js (TypeScript)
- **Execution (v0):** local-only via **Codex CLI runner**
- **Future:** pluggable providers (OpenAI/Anthropic/etc.) **disabled by default**
- **Core:** prompt registry → runs → traces → evals → CI regression gate

## Why this exists

Shipping LLM features without a safety net is painful. This repo aims to provide:

- **Prompt registry** (versioning, tags, rollback)
- **Run logging** (inputs/outputs, metadata)
- **Tracing/observability** (span tree, timings)
- **Eval harness** (datasets, metrics, regression detection)
- **CI integration** (block merges on regressions)

Prompt-first today, designed to support **agent/tool traces** tomorrow.

## Roadmap (v0 → v1)

### Milestone A — Prompt Registry + Rollback
- Create/edit/version prompts
- Promote version to “prod”
- Roll back quickly

### Milestone B — Runs + Traces + Monitoring
- Run a prompt via Codex CLI runner
- Store run + spans
- UI: runs list + trace viewer
- Metrics: latency percentiles, error rate

### Milestone C — Evals + PR Gate
- Dataset upload (JSONL)
- Eval runs (batch)
- Compare vs baseline, fail on regression
- GitHub Action for PR checks

## Architecture (high level)

```mermaid
flowchart LR
  U[User] --> FE[Next.js UI]
  FE --> API[FastAPI API]

  API --> PG[(Postgres)]
  API --> R[(Redis)]

  API --> RUN[Runner]
  RUN -->|v0| CODEX[Codex CLI]
  RUN -->|later (disabled)| PROVIDERS[OpenAI/Anthropic/etc]

  API --> OTel[OpenTelemetry]
```

## Getting started (local dev)

### Prereqs
- Docker Desktop (or compatible)
- Python 3.11+
- Node 18+

### Start Postgres + backend

```bash
cd infra
docker compose up --build
```

Backend:
- Health: http://localhost:8000/health
- API docs (Swagger): http://localhost:8000/docs

### Run DB migrations

In another terminal:

```bash
cd backend
export DATABASE_URL='postgresql+psycopg://llm_evals:llm_evals@localhost:5432/llm_evals'
alembic upgrade head
```

### Prompt Registry API (v0)

Create a prompt:

```bash
curl -sS -X POST 'http://localhost:8000/api/prompts' \
  -H 'content-type: application/json' \
  -d '{"name":"support_reply","description":"Tone + structure for support","content":"You are helpful...","parameters":{"temperature":0.2}}' | jq
```

List prompts:

```bash
curl -sS 'http://localhost:8000/api/prompts' | jq
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

UI:
- http://localhost:3000
- Prompt Registry list: http://localhost:3000/prompts

## Docs

- `docs/ARCHITECTURE.md`
