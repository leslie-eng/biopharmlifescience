# Biolinks web app (frontend)

React 18 + TypeScript + Vite single-page app: the public website and the staff dashboard. Deployed to Vercel (`vercel.json`: SPA rewrites, security headers, CSP; the `www` → bare-domain redirect is a Vercel Domains setting, see `docs/deploy.md`). Setup steps are in the root `README.md`.

## Layout

```text
src/
  main.tsx, App.tsx    entry point and routes
  pages/               one component per route; pages/dashboard/ is the staff area
  components/
    site/              public-site UI (SiteLayout, header, footer, chatbot, carousel, …)
    dashboard/         DashboardLayout (access guard), DashboardNav
    ui/                shadcn/ui primitives
    SeoTags.tsx        canonical URL, og:url and noindex per route
  services/            the only code that calls the API
    http.ts            request(), ApiError {status, code}, token storage
    auth.ts products.ts clients.ts orders.ts expenses.ts dashboard.ts chat.ts
  types/api.ts         API request/response shapes (keep in step with backend/app/schemas.py)
  contexts/AuthContext.tsx   signed-in user, roles, sign-in/out, password change
  data/                static catalog content and images
  lib/                 client-side helpers (Akiba calculator, contact links, site URLs, …)
  hooks/               UI hooks
```

Components never call `fetch` directly: they use a service (`productsApi.list()`, `authApi.login()`, …), which goes through `services/http.ts`. That module attaches the token, prefixes `VITE_API_URL`, and turns `{error, code}` responses into an `ApiError`.

## Commands

```bash
npm ci                                  # install (Node 22)
npm run dev                             # http://localhost:8080; proxies /api and /uploads to :3001
npx tsc -p tsconfig.app.json --noEmit   # type-check
npm test                                # vitest
npm run lint                            # eslint
npm run build                           # production build to dist/ (also writes sitemap.xml)
```

## Environment

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | API origin, e.g. `https://api.biopharmlifescience.co.ke`. Empty in local dev (Vite proxy). **Must** be set for Vercel builds. |
| `VITE_SENTRY_DSN`, `VITE_SENTRY_ENVIRONMENT` | optional error monitoring |
| `VITE_SHOW_HOME_DASHBOARD` | `false` outside local demos |

`VITE_*` values are compiled into the public bundle, so never put secrets in them.
