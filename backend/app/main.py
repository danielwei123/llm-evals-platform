from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.prompts import router as prompts_router

app = FastAPI(title="llm-evals-platform")

# v0 CORS: allow local Next dev server. Tighten later.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(prompts_router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok"}
