import os

os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+psycopg://llm_evals:llm_evals@localhost:5433/llm_evals_test",
)

from fastapi.testclient import TestClient
from sqlalchemy import text

from app.db import engine
from app.main import app


def _reset_db():
    with engine.begin() as conn:
        conn.execute(text("TRUNCATE TABLE runs, prompt_tags, tags, prompt_versions, prompts CASCADE"))


def test_list_tags_returns_prompt_counts_and_sorts_desc():
    _reset_db()
    client = TestClient(app)

    # prompt with tags a,b
    r = client.post(
        "/api/prompts",
        json={
            "name": "p1",
            "description": None,
            "tags": ["a", "b"],
            "content": "v1",
            "parameters": None,
        },
    )
    assert r.status_code == 201, r.text

    # prompt with tag a only
    r = client.post(
        "/api/prompts",
        json={
            "name": "p2",
            "description": None,
            "tags": ["a"],
            "content": "v1",
            "parameters": None,
        },
    )
    assert r.status_code == 201, r.text

    r = client.get("/api/tags")
    assert r.status_code == 200, r.text
    tags = r.json()

    # a appears in 2 prompts, b appears in 1
    assert tags[0]["name"] == "a"
    assert tags[0]["prompt_count"] == 2
    assert tags[1]["name"] == "b"
    assert tags[1]["prompt_count"] == 1


def test_list_tags_supports_search_q():
    _reset_db()
    client = TestClient(app)

    r = client.post(
        "/api/prompts",
        json={
            "name": "p1",
            "description": None,
            "tags": ["support", "prod"],
            "content": "v1",
            "parameters": None,
        },
    )
    assert r.status_code == 201, r.text

    r = client.get("/api/tags", params={"q": "supp"})
    assert r.status_code == 200
    names = [t["name"] for t in r.json()]
    assert names == ["support"]
