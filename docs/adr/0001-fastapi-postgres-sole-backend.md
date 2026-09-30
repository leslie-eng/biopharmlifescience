# FastAPI + PostgreSQL is the sole backend

The repo carried three backends: the Express + MySQL API (`server/`), an abandoned Supabase/Postgres integration, and a root Node `http` demo. We deleted all three and kept `server-fastapi/` (a route-for-route port of the Express API) as the only backend, with the React frontend on Vercel and the API on a separate host. Consolidating matches the target architecture in `Biolinks_Migration_Plan.md` and closes some audit findings by deletion (hardcoded JWT fallback, root-server path traversal, publicly writable Supabase RLS) rather than patching code we'd throw away.

## Consequences

- The FastAPI port is 1:1, so it inherits the other audit findings (client-controlled upload extension, first registrant becomes admin, client-trusted order prices, no auth rate limiting). Those are fixed in `server-fastapi/`, not avoided by this decision.

- The last commit containing the Express server, Supabase migrations and root demo is `ca066ee` on branch `predeploy/fastapi`; untracked business files and build artifacts were moved to `../biolinks-archive-2026-09-30/` outside the repo.
- The existing MySQL database is not migrated: `server-fastapi/README_DEPLOY.md` records that it held only empty/test data. Any real data there must be exported before it's decommissioned.
