import os

# IMPORTANT: app.db creates its engine at import-time based on DATABASE_URL.
# Ensure tests can point at CI's postgres before importing the app.
os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+psycopg://llm_evals:llm_evals@localhost:5432/llm_evals_test",
)

from fastapi.testclient import TestClient
from sqlalchemy import text

from app.db import engine
from app.main import app


def _reset_db():
    # Keep it simple: truncate known tables (CASCADE handles FK ordering).
    with engine.begin() as conn:
        conn.execute(text("TRUNCATE TABLE prompt_versions, prompts CASCADE"))


def test_prompt_crud_happy_path():
    _reset_db()
    client = TestClient(app)

    # Create prompt (also creates v1)
    r = client.post(
        "/api/prompts",
        json={
            "name": "support_reply",
            "description": "Tone + structure for support",
            "content": "You are helpful...",
            "parameters": {"temperature": 0.2},
        },
    )
    assert r.status_code == 201, r.text
    created = r.json()
    assert created["name"] == "support_reply"
    assert len(created["versions"]) == 1
    assert created["versions"][0]["version"] == 1

    prompt_id = created["id"]

    # List prompts includes latest version
    r = client.get("/api/prompts")
    assert r.status_code == 200
    prompts = r.json()
    assert len(prompts) == 1
    assert prompts[0]["id"] == prompt_id
    assert prompts[0]["latest_version"]["version"] == 1

    # Create version 2
    r = client.post(
        f"/api/prompts/{prompt_id}/versions",
        json={"content": "You are VERY helpful...", "parameters": {"temperature": 0.1}},
    )
    assert r.status_code == 201, r.text
    v2 = r.json()
    assert v2["version"] == 2

    # Get prompt detail returns versions desc
    r = client.get(f"/api/prompts/{prompt_id}")
    assert r.status_code == 200
    detail = r.json()
    assert [v["version"] for v in detail["versions"]] == [2, 1]

    # Patch metadata
    r = client.patch(f"/api/prompts/{prompt_id}", json={"description": "Updated"})
    assert r.status_code == 200
    assert r.json()["description"] == "Updated"

    # Delete
    r = client.delete(f"/api/prompts/{prompt_id}")
    assert r.status_code == 204

    # Now list is empty
    r = client.get("/api/prompts")
    assert r.status_code == 200
    assert r.json() == []


def test_create_prompt_duplicate_name_is_409():
    _reset_db()
    client = TestClient(app)

    payload = {
        "name": "dup",
        "description": None,
        "content": "v1",
        "parameters": None,
    }

    r1 = client.post("/api/prompts", json=payload)
    assert r1.status_code == 201

    r2 = client.post("/api/prompts", json=payload)
    assert r2.status_code == 409
