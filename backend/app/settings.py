from pydantic import BaseModel
import os


class Settings(BaseModel):
    database_url: str = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg://llm_evals:llm_evals@localhost:5432/llm_evals",
    )


settings = Settings()
