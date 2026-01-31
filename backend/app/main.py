from fastapi import FastAPI

app = FastAPI(title="llm-evals-platform")


@app.get("/health")
def health():
    return {"status": "ok"}
