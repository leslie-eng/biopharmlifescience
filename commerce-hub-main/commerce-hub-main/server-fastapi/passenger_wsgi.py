"""cPanel/Passenger entrypoint.

cPanel's "Setup Python App" runs apps through Phusion Passenger, which speaks WSGI
(synchronous request/response) — not ASGI, which is what FastAPI/Starlette natively
speak. `a2wsgi.ASGIMiddleware` bridges the two: it wraps our ASGI `app` object so
Passenger can call it exactly like a Flask/Django app.

This is why app/routers/*.py use plain `def` handlers (not `async def`) throughout —
Starlette runs sync handlers in a worker thread pool, which works cleanly under this
adapter. Don't switch handlers to `async def` without also switching hosting off
Passenger; async code does not get a running event loop here.

Caveats of running FastAPI under Passenger this way (irrelevant to this app today,
but worth knowing if requirements change): no WebSockets, and no true HTTP streaming
(Server-Sent Events, chunked LLM token streaming) — every response is buffered into
one WSGI response. Nothing in this backend currently needs either.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from a2wsgi import ASGIMiddleware  # noqa: E402

from app.main import app as _asgi_app  # noqa: E402

application = ASGIMiddleware(_asgi_app)
