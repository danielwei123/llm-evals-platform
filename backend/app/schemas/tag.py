from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel
from pydantic.config import ConfigDict


class TagOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str
    created_at: datetime
    prompt_count: int
