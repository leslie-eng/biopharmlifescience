from fastapi import APIRouter, HTTPException, Request

from ..rag.generate import generate_answer
from ..ratelimit import chat_limiter, client_ip
from ..rag.retriever import retrieve_chunks
from ..schemas import ChatRequest, ChatResponse, ChatSource

router = APIRouter(prefix="/api/chat", tags=["chat"])

@router.post("", response_model=ChatResponse)
def chat(body: ChatRequest, request: Request):
    ip = client_ip(request)
    wait = chat_limiter.retry_after(ip)
    if wait is not None:
        raise HTTPException(
            status_code=429,
            detail="Too many messages. Please wait a moment and try again.",
            headers={"Retry-After": str(wait)},
        )
    chat_limiter.record(ip)

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
