"""In-memory sliding-window rate limiting.

Kept in process memory, which is correct only while the API runs as a single instance
(see docs/adr/0002-vercel-frontend-render-api.md). Moving to several instances means
moving this state to a shared store.
"""

import threading
import time
from collections import defaultdict, deque


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
            events = self._events[key]
            self._prune(events, now)
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
