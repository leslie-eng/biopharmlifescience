"""The API's error contract.

Every error response is `{"error": "<message for people>", "code": "<MACHINE_CODE>"}`.
`error` is what the frontend shows; `code` is stable and safe to branch on. Services raise
AppError for failures the caller should hear about; anything else becomes a generic 500.
"""

from http import HTTPStatus

# Code used when a plain HTTPException (from FastAPI, Starlette or a route) carries no code.
DEFAULT_CODES = {
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    405: "METHOD_NOT_ALLOWED",
    413: "PAYLOAD_TOO_LARGE",
    422: "VALIDATION_ERROR",
    429: "RATE_LIMITED",
    500: "INTERNAL_ERROR",
}


def default_code(status_code: int) -> str:
    return DEFAULT_CODES.get(status_code) or HTTPStatus(status_code).name


class AppError(Exception):
    def __init__(self, status_code: int, message: str, code: str, headers: dict[str, str] | None = None):
        super().__init__(message)
        self.status_code = status_code
        self.message = message
        self.code = code
        self.headers = headers
