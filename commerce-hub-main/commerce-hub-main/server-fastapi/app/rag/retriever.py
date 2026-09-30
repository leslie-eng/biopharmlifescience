"""Lexical TF-IDF retriever, ported 1:1 from server/src/rag/retriever.js."""

import math
import re

from .knowledge import CHAT_KNOWLEDGE_CHUNKS

STOP_WORDS = {
    "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "of", "is", "are",
    "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did", "will",
    "would", "could", "should", "may", "might", "can", "about", "what", "how", "when", "where",
    "who", "which", "this", "that", "these", "those", "i", "you", "your", "our", "we", "they",
    "it", "its", "with", "from", "as", "by", "not", "no", "yes", "me", "my", "tell", "please",
}

_TOKEN_RE = re.compile(r"[^a-z0-9\s+]")


def tokenize(text: str) -> list[str]:
    cleaned = _TOKEN_RE.sub(" ", text.lower())
    return [t for t in cleaned.split() if len(t) > 1 and t not in STOP_WORDS]


def _term_frequency(tokens: list[str]) -> dict[str, int]:
    tf: dict[str, int] = {}
    for t in tokens:
        tf[t] = tf.get(t, 0) + 1
    return tf


def _build_idf(docs: list[dict]) -> dict[str, float]:
    df: dict[str, int] = {}
    n = len(docs)
    for doc in docs:
        seen = set(tokenize(doc["text"] + " " + doc["title"]))
        for term in seen:
            df[term] = df.get(term, 0) + 1
    return {term: math.log((n + 1) / (count + 1)) + 1 for term, count in df.items()}


def _vectorize(tf: dict[str, int], idf: dict[str, float]) -> tuple[dict[str, float], float]:
    vec: dict[str, float] = {}
    norm = 0.0
    for term, freq in tf.items():
        w = freq * idf.get(term, 1)
        vec[term] = w
        norm += w * w
    return vec, (math.sqrt(norm) or 1.0)


def _cosine(vec_a: dict[str, float], norm_a: float, vec_b: dict[str, float], norm_b: float) -> float:
    smaller, larger = (vec_a, vec_b) if len(vec_a) < len(vec_b) else (vec_b, vec_a)
    dot = 0.0
    for term, w in smaller.items():
        w2 = larger.get(term)
        if w2:
            dot += w * w2
    return dot / (norm_a * norm_b)


_IDF = _build_idf(CHAT_KNOWLEDGE_CHUNKS)
_CHUNK_VECTORS = []
for _chunk in CHAT_KNOWLEDGE_CHUNKS:
    _tokens = tokenize(f"{_chunk['title']} {_chunk['text']}")
    _vec, _norm = _vectorize(_term_frequency(_tokens), _IDF)
    _CHUNK_VECTORS.append({"chunk": _chunk, "vec": _vec, "norm": _norm})


def retrieve_chunks(query: str, top_k: int = 4) -> list[dict]:
    q_tokens = tokenize(query)
    if not q_tokens:
        return [
            {"chunk": chunk, "score": 1 - i * 0.1}
            for i, chunk in enumerate(CHAT_KNOWLEDGE_CHUNKS[:top_k])
        ]

    q_vec, q_norm = _vectorize(_term_frequency(q_tokens), _IDF)
    scored = [
        {"chunk": entry["chunk"], "score": _cosine(entry["vec"], entry["norm"], q_vec, q_norm)}
        for entry in _CHUNK_VECTORS
    ]
    scored = [r for r in scored if r["score"] > 0]
    scored.sort(key=lambda r: r["score"], reverse=True)

    if not scored:
        return [
            {"chunk": chunk, "score": 0.5 - i * 0.05}
            for i, chunk in enumerate(CHAT_KNOWLEDGE_CHUNKS[:top_k])
        ]

    return scored[:top_k]


def build_context(retrieved: list[dict]) -> str:
    return "\n\n".join(f"[{i + 1}] {r['chunk']['title']}\n{r['chunk']['text']}" for i, r in enumerate(retrieved))
