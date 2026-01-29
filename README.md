# ai-fullstack-agent-saas

Production-minded **AI full‑stack founder starter** (Python + TypeScript):

- **Backend:** FastAPI (Python)
- **Frontend:** Next.js (TypeScript)
- **Core:** Agent + RAG
- **Infra:** Postgres + Redis
- **Ops:** tracing/metrics, evals, CI, docker-compose

## Why this repo exists

This repo is designed to become an **industry-ready portfolio project**:

- clean architecture
- reproducible local dev
- measurable quality (evals)
- observability (traces/metrics)
- deployable shape (containers)

## Roadmap (v0)

1. **Scaffold**: monorepo layout, docker-compose, FastAPI + Next.js hello world
2. **RAG**: ingestion + retrieval + citations
3. **Agent**: tool calling, permissions, audit log
4. **Eval harness**: golden sets, regression checks in CI
5. **Observability**: OpenTelemetry traces + basic dashboard

## Architecture (high level)

```mermaid
flowchart LR
  U[User] -->|Chat/UI| FE[Next.js Frontend]
  FE -->|HTTP| API[FastAPI Backend]

  API -->|RAG query| RET[Retrieval]
  RET --> VDB[(Vector DB)]

  API -->|jobs| Q[Queue]
  Q --> W[Worker]

  API --> PG[(Postgres)]
  API --> R[(Redis)]

  API --> OTel[OpenTelemetry]
  W --> OTel
```

## Getting started (soon)

This will be filled in as we scaffold the code.
