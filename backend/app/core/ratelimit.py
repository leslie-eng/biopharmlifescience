"""In-memory sliding-window rate limiting.

Kept in process memory, which is correct only while the API runs as a single instance
(see docs/adr/0002-vercel-frontend-render-api.md). Moving to several instances means
moving this state to a shared store.
"""

import threading
import time
from collections import defaultdict, deque

from fastapi import Request

from app.core.config import settings


def client_ip(request: Request) -> str:
    """The caller's IP, as seen by our edge.

    Render sits behind Cloudflare, which overwrites CF-Connecting-IP with the address that
    connected to it, so that header can't be forged by the caller. Failing that, the last
    X-Forwarded-For entry is the one our proxy appended; earlier entries are caller-supplied.
    Verify on staging before launch (docs/deploy.md).
    """
    if settings.TRUST_PROXY:
        connecting = request.headers.get("cf-connecting-ip", "").strip()
        if connecting:
            return connecting
        forwarded = request.headers.get("x-forwarded-for", "")
        hops = [h.strip() for h in forwarded.split(",") if h.strip()]
        if hops:
            return hops[-1]
    return request.client.host if request.client else "unknown"


class SlidingWindowLimiter:
    def __init__(self, max_events: int, window_seconds: float):
        self.max_events = max_events
        self.window_seconds = window_seconds
        self._events: dict[str, deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    def _prune(self, events: deque[float], now: float) -> None:
        while events and now - events[0] >= self.window_seconds:
            events.popleft()

    def retry_after(self, key: str) -> int | None:
        """Seconds until `key` may try again, or None if it isn't currently blocked."""
        now = time.monotonic()
        with self._lock:
            events = self._events.get(key)
            if events is None:
                return None
            self._prune(events, now)
            if not events:
                del self._events[key]  # keep the map from growing with every IP ever seen
                return None
            if len(events) < self.max_events:
                return None
            return max(1, int(self.window_seconds - (now - events[0])) + 1)

    def record(self, key: str) -> None:
        now = time.monotonic()
        with self._lock:
            events = self._events[key]
            self._prune(events, now)
            events.append(now)

    def reset(self) -> None:
        with self._lock:
            self._events.clear()


# Failed login attempts per client IP.
login_limiter = SlidingWindowLimiter(max_events=5, window_seconds=15 * 60)

# Wrong setup/reset tokens per client IP (app/api/routes/setup.py).
setup_limiter = SlidingWindowLimiter(max_events=5, window_seconds=15 * 60)

# Chatbot messages per client IP.
chat_limiter = SlidingWindowLimiter(max_events=20, window_seconds=60)
