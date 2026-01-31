# Backend (FastAPI)

## Dev

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -U pip
pip install -e .

export DATABASE_URL='postgresql+psycopg://llm_evals:llm_evals@localhost:5432/llm_evals'
uvicorn app.main:app --reload
```

Health:
- http://localhost:8000/health

## Migrations (Alembic)

This repo uses Alembic.

```bash
cd backend
export DATABASE_URL='postgresql+psycopg://llm_evals:llm_evals@localhost:5432/llm_evals'

alembic revision -m "init" --empty
alembic upgrade head
```
