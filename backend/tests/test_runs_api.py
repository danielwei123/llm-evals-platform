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


def _reset_db():
    with engine.begin() as conn:
        conn.execute(text("TRUNCATE TABLE runs, prompt_tags, tags, prompt_versions, prompts CASCADE"))


def test_create_and_list_runs():
    _reset_db()
    client = TestClient(app)

    # Need a prompt to attach the run to.
    r = client.post(
        "/api/prompts",
        json={
            "name": "demo",
            "description": None,
            "content": "Hello",
            "parameters": None,
        },
    )
    assert r.status_code == 201, r.text

    r = client.post(
        "/api/runs",
        json={"prompt_name": "demo", "input": {"user": "hi"}},
    )
    assert r.status_code == 201, r.text
    run = r.json()
    assert run["status"] == "queued"
    assert run["input"] == {"user": "hi"}
    assert run["prompt_version"] == 1

    run_id = run["id"]

    r = client.get("/api/runs")
    assert r.status_code == 200
    runs = r.json()
    assert len(runs) == 1
    assert runs[0]["id"] == run_id

    r = client.get(f"/api/runs/{run_id}")
    assert r.status_code == 200
    assert r.json()["id"] == run_id


def test_create_run_unknown_prompt_is_404():
    _reset_db()
    client = TestClient(app)

    r = client.post("/api/runs", json={"prompt_name": "missing", "input": None})
    assert r.status_code == 404
