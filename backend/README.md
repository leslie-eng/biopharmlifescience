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
| GET | `/api/health` | public | | 200 `{status, service, database}`; 503 if the database is down |
| POST | `/api/auth/login` | public (5 failures / 15 min per IP) | `{email, password}` | 200 `{token, user, roles, must_change_password}` |
| GET | `/api/auth/me` | signed-in | | 200 `{user, roles, must_change_password}` |
| POST | `/api/auth/change-password` | signed-in | `{current_password, new_password}` | 200, same as login (fresh token) |
| POST | `/api/auth/logout` | public | | 200 `{ok}`; the client drops its token |
| GET | `/api/products?active=&staff=` | optional | | 200 product list |
| GET | `/api/products/{id}` | optional | | 200 product |
| POST | `/api/products` | staff | `ProductCreate` | 201 product |
| PATCH | `/api/products/{id}` | staff | `ProductUpdate` | 200 product |
| DELETE | `/api/products/{id}` | staff | | 200 `{ok}` |
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
| POST | `/api/uploads/product-image` | staff | multipart `file` (JPEG/PNG/WebP, 5 MB) | 200 `{url, path}` |
| POST | `/api/chat` | public (20 / min per IP) | `{message, history}` | 200 `{reply, sources, mode}` |

Uploaded images are served from `/uploads/catalog/<file>`. The body models are in `app/schemas.py`.

### Errors

Every error response is `{"error": "<message for people>", "code": "<MACHINE_CODE>"}` (`app/core/errors.py`). Stack traces, SQL and paths never reach the client; unexpected failures are logged and answered with 500 `INTERNAL_ERROR`.

| Code | Status | When |
|---|---|---|
| `AUTH_REQUIRED`, `SESSION_INVALID` | 401 | no token, or an invalid or expired one |
| `INVALID_CREDENTIALS`, `CURRENT_PASSWORD_INCORRECT` | 401 | wrong password (counts toward the sign-in limit) |
| `STAFF_ONLY`, `PASSWORD_CHANGE_REQUIRED` | 403 | not staff; temporary password not yet changed |
| `WEAK_PASSWORD`, `PASSWORD_UNCHANGED`, `CREDENTIALS_REQUIRED` | 400 | password rules |
| `EMPTY_ORDER`, `CUSTOMER_NAME_REQUIRED`, `PRODUCT_NOT_FOUND`, `PRODUCT_INACTIVE`, `INSUFFICIENT_STOCK` | 400 | POS sale rejected |
| `RATE_LIMITED` | 429 | too many attempts; see `Retry-After` |
| `VALIDATION_ERROR` | 422 | malformed request body |
| `BAD_REQUEST`, `NOT_FOUND`, … | 4xx | generic, derived from the status |

## Configuration

Every setting comes from the environment (`app/core/config.py`); `backend/.env.example` documents each one. The app refuses to start without a `JWT_SECRET` of at least 32 characters. CORS allows only the origins listed in `CORS_ORIGIN`: production is `https://biopharmlifescience.co.ke` and `https://www.biopharmlifescience.co.ke`; local dev is `http://localhost:8080`.
