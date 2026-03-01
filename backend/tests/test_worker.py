import os

# IMPORTANT: app.db creates its engine at import-time based on DATABASE_URL.
# Ensure tests can point at CI's postgres before importing the app.
os.environ.setdefault(
    "DATABASE_URL",
    # Default matches `infra/docker-compose.yml` (db_test → host port 5433).
    "postgresql+psycopg://llm_evals:llm_evals@localhost:5433/llm_evals_test",
)

from fastapi.testclient import TestClient
from sqlalchemy import text

from app.db import engine
from app.main import app
from app.worker import run_once


def _reset_db():
    with engine.begin() as conn:
        conn.execute(text("TRUNCATE TABLE runs, prompt_tags, tags, prompt_versions, prompts CASCADE"))


def test_worker_processes_a_queued_run_to_succeeded():
    _reset_db()
    client = TestClient(app)

    r = client.post(
        "/api/prompts",
        json={"name": "demo", "description": None, "content": "Hello", "parameters": None},
    )
    assert r.status_code == 201, r.text

    r = client.post("/api/runs", json={"prompt_name": "demo", "input": {"x": 1}})
    assert r.status_code == 201, r.text
    run_id = r.json()["id"]

    processed = run_once()
    assert processed == run_id

    r = client.get(f"/api/runs/{run_id}")
    assert r.status_code == 200
    run = r.json()
    assert run["status"] == "succeeded"
    assert run["output"] is not None and "stub runner output" in run["output"]
    assert run["started_at"] is not None
    assert run["finished_at"] is not None
