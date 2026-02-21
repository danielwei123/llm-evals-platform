from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class RunCreateIn(BaseModel):
    prompt_name: str = Field(..., min_length=1, max_length=200)
    input: dict | None = None


class RunOut(BaseModel):
    id: uuid.UUID
    prompt_id: uuid.UUID
    prompt_version: int
    status: str
    input: dict | None
    output: str | None
    error: str | None
    created_at: datetime
    started_at: datetime | None
    finished_at: datetime | None

    model_config = {"from_attributes": True}
