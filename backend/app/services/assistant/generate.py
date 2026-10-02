"""Ported 1:1 from server/src/rag/generate.js."""

import re

import httpx

from app.core.config import settings
from app.services.assistant.retriever import build_context

SYSTEM_PROMPT = """You are the Biopharmlifescience East Africa website assistant. You help visitors learn about Biopharmlifescience's managed medical supply services, proactive inventory model, product catalog, and how to get in touch.

Rules:
- Answer ONLY using the provided context. If the context does not contain the answer, say you are not sure and suggest booking a free facility assessment or contacting Biopharmlifescience via WhatsApp (+254 714 647 972) or email biopharmlifescience@gmail.com.
- Be concise, professional, and warm. Use short paragraphs or bullet points when helpful.
- Do not invent prices, stock levels, or policies not in the context.
- You are not a medical advisor; do not give clinical treatment advice."""


def _fallback_answer(context: str) -> str:
    intro = "Here is what I can share about Biopharmlifescience East Africa based on our website information:"
    blocks = context.split("\n\n")[:3]
    body = "\n\n".join(re.sub(r"^\[\d+\]\s*", "", b, count=1).strip() for b in blocks) if context else ""
    outro = (
        "\n\nFor a tailored plan or product pricing, please book a free facility assessment "
        "or message us on WhatsApp (+254 714 647 972)."
    )
    if not body.strip():
        return (
            "I'd be happy to help you learn about Biopharmlifescience's managed supply services "
            "for clinics. Try asking about our proactive model, product categories, or how to book "
            "a facility assessment. You can also reach us at +254 714 647 972 or "
            "biopharmlifescience@gmail.com."
        )
    return f"{intro}\n\n{body}{outro}"


def _generate_with_openai(query: str, context: str, history: list[dict]) -> str | None:
    if not settings.OPENAI_API_KEY:
        return None

    messages = (
        [{"role": "system", "content": f"{SYSTEM_PROMPT}\n\n---\nContext:\n{context}"}]
        + [{"role": m["role"], "content": m["content"]} for m in history[-6:]]
        + [{"role": "user", "content": query}]
    )

    try:
        res = httpx.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": settings.OPENAI_CHAT_MODEL,
                "messages": messages,
                "temperature": 0.3,
                "max_tokens": 600,
            },
            timeout=30.0,
        )
    except httpx.HTTPError as err:
        print(f"OpenAI chat request failed: {err}")
        return None

    if res.status_code >= 400:
        print(f"OpenAI chat error: {res.status_code} {res.text}")
        return None

    data = res.json()
    choices = data.get("choices") or []
    if not choices:
        return None
    content = (choices[0].get("message") or {}).get("content")
    return content.strip() if content else None


def generate_answer(query: str, retrieved: list[dict], history: list[dict] | None = None) -> dict:
    history = history or []
    context = build_context(retrieved)
    llm_answer = _generate_with_openai(query, context, history)
    if llm_answer:
        return {"answer": llm_answer, "mode": "openai"}
    return {"answer": _fallback_answer(context), "mode": "retrieval"}
