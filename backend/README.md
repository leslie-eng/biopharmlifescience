# Biolinks API (backend)

FastAPI + SQLAlchemy 2 + PostgreSQL 17, migrated with Alembic. Deployed to Render (`render.yaml` at the repo root). Setup steps are in the root `README.md`.

## Layout

```text
app/
  main.py            app factory: middleware, CORS, error handlers, routers, /api/health
  cli.py             operator commands: create-user, set-password
  api/
    deps.py          require_auth, require_staff, get_optional_user_id
    routes/          one module per resource; thin: validate, check access, call a service
  services/
    auth.py          sign-in, sessions, password changes, role lookups
    orders.py        recording a POS sale (catalog prices, row locks, stock)
    reports.py       dashboard overview and sales reports
    assistant/       the website chatbot (retrieval over knowledge.py, optional OpenAI)
  core/
    config.py        settings from environment variables
    database.py      engine, session factory, get_db
    security.py      JWT signing, bcrypt hashing, password rules
    errors.py        AppError and the error contract
    ratelimit.py     in-memory sliding-window limits (sign-in, chatbot)
  models.py          SQLAlchemy tables
  schemas.py         Pydantic request/response models
  utils.py           ids, order numbers, slugs
migrations/          Alembic (0001 baseline, 0002 must_change_password)
tests/               pytest against a real Postgres and the real app
```

Simple create/read/update/delete endpoints (products, clients, expenses, order status) query the database directly in their route module. Logic with rules worth testing on its own lives in `services/`. There's no separate repository layer: the SQLAlchemy `Session` already plays that role.

## Commands

```bash
.venv/Scripts/python -m uvicorn app.main:app --reload --port 3001           # dev server
.venv/Scripts/python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT    # production (Render)
.venv/Scripts/python -m alembic upgrade head                                # apply migrations
.venv/Scripts/python -m pytest                                              # tests; needs `docker compose up -d db-test`
.venv/Scripts/python -m app.cli create-user --email a@b.c --role staff --temporary
.venv/Scripts/python -m app.cli set-password --email a@b.c --temporary
```

The CLI prompts for passwords (or reads `--password-env VAR`), so they stay out of shell history. `--temporary` makes the user choose a new password at first sign-in; until they do, every staff endpoint answers 403 `PASSWORD_CHANGE_REQUIRED`.

## API

Access: **public** = anyone; **optional** = anyone, but staff get extra fields (product cost) and inactive products; **signed-in** = any valid token; **staff** = `staff` or `admin` role and no pending temporary password.

| Method | Path | Access | Body | Success |
|---|---|---|---|---|
| GET | `/` | public | | 200 `{service, health, readiness}` |
| GET | `/health` | public | | 200 `{status: "healthy"}`; liveness only, no database |
| GET | `/api/health` | public | | 200 `{status, service, database}`; 503 if the database is down |
| POST | `/api/auth/login` | public (5 failures / 15 min per IP) | `{email, password}` | 200 `{token, user, roles, must_change_password}` |
| POST | `/api/auth/token` | public (shares the login limit) | form `username` (email), `password` | 200 `{access_token, token_type}`: Swagger's **Authorize** button |
| GET | `/api/auth/me` | signed-in | | 200 `{user, roles, must_change_password}` |
| POST | `/api/auth/change-password` | signed-in | `{current_password, new_password}` | 200, same as login (fresh token) |
| POST | `/api/auth/logout` | public | | 200 `{ok}`; the client drops its token |
| GET | `/api/products?active=&staff=` | optional | | 200 product list |
| GET | `/api/products/{id}` | optional | | 200 product |
| POST | `/api/products` | staff | `ProductCreate` | 201 product |
| PATCH | `/api/products/{id}` | staff | `ProductUpdate` | 200 product |
| DELETE | `/api/products/{id}` | staff | | 200 `{ok}`; also deletes its image from the bucket |
| POST | `/api/products/{id}/image` | staff | multipart `file` (JPEG/PNG/WebP by content, 5 MB) | 200 product; replaces and deletes the old image |
| DELETE | `/api/products/{id}/image` | staff | | 200 product |
| GET | `/api/public/products?page=&page_size=&category=&q=` | public | | 200 `{items, total, page, page_size}`: active and published products, storefront fields only |
| GET | `/api/public/products/{id_or_slug}` | public | | 200 storefront product, or 404 |
| GET | `/api/public/categories` | public | | 200 `[{name, count}]` |
| GET | `/api/clients` | staff | | 200 client list |
| POST | `/api/clients` | staff | `ClientCreate` | 201 client |
| PATCH | `/api/clients/{id}` | staff | `ClientUpdate` | 200 client |
| DELETE | `/api/clients/{id}` | staff | | 200 `{ok}` |
| GET | `/api/orders` | staff | | 200 order list |
| GET | `/api/orders/{id}/items` | staff | | 200 order lines |
| PATCH | `/api/orders/{id}` | staff | `{status}` | 200 order |
| POST | `/api/orders` | staff | `{order, items: [{product_id, quantity}]}` | 201 order (POS sale) |
| GET | `/api/expenses` | staff | | 200 expense list |
| POST | `/api/expenses` | staff | `ExpenseCreate` | 201 expense |
| DELETE | `/api/expenses/{id}` | staff | | 200 `{ok}` |
| GET | `/api/dashboard/overview` | staff | | 200 `{stats, recentOrders}` |
| GET | `/api/dashboard/reports?since=` | staff | | 200 `{orders, order_items}` |
| POST | `/api/chat` | public (20 / min per IP) | `{message, history}` | 200 `{reply, sources, mode}` |
| POST | `/api/setup/admin` | needs `SETUP_TOKEN` (5 wrong / 15 min per IP) | `{username, password, setup_token}` | 201 `{username, roles}`; 409 once any admin exists; 503 if `SETUP_TOKEN` unset |
| POST | `/api/setup/reset-admin-password` | needs `ADMIN_RESET_TOKEN` | `{username, new_password, reset_token}` | 200 `{ok}`; 503 if `ADMIN_RESET_TOKEN` unset |
| POST | `/api/admin/change-username` | admin | `{current_password, new_username}` | 200, same as login (fresh token) |

Product images live in the private bucket (`AWS_ENDPOINT_URL_S3`, `S3_BUCKET_NAME`) under `products/{id}/{uuid}.{ext}`; responses carry a presigned `image_url` valid for an hour. `/uploads/...` still serves images from before the bucket (the deprecated `image_url` column). The body models are in `app/schemas.py`.

### Errors

Every error response is `{"error": "<message for people>", "code": "<MACHINE_CODE>"}` (`app/core/errors.py`). Stack traces, SQL and paths never reach the client; unexpected failures are logged and answered with 500 `INTERNAL_ERROR`.

| Code | Status | When |
|---|---|---|
| `AUTH_REQUIRED`, `SESSION_INVALID` | 401 | no token, or an invalid or expired one |
| `INVALID_CREDENTIALS`, `CURRENT_PASSWORD_INCORRECT` | 401 | wrong password (counts toward the sign-in limit) |
| `STAFF_ONLY`, `ADMIN_ONLY`, `PASSWORD_CHANGE_REQUIRED` | 403 | not staff; not admin; temporary password not yet changed |
| `SETUP_DISABLED`, `RESET_DISABLED` | 503 | the setup/reset token isn't set (or is under 32 characters) |
| `SETUP_TOKEN_INVALID`, `RESET_TOKEN_INVALID` | 403 | wrong setup/reset token |
| `ADMIN_EXISTS`, `USERNAME_TAKEN` | 409 | setup after an admin exists; username already used |
| `SLUG_TAKEN`, `CLIENT_EMAIL_TAKEN` | 409 | product slug or client email already used |
| `IMAGE_TYPE_NOT_ALLOWED`, `IMAGE_TOO_LARGE` | 400, 413 | product image is not JPEG/PNG/WebP, or over 5 MB |
| `IMAGE_STORAGE_FAILED` | 502 | the image bucket refused the upload |
| `ADMIN_NOT_FOUND` | 404 | reset for an email that isn't an admin |
| `WEAK_PASSWORD`, `PASSWORD_UNCHANGED`, `CREDENTIALS_REQUIRED` | 400 | password rules |
| `EMPTY_ORDER`, `CUSTOMER_NAME_REQUIRED`, `PRODUCT_NOT_FOUND`, `PRODUCT_INACTIVE`, `INSUFFICIENT_STOCK` | 400 | POS sale rejected |
| `RATE_LIMITED` | 429 | too many attempts; see `Retry-After` |
| `VALIDATION_ERROR` | 422 | malformed request body |
| `BAD_REQUEST`, `NOT_FOUND`, … | 4xx | generic, derived from the status |

## Configuration

Every setting comes from the environment (`app/core/config.py`); `backend/.env.example` documents each one. The app refuses to start without a `JWT_SECRET` of at least 32 characters. CORS allows only the origins listed in `CORS_ORIGIN`: production is `https://biopharmlifescience.co.ke` and `https://www.biopharmlifescience.co.ke`; local dev is `http://localhost:8080`.
