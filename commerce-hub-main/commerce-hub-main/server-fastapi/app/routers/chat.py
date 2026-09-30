import time

from fastapi import APIRouter, HTTPException, Request

from ..rag.generate import generate_answer
from ..rag.retriever import retrieve_chunks
from ..schemas import ChatRequest, ChatResponse, ChatSource

router = APIRouter(prefix="/api/chat", tags=["chat"])

# In-memory per-IP rate limit, ported from server/src/routes/chat.js.
# NOTE: this resets per worker process, same limitation the original single-process
# Node server had implicitly — if you later run multiple Passenger/uvicorn workers,
# move this to Redis or a DB table for a shared limit.
_RATE_MAP: dict[str, dict[str, float]] = {}
RATE_WINDOW_SECONDS = 60
RATE_MAX = 20


def _check_rate(ip: str) -> bool:
    now = time.monotonic()
    entry = _RATE_MAP.get(ip)
    if not entry or now - entry["start"] > RATE_WINDOW_SECONDS:
        entry = {"start": now, "count": 0}
        _RATE_MAP[ip] = entry
    entry["count"] += 1
    return entry["count"] <= RATE_MAX


@router.post("", response_model=ChatResponse)
def chat(body: ChatRequest, request: Request):
    ip = request.client.host if request.client else "unknown"
    if not _check_rate(ip):
        raise HTTPException(status_code=429, detail="Too many messages. Please wait a moment and try again.")

    message = body.message.strip()
    if not message or len(message) > 2000:
        raise HTTPException(status_code=400, detail="Message is required (max 2000 characters).")

    history = [m.model_dump() for m in body.history[-10:]]

    retrieved = retrieve_chunks(message, 4)
    result = generate_answer(message, retrieved, history)

    return ChatResponse(
        reply=result["answer"],
        sources=[ChatSource(id=r["chunk"]["id"], title=r["chunk"]["title"]) for r in retrieved],
        mode=result["mode"],
    )
