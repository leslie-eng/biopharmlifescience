# Biolinks Commerce OS — Overhaul Migration Plan

*Prepared for Mickey · August 13, 2026*

## 1. Executive Summary

The biolinks-master folder currently holds three overlapping, partially-built projects rather than one application: a bare Node.js demo, a real React/TypeScript frontend backed by an Express + MySQL API, and an abandoned Supabase/Postgres integration left in place alongside it. None of the three has pagination, and the working auth system lives only in the Express backend.

This document lays out the plan to consolidate everything into a single stack — FastAPI backend, React frontend, PostgreSQL database, with proper authentication and pagination — and breaks the work into modules with rough sizing so it can be scoped and quoted for external development.

## 2. Current State Assessment

### 2.1 What exists today

- **Root demo project** (`backend/server.js`, `biolinks/`): plain Node `http` server, in-memory fake data, no database connection, no auth. Marketing/demo purposes only.
- **commerce-hub-main/commerce-hub-main/**: the real application. React 18 + TypeScript + Vite frontend (shadcn/Tailwind, TanStack Query, React Router) with an Express 5 + MySQL (raw SQL, no ORM) backend.
- **Working JWT auth** in the Express backend (bcryptjs + jsonwebtoken) with three roles — admin, staff, customer — enforced via middleware.
- A second, **unused Supabase (Postgres) integration** is still wired into the frontend (`src/integrations/supabase`) alongside three Postgres migration files — an earlier, apparently abandoned direction.
- A separate, more ambitious **ERP-style Postgres schema** (`schema.sql` at the repo root — roles, customers, warehouses, inventory movements, shipments, payments, purchase orders, ledger accounts, analytics tables) exists as a concept design but isn't connected to any running code.
- **No pagination** anywhere — every list endpoint returns its full result set.
- No automated tests, mixed package managers (npm + bun), committed `node_modules` and build archives (`dist.zip`, `dist.rar`), duplicate nested `commerce-hub-main/commerce-hub-main` folder structure.

### 2.2 Immediate risk

A live Supabase project URL and anon key are committed in plaintext (`commerce-hub-main/commerce-hub-main/.env`) and are not excluded by `.gitignore`. The Express JWT implementation also has an insecure hardcoded fallback secret. Both should be rotated/fixed before any other work, independent of the rest of this plan.

## 3. Target Architecture

- **Backend**: FastAPI (Python), SQLAlchemy models, Alembic migrations, OAuth2 + JWT auth, role-based access control (admin/staff/customer)
- **Frontend**: existing React 18 + TypeScript + Vite app, retained and rewired to the new API; Supabase integration removed
- **Database**: PostgreSQL, single canonical schema replacing both the MySQL schema and the unused Supabase migrations
- **Cross-cutting**: pagination (limit/offset) on every list endpoint, consistent error handling, environment-based config, no secrets in git

## 4. Migration Phases

**Phase 0 — Cleanup & Risk Mitigation (P0)**
Rotate/remove the exposed Supabase credentials and fix `.gitignore`; remove committed `node_modules`, `dist.zip`/`dist.rar`, and collapse the duplicate nested `commerce-hub-main` folder; decide and document the single canonical project (commerce-hub-main becomes the app, the root demo is archived or deleted).

**Phase 1 — Database Design**
Reconcile the working MySQL schema with the more complete Postgres concept schema into one canonical PostgreSQL schema; set up SQLAlchemy models and Alembic migrations from it.

**Phase 2 — Backend Rewrite (FastAPI)**
Rebuild auth (JWT + password hashing) and role middleware equivalents; rebuild each Express route module as a FastAPI router (products, clients, orders, expenses, dashboard, uploads); add pagination to every list endpoint.

**Phase 3 — Frontend Rewire**
Point `src/lib/api.ts` and `AuthContext.tsx` at the new FastAPI endpoints; remove the unused Supabase client and migrations; add pagination controls to product, order, and client tables.

**Phase 4 — Optional: RAG Chatbot**
Decide whether to port `server/src/rag` to Python (a natural fit under FastAPI) or defer/drop it.

**Phase 5 — Testing, Data Migration & Cutover**
Add pytest coverage for auth and each router, Vitest for critical frontend flows; if real production data exists in MySQL, write and verify a one-time ETL script into PostgreSQL; stand up a staging environment, cut over, and decommission the old Express/MySQL stack.

## 5. Scope Breakdown for Procurement

Sizing is indicative (S / M / L) to support getting comparable quotes from developers or agencies — actual estimates should come from whoever scopes the detailed spec. P0 items are blocking or high-risk, P1 is core overhaul work, P2 is important but sequenced later, P3 is optional.

| Module | Current State | Target State | Size | Priority |
|---|---|---|---|---|
| Repo cleanup & secret rotation | Committed Supabase keys, duplicate nested folders, `node_modules` and build zips in git, mixed bun/npm lockfiles | Single clean repo, secrets rotated and moved to env vars / secret manager, `.gitignore` fixed | S | P0 |
| Database schema & migrations | Two divergent schemas: MySQL (8 tables) and an unused Postgres concept (25+ tables, ERP-style) | One canonical PostgreSQL schema (Alembic-managed) reconciling both | M | P0 |
| Auth & RBAC | Working JWT auth in Express, hardcoded fallback secret, roles: admin/staff/customer; parallel unused Supabase auth | FastAPI auth (OAuth2 + JWT), passlib hashing, same 3-role model, single source of truth | M | P0 |
| Products / catalog API | Express routes, raw SQL, full-table selects, no pagination | FastAPI router, SQLAlchemy models, limit/offset pagination, category/status filters | M | P1 |
| Clients / customers API | Express routes, raw SQL, no pagination | FastAPI router, pagination, search by name/email/phone | S | P1 |
| Orders & order items API | Express routes, raw SQL, status enum, no pagination | FastAPI router, pagination, status/date filters | M | P1 |
| Expenses & finance API | Express routes, raw SQL | FastAPI router, pagination, date-range reporting | S | P1 |
| Dashboard / analytics API | Express aggregation queries | FastAPI endpoints on SQLAlchemy models; consider materialized views for KPIs | M | P2 |
| File uploads (product images) | Multer to local disk | FastAPI UploadFile, local or S3-compatible storage | S | P2 |
| RAG chatbot | Node-based RAG in `server/src/rag` | Optional: port to Python under FastAPI, or defer/drop | L | P3 (optional) |
| Frontend data layer rewire | `api.ts`/`AuthContext.tsx` call Express; unused Supabase client still wired in | Point at FastAPI, remove Supabase, update auth flow | M | P1 |
| Frontend pagination UI | Tables/lists render full result sets, no paging controls | Paged/virtualized tables for products, orders, clients (shadcn) | M | P1 |
| Frontend pages (marketing, calculators, dashboards) | ~90 TSX files, React 18 + Vite + shadcn, largely functional | Keep as-is; adjust only where API contracts change | S | P2 |
| Automated testing | No real tests (placeholder only) | Pytest for FastAPI routers/auth, Vitest for critical frontend flows | M | P2 |
| Deployment / DevOps | cPanel-oriented MySQL import script, ad hoc Node hosting | Dockerized FastAPI + Postgres, static/Docker hosting for the React build, CI | M | P2 |
| Data migration (if real production data exists) | Live data, if any, lives in MySQL | One-time ETL script MySQL → PostgreSQL, verified before cutover | S–M | P0 if applicable |

## 6. Open Decisions

- Keep the root ERP-style `schema.sql` concept as the long-term data model, or stay closer to the current MySQL shape and extend it incrementally?
- Is there real production data in the current MySQL database that needs migrating, or is this pre-launch?
- Keep, rebuild, or drop the RAG chatbot feature?
- Hosting target for FastAPI + PostgreSQL (the current MySQL setup was cPanel-oriented, which won't support this stack)?
