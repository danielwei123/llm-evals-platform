# Architecture

## Goals
- **Founder-ready**: ship fast, but keep production hygiene.
- **Observable by default**: traces/metrics/logs are first-class.
- **Measurable quality**: eval harness + regression tests.

## Components
- **frontend/**: Next.js (TypeScript)
- **backend/**: FastAPI (Python)
- **infra/**: docker-compose, DBs, local observability

## Data flow
1) User interacts with Next.js UI
2) UI calls FastAPI API
3) API runs RAG + (optional) agent tools
4) Jobs run async via queue/worker
5) All actions traced via OpenTelemetry

## Planned storage
- Postgres: users, projects, runs, tool audit logs
- Redis: cache + job queue
- Vector DB: embeddings + chunks (pluggable)

