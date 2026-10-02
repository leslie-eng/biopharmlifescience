import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.routes import auth, chat, clients, dashboard, expenses, orders, products, uploads
from app.core.config import settings
from app.core.database import engine
from app.core.errors import AppError, default_code

logger = logging.getLogger("biolinks_api")

if settings.SENTRY_DSN:
    import sentry_sdk

    # send_default_pii=False: no request bodies, cookies, headers or IPs (Kenya DPA; docs/release-scope.md).
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        environment=settings.SENTRY_ENVIRONMENT,
        send_default_pii=False,
        traces_sample_rate=0.0,
    )

app = FastAPI(
    title="Biolinks Commerce API",
    version="1.0.0",
    docs_url="/docs" if settings.EXPOSE_API_DOCS else None,
    redoc_url=None,
    openapi_url="/openapi.json" if settings.EXPOSE_API_DOCS else None,
)

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

# --- Error envelope: every error response is {"error": "<message>", "code": "<CODE>"} --
# See app/core/errors.py. The frontend's HTTP client (src/services/http.ts) shows `error`
# and can branch on `code`. FastAPI's defaults use {"detail": ...}, so these handlers
# translate every error path into this one shape.
#
# Registered on Starlette's base HTTPException (not fastapi.HTTPException, which is a
# subclass) so this also catches the exceptions Starlette's own router raises directly
# for cases our code never touches — an unmatched route (404) or a route matched with
# the wrong HTTP method (405) — which would otherwise bypass this handler entirely and
# fall through to Starlette's default {"detail": ...} response.


def _error(status_code: int, message: str, code: str, headers: dict | None = None) -> JSONResponse:
    return JSONResponse(status_code=status_code, content={"error": message, "code": code}, headers=headers)


@app.exception_handler(AppError)
async def app_error_handler(_request: Request, exc: AppError):
    return _error(exc.status_code, exc.message, exc.code, exc.headers)


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(_request: Request, exc: StarletteHTTPException):
    return _error(exc.status_code, exc.detail, default_code(exc.status_code), getattr(exc, "headers", None))


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_request: Request, exc: RequestValidationError):
    first = exc.errors()[0] if exc.errors() else None
    message = first.get("msg", "Invalid request") if first else "Invalid request"
    return _error(422, message, "VALIDATION_ERROR")


@app.exception_handler(Exception)
async def unhandled_exception_handler(_request: Request, exc: Exception):
    logger.exception("Unhandled error", exc_info=exc)
    return _error(500, "Internal server error", "INTERNAL_ERROR")


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
