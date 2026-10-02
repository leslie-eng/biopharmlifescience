# Biolinks

The Biopharmlifescience EA public website (catalog, Dhibiti model, Akiba calculator, facility assessment, chatbot) and the staff back-office (products, POS, orders, clients, finances, reports).

Production: <https://biopharmlifescience.co.ke> (frontend) and `https://api.biopharmlifescience.co.ke` (API).

## Architecture

```text
Browser ──> frontend/ (React SPA on Vercel)
              │  HTTPS + JSON, Bearer token
              ▼
            backend/  (FastAPI on Render) ──> PostgreSQL 17 (Render)
                                          └─> uploads disk (product images)
```

| Part | Stack | Lives in | Hosted on |
|---|---|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind/shadcn, TanStack Query | `frontend/` | Vercel |
| Backend | FastAPI, SQLAlchemy 2, Alembic, PyJWT, bcrypt | `backend/` | Render |
| Database | PostgreSQL 17 | schema in `backend/migrations/` | Render |

The frontend never touches the database; everything goes through the API.

```text
frontend/
  src/pages/        one file per route (public site + dashboard/)
  src/components/   UI: site/, dashboard/ (layouts, nav), ui/ (shadcn primitives)
  src/services/     the only code that calls the API (http.ts + one module per domain)
  src/types/api.ts  request/response shapes, matching backend/app/schemas.py
  src/contexts/     AuthContext: the signed-in user, roles, sign-in/out
  src/data/, lib/   static catalog data and client-side helpers (no API, no secrets)
backend/
  app/api/routes/   HTTP endpoints, one module per resource
  app/api/deps.py   who is calling: require_auth, require_staff
  app/services/     business logic: auth, POS sales, reports, the website assistant
  app/core/         config, database, security (JWT, bcrypt), errors, rate limits
  app/models.py     SQLAlchemy tables      app/schemas.py  request/response models
  app/cli.py        operator commands (create accounts, reset passwords)
  migrations/       Alembic migrations     tests/          pytest against real Postgres
docs/               deploy runbook, ADRs, release scope
docker-compose.yml  local Postgres for development and tests
```

## Local development

Prerequisites: Node 22, Python 3.13, Docker.

```bash
# 1. Databases
docker compose up -d db

# 2. Backend: http://localhost:3001
cd backend
python -m venv .venv
.venv/Scripts/pip install -r requirements-dev.txt     # macOS/Linux: .venv/bin/pip (and .venv/bin/ below)
cp .env.example .env                                   # then set JWT_SECRET (32+ characters)
.venv/Scripts/python -m alembic upgrade head
.venv/Scripts/python -m app.cli create-user --email you@example.com --role admin   # prompts for a password
.venv/Scripts/python -m uvicorn app.main:app --reload --port 3001

# 3. Frontend: http://localhost:8080 (Vite proxies /api and /uploads to :3001)
cd ../frontend
npm ci
npm run dev
```

Staff sign in at <http://localhost:8080/staff>.

## Environment variables

| Where | Variable | Purpose |
|---|---|---|
| backend | `DATABASE_URL` | PostgreSQL connection (required) |
| backend | `JWT_SECRET` | signs session tokens; 32+ characters, required |
| backend | `CORS_ORIGIN` | comma-separated frontend origins allowed to call the API |
| backend | `PUBLIC_URL` | the API's public origin, prefixed onto upload URLs |
| backend | `UPLOAD_DIR` | where product images are stored |
| backend | `TRUST_PROXY` | `true` behind Render's proxy (rate limits use the visitor IP) |
| backend | `JWT_EXPIRES_DAYS`, `OPENAI_API_KEY`, `OPENAI_CHAT_MODEL`, `SENTRY_DSN`, `SENTRY_ENVIRONMENT`, `EXPOSE_API_DOCS`, `PORT` | optional |
| frontend | `VITE_API_URL` | API origin; empty in local dev |
| frontend | `VITE_SENTRY_DSN`, `VITE_SENTRY_ENVIRONMENT`, `VITE_SHOW_HOME_DASHBOARD` | optional |

Templates: `backend/.env.example`, `frontend/.env.example`. Real `.env` files are git-ignored. Anything prefixed `VITE_` ends up in the public JS bundle, so never put a secret there.

## API and authentication

All endpoints are under `/api` (full list: `backend/README.md`). Staff sign in with `POST /api/auth/login` and send the returned JWT as `Authorization: Bearer <token>`. Dashboard endpoints require the `staff` or `admin` role, checked on every request. There's no public sign-up: accounts are created with `python -m app.cli`. Errors always look like `{"error": "<message>", "code": "<CODE>"}`.

## Testing

```bash
docker compose up -d db-test
cd backend && .venv/Scripts/python -m pytest       # API, against a real Postgres
cd frontend && npx tsc -p tsconfig.app.json --noEmit && npm test && npm run build
```

## Production deployment

See `docs/deploy.md` (Render blueprint in `render.yaml`, Vercel settings, DNS, staging checks, rollback).

## More docs

- `docs/release-scope.md`: what the launch includes
- `docs/adr/`: architecture decisions
- `GLOSSARY.md`: domain terms (Client, Customer, Staff, Admin, POS sale, …)
- `SECURITY_AUDIT.md`: the pre-launch audit (historical; paths in it predate the move to `frontend/` and `backend/`)
