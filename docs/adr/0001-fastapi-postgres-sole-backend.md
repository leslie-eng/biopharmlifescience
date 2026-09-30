# FastAPI + PostgreSQL is the sole backend

The repo carried three backends: the Express + MySQL API (`server/`), an abandoned Supabase/Postgres integration, and a root Node `http` demo. We deleted all three and kept `server-fastapi/` (a route-for-route port of the Express API) as the only backend, with the React frontend on Vercel and the API on a separate host. Consolidating removes the open Express security findings (hardcoded JWT fallback, root-server path traversal, publicly writable Supabase RLS) by deletion rather than patching code we'd throw away, and matches the target architecture in `Biolinks_Migration_Plan.md`.

## Consequences

- The last commit containing the Express server, Supabase migrations and root demo is `ca066ee` on branch `predeploy/fastapi`; untracked business files and build artifacts were moved to `../biolinks-archive-2026-09-30/` outside the repo.
- The existing MySQL database is not migrated: `server-fastapi/README_DEPLOY.md` records that it held only empty/test data. Any real data there must be exported before it's decommissioned.
