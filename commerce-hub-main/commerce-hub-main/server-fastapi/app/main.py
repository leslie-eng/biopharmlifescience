import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from starlette.exceptions import HTTPException as StarletteHTTPException

from .config import settings
from .database import engine
from .routers import auth, chat, clients, dashboard, expenses, orders, products, stock_interest, uploads

logger = logging.getLogger("biolinks_api")

app = FastAPI(title="Biolinks Commerce API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Error envelope: every error response is {"error": "<message>"} ---------------
# The React frontend's api() helper (src/lib/api.ts) reads `data.error` on any non-2xx
# response. FastAPI's defaults use {"detail": ...}, so these handlers translate every
# error path into the same {"error": ...} shape the old Express errorHandler produced.
#
# Registered on Starlette's base HTTPException (not fastapi.HTTPException, which is a
# subclass) so this also catches the exceptions Starlette's own router raises directly
# for cases our code never touches — an unmatched route (404) or a route matched with
# the wrong HTTP method (405) — which would otherwise bypass this handler entirely and
# fall through to Starlette's default {"detail": ...} response.


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(_request: Request, exc: StarletteHTTPException):
    return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_request: Request, exc: RequestValidationError):
    first = exc.errors()[0] if exc.errors() else None
    message = first.get("msg", "Invalid request") if first else "Invalid request"
    return JSONResponse(status_code=422, content={"error": message})


@app.exception_handler(Exception)
async def unhandled_exception_handler(_request: Request, exc: Exception):
    logger.exception("Unhandled error", exc_info=exc)
    return JSONResponse(status_code=500, content={"error": "Internal server error"})


# --- Static uploads (mirrors `app.use("/uploads", express.static(uploadRoot))`) -----
app.mount("/uploads", StaticFiles(directory=str(settings.UPLOAD_DIR)), name="uploads")


@app.get("/api/health")
def health():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "ok", "service": "biolinks-commerce-api", "database": "connected"}
    except Exception:
        return JSONResponse(
            status_code=503,
            content={"status": "degraded", "service": "biolinks-commerce-api", "database": "disconnected"},
        )


app.include_router(auth.router)
app.include_router(products.router)
app.include_router(clients.router)
app.include_router(orders.router)
app.include_router(expenses.router)
app.include_router(stock_interest.router)
app.include_router(uploads.router)
app.include_router(dashboard.router)
app.include_router(chat.router)


# --- Optional: serve the built React frontend, mirroring STATIC_DIR in the old server ---
# In practice, cPanel typically serves the built frontend directly via Apache (a
# separate static vhost) while this Python app only answers /api and /uploads — so
# STATIC_DIR is usually left unset in production. It's kept for parity with the old
# server and for local single-process testing.
if settings.STATIC_DIR:
    from pathlib import Path

    from fastapi.responses import FileResponse

    static_dir = Path(settings.STATIC_DIR).resolve()
    index_file = static_dir / "index.html"
    if static_dir.is_dir():
        app.mount("/assets", StaticFiles(directory=str(static_dir / "assets")), name="frontend-assets")

        @app.get("/{full_path:path}")
        def spa_fallback(full_path: str):
            # Mirrors the Express catch-all: any non-/api, non-/uploads path serves
            # index.html so client-side routing (react-router) can take over.
            candidate = static_dir / full_path
            if full_path and candidate.is_file():
                return FileResponse(candidate)
            return FileResponse(index_file)

        logger.info("Serving frontend from %s", static_dir)
