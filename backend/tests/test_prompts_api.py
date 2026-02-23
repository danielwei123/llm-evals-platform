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
        conn.execute(text("TRUNCATE TABLE runs, prompt_versions, prompts CASCADE"))


def test_prompt_crud_happy_path():
    _reset_db()
    client = TestClient(app)

    # Create prompt (also creates v1)
    r = client.post(
        "/api/prompts",
        json={
            "name": "support_reply",
            "description": "Tone + structure for support",
            "tags": ["Support", "tone"],
            "content": "You are helpful...",
            "parameters": {"temperature": 0.2},
        },
    )
    assert r.status_code == 201, r.text
    created = r.json()
    assert created["name"] == "support_reply"
    assert created["active_version"] == 1
    assert sorted(created["tags"]) == ["support", "tone"]
    assert len(created["versions"]) == 1
    assert created["versions"][0]["version"] == 1

    prompt_id = created["id"]

    # List prompts includes latest version
    r = client.get("/api/prompts")
    assert r.status_code == 200
    prompts = r.json()
    assert len(prompts) == 1
    assert prompts[0]["id"] == prompt_id
    assert prompts[0]["active_version"] == 1
    assert sorted(prompts[0]["tags"]) == ["support", "tone"]
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
    assert detail["active_version"] == 1
    assert [v["version"] for v in detail["versions"]] == [2, 1]

    # Activate v2
    r = client.post(f"/api/prompts/{prompt_id}/activate", json={"version": 2})
    assert r.status_code == 200, r.text
    activated = r.json()
    assert activated["active_version"] == 2

    # Patch metadata (including tags)
    r = client.patch(
        f"/api/prompts/{prompt_id}",
        json={"description": "Updated", "tags": ["support", "beta"]},
    )
    assert r.status_code == 200
    patched = r.json()
    assert patched["description"] == "Updated"
    assert sorted(patched["tags"]) == ["beta", "support"]

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


def test_list_prompts_search_and_pagination():
    _reset_db()
    client = TestClient(app)

    for name in ["alpha", "beta", "gamma", "alphabet"]:
        r = client.post(
            "/api/prompts",
            json={
                "name": name,
                "description": f"desc for {name}",
                "content": f"content for {name}",
                "parameters": None,
            },
        )
        assert r.status_code == 201, r.text

    # Search by substring in name
    r = client.get("/api/prompts", params={"q": "alph"})
    assert r.status_code == 200
    names = sorted([p["name"] for p in r.json()])
    assert names == ["alpha", "alphabet"]

    # Pagination: stable ordering is newest-first by created_at
    r1 = client.get("/api/prompts", params={"limit": 2, "offset": 0})
    r2 = client.get("/api/prompts", params={"limit": 2, "offset": 2})
    assert r1.status_code == 200 and r2.status_code == 200
    assert len(r1.json()) == 2
    assert len(r2.json()) == 2
    assert {p["name"] for p in r1.json()}.isdisjoint({p["name"] for p in r2.json()})
