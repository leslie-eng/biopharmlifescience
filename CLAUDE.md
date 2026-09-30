# Biolinks

The app lives in `commerce-hub-main/commerce-hub-main/`:

- `src/`: React 18 + TypeScript + Vite frontend, deployed to Vercel. Talks to the API via `src/lib/api.ts` (`VITE_API_URL`).
- `server-fastapi/`: FastAPI + SQLAlchemy + PostgreSQL API. The only backend (see `docs/adr/0001-fastapi-postgres-sole-backend.md`).

## Agent skills

### Issue tracker

Issues live in GitHub Issues for `leslie-eng/biopharmlifescience` (the `origin` remote), via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
