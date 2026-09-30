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
from .routers import auth, chat, clients, dashboard, expenses, orders, products, uploads

logger = logging.getLogger("biolinks_api")

app = FastAPI(title="Biolinks Commerce API", version="1.0.0")

SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
}


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    for header, value in SECURITY_HEADERS.items():
        response.headers.setdefault(header, value)
    return response


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
    return JSONResponse(
        status_code=exc.status_code, content={"error": exc.detail}, headers=getattr(exc, "headers", None)
    )


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
app.include_router(uploads.router)
app.include_router(dashboard.router)
app.include_router(chat.router)
