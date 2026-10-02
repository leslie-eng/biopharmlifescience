# Launch release scope

Decisions from the pre-deploy grilling session (2026-09-30). Architecture choice: `docs/adr/0001-fastapi-postgres-sole-backend.md`.

## What ships

- **Public site**: home, the-model, about, Akiba calculator, book-assessment, product catalog as a static brochure (curated in the frontend; does not read the API), chatbot in retrieval-only mode (no `OPENAI_API_KEY`).
- **Staff back-office**: `/dashboard` (overview, products, POS, orders, clients, finances, reports).
- **Not shipping**: Restock requests and an API-backed public catalog (issue #1), customer sign-up (`/account` hidden), online payments (none exist; POS records offline sales only), `VITE_ALLOW_DASHBOARD_WITHOUT_ROLE` bypass (code removed), home dashboard preview (`VITE_SHOW_HOME_DASHBOARD` off).

## "Broken" means

- Public: catalog doesn't load, site down.
- Staff: can't log in, POS can't record a sale, stock doesn't decrement, dashboard numbers wrong.

## Context

- First production launch. Fresh PostgreSQL, no data migration: no real data exists in the old MySQL database.
- Users: under 10 staff, low public traffic (under 1k visits/day).
- Personal data (client names, emails, phones) is in scope; Kenya Data Protection Act applies: HTTPS everywhere, DB backups, no PII in logs.

## Environments and hosting

See `docs/adr/0002-vercel-frontend-render-api.md`.

- Frontend: Vercel. Production `biopharmlifescience.co.ke`; preview deploys are the staging frontend.
- API + Postgres: Render. Production `api.biopharmlifescience.co.ke`, staging `api-staging.biopharmlifescience.co.ke` with its own database. Promote to production after staging passes.
- `CORS_ORIGIN` = exactly the frontend origin per environment; `VITE_API_URL` and `PUBLIC_URL` = the API origin.

## Accounts

- Staff and Admin accounts are created with a CLI command run from the Render shell (`create-user --role admin|staff`). No public staff sign-up.
- Public `/api/auth/register` is disabled for launch; the "Staff signup" tab is removed.
- Ticket for later: admin-only Staff management screen.

## Schema migrations

- Alembic, starting from one baseline migration (upgrade = current schema, downgrade = drop it). Verified upgrade -> downgrade -> upgrade against a throwaway Postgres.
- `schema.postgres.sql` kept for reference only.

## Monitoring

- Sentry (free tier) on API and frontend, `send_default_pii=False`.
- UptimeRobot on `/api/health` every 5 minutes, alerting by email.

## Rollback

- Every release is tagged (`v1.0.0`, ...).
- Frontend: Vercel Instant Rollback to the previous deployment.
- API: Render Rollback to the previous deploy.
- Database: manual Render snapshot before every migration, then `alembic downgrade -1` if needed.
- First launch only: there is no previous version, so rollback = maintenance page / take the site down.

## Release blockers (must be fixed before GO)

- C1: upload extension/type derived from client input -> sniff real bytes, server-chosen extension.
- C2: first registrant becomes admin -> seed first admin via CLI; public registration disabled.
- C3: POS order prices trusted from client -> recompute from `products.price` server-side.
- H1: no rate limit on `/api/auth/login` and `/api/auth/register`.
- Public product responses expose `cost`; inactive products visible to visitors (audit M5).
- POS stock decrement depends on a client flag; deactivated products can be sold.
- Rate limits must key on the real client IP behind Render's proxy (`TRUST_PROXY=true`).
- `JWT_SECRET` shorter than 32 characters must refuse to start.
- Security headers on the API and on Vercel (audit M3).
