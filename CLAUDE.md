# Biolinks

- `frontend/`: React 18 + TypeScript + Vite, deployed to Vercel. Talks to the API only through `src/services/` (`VITE_API_URL`). See `frontend/README.md`.
- `backend/`: FastAPI + SQLAlchemy + PostgreSQL API, deployed to Render. The only backend (see `docs/adr/0001-fastapi-postgres-sole-backend.md`). Routes in `app/api/routes/`, business logic in `app/services/`. See `backend/README.md`.

## Agent skills

### Issue tracker

Issues live in GitHub Issues for `leslie-eng/biopharmlifescience` (the `origin` remote), via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
