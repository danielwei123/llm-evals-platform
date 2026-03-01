from __future__ import annotations

import json
import os
import sys
import time
from datetime import datetime, timezone

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db import engine

# NOTE: This is intentionally a *minimal* local worker.
# It claims queued runs from Postgres and marks them succeeded/failed.
# The actual LLM execution is stubbed for now (see _execute_stub).


CLAIM_SQL = """
WITH next_run AS (
  SELECT id
  FROM runs
  WHERE status = 'queued'
  ORDER BY created_at ASC
  FOR UPDATE SKIP LOCKED
  LIMIT 1
)
UPDATE runs r
SET status = 'running',
    started_at = NOW(),
    error = NULL
FROM next_run
WHERE r.id = next_run.id
RETURNING r.id;
"""


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _execute_stub(*, prompt_content: str, run_input: dict | None) -> str:
    """Temporary execution path.

    We keep this deterministic + cheap while the Codex CLI integration is being built.
    """

    payload = {
        "note": "stub runner output (Codex integration pending)",
        "input": run_input,
    }
    return prompt_content.rstrip() + "\n\n---\n" + json.dumps(payload, indent=2, sort_keys=True)


def claim_one(db: Session) -> str | None:
    run_id = db.execute(text(CLAIM_SQL)).scalar_one_or_none()
    return str(run_id) if run_id is not None else None


def process_run(run_id: str) -> None:
    with Session(engine) as db, db.begin():
        row = db.execute(
            text(
                """
                SELECT r.id, r.input, r.prompt_id, r.prompt_version, pv.content
                FROM runs r
                JOIN prompt_versions pv
                  ON pv.prompt_id = r.prompt_id
                 AND pv.version = r.prompt_version
                WHERE r.id = :run_id
                """
            ),
            {"run_id": run_id},
        ).mappings().one_or_none()

        if row is None:
            # Run got deleted / doesn't exist.
            return

        try:
            output = _execute_stub(prompt_content=row["content"], run_input=row["input"])
            db.execute(
                text(
                    """
                    UPDATE runs
                    SET status = 'succeeded',
                        output = :output,
                        finished_at = NOW()
                    WHERE id = :run_id
                    """
                ),
                {"run_id": run_id, "output": output},
            )
        except Exception as e:  # pragma: no cover
            db.execute(
                text(
                    """
                    UPDATE runs
                    SET status = 'failed',
                        error = :error,
                        finished_at = NOW()
                    WHERE id = :run_id
                    """
                ),
                {"run_id": run_id, "error": f"{type(e).__name__}: {e}"},
            )


def run_once() -> str | None:
    with Session(engine) as db, db.begin():
        run_id = claim_one(db)

    if run_id is None:
        return None

    process_run(run_id)
    return run_id


def main() -> int:
    interval_s = float(os.environ.get("WORKER_POLL_INTERVAL_S", "1.0"))

    while True:
        run_id = run_once()
        if run_id is None:
            time.sleep(interval_s)
            continue

        # Keep stdout minimal but helpful in docker logs.
        print(f"[{_utcnow().isoformat()}] processed run {run_id}", flush=True)


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        sys.exit(0)
