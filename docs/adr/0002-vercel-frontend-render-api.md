# Vercel for the frontend, Render for the API and Postgres

The React build is hosted on Vercel and the FastAPI API plus PostgreSQL on Render (paid Postgres plan for daily backups and point-in-time recovery), replacing the cPanel/Passenger target that `server-fastapi/README_DEPLOY.md` and `passenger_wsgi.py` were written for. Render gives us managed backups, a declarative `render.yaml`, and one-click rollback; cPanel hosts rarely offer Postgres and give no rollback.

## Consequences

- Product image uploads live on a Render persistent disk mounted at `UPLOAD_DIR`. A service with a disk runs as one instance and has a few seconds of downtime per deploy; acceptable at launch scale. Moving uploads to an S3-compatible bucket is the way out if we need more instances.
- Domains: frontend `biopharmlifescience.com`, API `api.biopharmlifescience.com`; staging uses Vercel previews plus `api-staging.biopharmlifescience.com`.
