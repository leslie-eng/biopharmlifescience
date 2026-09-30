# FastAPI backend — what changed and how to deploy it

This directory is a full rewrite of `server/` (the old Express + MySQL API) in
Python/FastAPI + PostgreSQL. It is a drop-in replacement: every route, URL path, and
JSON request/response shape matches the old backend exactly, so **the React frontend
(`src/`) needs zero code changes** — only its `VITE_API_URL` needs to eventually point
at wherever this new backend is deployed.

The old `server/` directory has been left untouched. Nothing here modifies it; you can
run both side by side while you test, and delete `server/` once you're confident in
the replacement.

## What's different on purpose

A rewrite is a natural moment to fix a couple of things the earlier security audit
flagged in this backend, so these are deliberately **not** carried over as-is:

- **No hardcoded JWT secret fallback.** The old `auth.js` fell back to signing tokens
  with the literal string `"dev-only-change-me"` if `JWT_SECRET` was unset. This app
  refuses to start at all if `JWT_SECRET` is missing — see `.env.example`.
- Everything else (route behavior, status codes, error messages, the stock-decrement
  row-locking logic in order creation) is a deliberate 1:1 port, not a redesign.

## Local setup

```bash
cd server-fastapi
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # then fill in JWT_SECRET and DATABASE_URL at minimum

# Create the schema in your Postgres database:
psql "$DATABASE_URL" -f schema.postgres.sql

# Run it (this uses uvicorn — installed for local dev only, see requirements.txt):
uvicorn app.main:app --reload --port 3001
```

Visit `http://localhost:3001/api/health` to confirm it's up, and
`http://localhost:3001/docs` for the interactive OpenAPI docs FastAPI generates for
free (there was no equivalent in the old Express app).

Point the frontend at it locally by setting `VITE_API_URL=http://localhost:3001` in
`commerce-hub-main/commerce-hub-main/.env`.

## Deploying on cPanel

cPanel's Python support ("Setup Python App", under Software) runs apps through
**Phusion Passenger**, which is a WSGI server — FastAPI is natively ASGI. This project
bridges the two with `a2wsgi` (see `passenger_wsgi.py`), and every route handler is
written as plain `def` (not `async def`) so it runs cleanly as a synchronous WSGI app
under Passenger's threaded worker model. Don't introduce `async def` route handlers
without revisiting this — they won't get a running event loop under Passenger.

Practical effect of running this way: no WebSockets, no real HTTP streaming (e.g. no
token-by-token streaming from the chat endpoint). Nothing here needs either today.

Steps:

1. **Provision PostgreSQL.** Most cPanel hosts offer PostgreSQL under "PostgreSQL
   Databases" in Software — create a database and a database user there (separate
   from the MySQL one the old backend used). Note the host/port/db/user/password.
2. **Setup Python App.** In cPanel → Software → "Setup Python App": create an
   application, pick a Python version (3.10+), and set the application root to this
   `server-fastapi` directory (upload it there via File Manager or git). cPanel
   generates a virtualenv and its own `passenger_wsgi.py` stub — **replace it** with
   the one in this repo (it already imports the real app correctly).
3. **Install dependencies.** Use the "Run Pip Install" button cPanel gives you (or SSH
   into the app's virtualenv) and install from `requirements.txt`.
4. **Set environment variables.** cPanel's Python App page has an "Environment
   Variables" section — set everything from `.env.example` there (`JWT_SECRET`,
   `DATABASE_URL`, `CORS_ORIGIN` to your real frontend domain, `PUBLIC_URL` to this
   app's own public URL, `OPENAI_API_KEY` if you want the LLM-backed chatbot answers).
   **Set the app's timezone to UTC** if cPanel exposes that option — the app assumes
   the Postgres session timezone is UTC when formatting timestamps (see the long
   comment in `app/schemas.py` on `_iso_z` for why this matters).
5. **Load the schema.** SSH in (or use phpPgAdmin if your host bundles it) and run
   `psql "$DATABASE_URL" -f schema.postgres.sql` against the new database.
6. **Restart the app** from the cPanel Python App page after any code or env change —
   Passenger caches the running process.
7. **Point the frontend at it.** Set `VITE_API_URL` in the frontend's build to this
   app's public URL and rebuild/redeploy the static site as usual.

Since you told me the current database is empty/test data, there's no migration step
here — the schema starts fresh. If that changes before you cut over, say so before
deploying, since moving real orders/clients/products from MySQL to Postgres is a
separate job I haven't built (a one-off export/import script) and shouldn't be skipped
silently.

## Files

| File | Old Express equivalent |
|---|---|
| `app/main.py` | `server/src/index.js` |
| `app/config.py` | env var reads scattered across `index.js`/`db.js` |
| `app/database.py` | `server/src/db.js` |
| `app/models.py` | `server/mysql-schema.sql` (as ORM classes) |
| `app/security.py` | `server/src/auth.js` |
| `app/deps.py` | `server/src/middleware.js` |
| `app/utils.py` | `server/src/utils.js` |
| `app/schemas.py` | (new — request/response validation FastAPI needs but Express never had) |
| `app/routers/*.py` | `server/src/routes/*.js`, one file each, same names |
| `app/rag/*.py` | `server/src/rag/*.js` + `server/src/data/chat-knowledge.js` |
| `passenger_wsgi.py` | (new — cPanel/Passenger entrypoint) |
| `schema.postgres.sql` | `server/mysql-schema.sql` |
