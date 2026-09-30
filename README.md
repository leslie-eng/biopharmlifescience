# Biolinks

The Biolinks public website and staff back-office (catalog, POS, orders, clients, finances, reports).

| Part | Stack | Lives in | Hosted on |
|---|---|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind/shadcn | `commerce-hub-main/commerce-hub-main/src` | Vercel |
| API | FastAPI, SQLAlchemy, Alembic | `commerce-hub-main/commerce-hub-main/server-fastapi` | Render |
| Database | PostgreSQL 17 | Alembic migrations in `server-fastapi/migrations` | Render |

## Run locally

```bash
# Postgres
docker run -d --name biolinks-pg -e POSTGRES_PASSWORD=dev -e POSTGRES_DB=biolinks -p 5432:5432 postgres:17-alpine

# API (http://localhost:3001)
cd commerce-hub-main/commerce-hub-main/server-fastapi
python -m venv .venv && .venv/Scripts/pip install -r requirements-dev.txt   # macOS/Linux: .venv/bin/pip
cp .env.example .env    # set JWT_SECRET (32+ chars) and DATABASE_URL
.venv/Scripts/alembic upgrade head
.venv/Scripts/python -m app.cli create-user --email you@example.com --password '<password>' --role admin
.venv/Scripts/uvicorn app.main:app --reload --port 3001

# Frontend (http://localhost:8080, proxies /api to :3001)
cd ..
npm ci
npm run dev
```

## Tests

- API: `pytest` in `server-fastapi/`. The suite needs a throwaway Postgres; see `tests/conftest.py`.
- Frontend: `npm test`

## Docs

- `docs/deploy.md`: deploy runbook, staging checks, rollback
- `docs/release-scope.md`: what the launch includes
- `docs/adr/`: architecture decisions
- `GLOSSARY.md`: domain terms (Client, Customer, Staff, Admin, POS sale, …)
- `SECURITY_AUDIT.md`: the pre-launch audit; issues track what's still open
