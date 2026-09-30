# biolinks-master — Full-Stack Audit Report

**Scope reviewed:** `commerce-hub-main/commerce-hub-main` (React + Vite frontend, Express + MySQL backend, abandoned Supabase/Postgres integration), root `backend/server.js` demo, `biolinks/` static dashboard demo, `schema.sql` / `mysql-schema.sql`, deploy configs (`.htaccess`, `vercel.json`, cPanel deploy docs).

**Important context:** the project's stated target architecture is FastAPI + React + PostgreSQL with proper auth and pagination. The code as it stands today is **Express + MySQL**, plus a **parallel, still-configured Supabase/Postgres backend** that the migration plan calls "abandoned... left in place alongside it," and a separate **Node `http` demo server** at the repo root. All three are audited below as they exist today, since all three currently ship in the repository and at least one (Express+MySQL) is the active application.

Traced end-to-end: registration → role assignment → JWT issuance → dashboard gating → staff CRUD → POS checkout → stock decrement; and the chatbot RAG pipeline. Do not treat this document as a to-do list to work through mechanically — read the Critical section first; everything else is secondary until those are closed.

---

## CRITICAL

### C1. Arbitrary file upload → likely remote code execution on typical hosting
- **Category:** Security
- **Location:** `commerce-hub-main/commerce-hub-main/server/src/routes/uploads.js` (multer config), served via `server/src/index.js` `app.use("/uploads", express.static(uploadRoot))`
- **Issue:** The upload filter only checks `file.mimetype.startsWith("image/")`. `mimetype` is read from the client-supplied `Content-Type` part of the multipart body — it is not derived from file content (no magic-byte sniffing). The saved filename's extension comes from `path.extname(file.originalname)`, which is also fully client-controlled. Nothing in the upload path or the deploy `.htaccess` disables script execution inside the uploads directory.
- **Impact:** An attacker with `requireStaff` access (see C2 for how trivially that can be obtained) can POST a file named e.g. `shell.php` with `Content-Type: image/jpeg`. The filter passes, and the file is written to `uploadRoot/catalog/<uuid>.php`, which is served statically. The project's own deploy docs (`deploy/cpanel/DEPLOY.txt`, `node-app.htaccess`) target cPanel/Apache with Passenger — an environment that commonly executes `.php` by extension anywhere under the web root. If the uploads directory is reachable by Apache's PHP handler, this is remote code execution on the host.
- **Evidence:**
  ```js
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(Object.assign(new Error("Only image files allowed"), { status: 400 }));
    }
    cb(null, true);
  },
  ```
  Filename: `` `${newId()}${ext}` `` where `ext = path.extname(file.originalname).toLowerCase() || ".jpg"`.
- **Reproduction:** As a staff/admin session (or the trivially-obtained first-admin account, see C2), craft a raw multipart POST to `/api/uploads/product-image` with `filename="x.php"` and `Content-Type: image/jpeg` in that part, body containing `<?php system($_GET['c']); ?>`. Confirm the response `url`, then request that URL directly.
- **Recommended fix:** Validate actual file bytes (e.g. `file-type` package sniffing magic numbers) not just the declared mimetype; whitelist extensions to a fixed image set derived from the sniffed type (never from `originalname`); strip/ignore the client's extension entirely and generate `.jpg/.png/.webp` etc. from the detected type; add `<FilesMatch "\.(php|phtml|php\d|cgi|pl|py|sh)$"> Require all denied </FilesMatch>` (or `RemoveHandler`/`php_flag engine off`) to the uploads directory's own `.htaccess`; consider serving uploads from a separate subdomain/bucket with no script execution capability at all (e.g. S3/Cloud Storage/Supabase Storage — which is already configured and unused for this purpose).
- **Confidence:** High Confidence (the code path is unambiguous; RCE impact depends on host configuration matching the project's own documented cPanel target, which is highly plausible).

### C2. First registrant becomes admin — public race, no bootstrap protection
- **Category:** Security / Race Condition
- **Location:** `server/src/routes/auth.js` `POST /register`; publicly reachable at `src/pages/StaffAuth.tsx` (`/staff` and `/admin` routes, "Staff signup" tab)
- **Issue:** Admin bootstrapping is implicit: `isFirstUser = COUNT(*) FROM users === 0` and `role = isFirstUser ? "admin" : "customer"`. There is no lock, transaction isolation, or unique-constraint trick around this check — two concurrent registrations submitted before either `INSERT` commits will both read `count = 0` and both be granted `admin`. Worse, this logic is reachable from a page explicitly branded "Staff & operations — Administrator and staff access only" that anyone can browse to and submit without any authentication.
- **Impact:** On any fresh deploy, a reset database, or a window between infrastructure migration and the real admin's first sign-in, whoever submits `/api/auth/register` first — or fastest, or in a race of many concurrent requests — becomes the application's permanent admin. Combined with C1, that is a direct path from anonymous visitor to server compromise.
- **Evidence:**
  ```js
  const userCountRows = await query("SELECT COUNT(*) AS c FROM users");
  const isFirstUser = Number(userCountRows[0].c) === 0;
  const role = isFirstUser ? "admin" : "customer";
  ```
  No transaction, no `SELECT ... FOR UPDATE`, no advisory lock.
- **Reproduction:** Against a freshly seeded (empty `users` table) instance, fire N concurrent `POST /api/auth/register` requests with different emails; inspect `user_roles` afterward — more than one row (or an attacker-controlled one) can land as `admin`.
- **Recommended fix:** Remove implicit "first user = admin" entirely from the public endpoint. Seed the first admin via a one-time CLI/migration script (the repo already has `server/scripts/import-supabase-csv.js` — add a sibling `seed-admin.js` run manually) or gate it behind a server-only setup token set once in an environment variable. If the auto-bootstrap behavior must be kept for onboarding convenience, at minimum wrap the count-check-and-insert in a single transaction with `SELECT COUNT(*) FROM users FOR UPDATE`, and disable the code path once any admin exists (not just count-based).
- **Confidence:** Confirmed.

### C3. Order totals and line prices are trusted from the client — no server-side recomputation
- **Category:** Security
- **Location:** `server/src/routes/orders.js` `POST /`; consumed by `src/pages/dashboard/Pos.tsx`; independently exploitable via the abandoned Supabase policies (see C3b)
- **Issue:** `unit_price`, `line_total`, `subtotal`, and `total` are taken directly from `req.body` and inserted as-is. The server never re-reads `products.price` to validate the submitted amounts (it only checks `stock` when `decrement_stock` is set).
- **Impact:** Any caller who can reach this endpoint with a valid session — currently limited to staff via the POS UI, since there is no public checkout page yet — can record a sale, and thus revenue/financial reports, at whatever price they choose (e.g. `unit_price: 0.01`), independent of stock still being reduced correctly. This is an insider-fraud vector today; it becomes an **external, unauthenticated** vector the moment a customer-facing checkout is wired to the same endpoint (which the schema, `optionalAuth` middleware, and `client_id`/`customer_email` fields all suggest is the intended near-term direction — see the project's own "requires major overhaul" instruction to move toward a real e-commerce flow).
- **Evidence:**
  ```js
  Number(line.unit_price), Number(line.quantity), Number(line.line_total)
  // inserted with no comparison to `SELECT price FROM products WHERE id = ?`
  ```
- **Reproduction:** As staff, open browser devtools on the POS page, intercept the `POST /api/orders` request, edit `items[0].unit_price` and `line_total` downward, replay; the order is recorded at the tampered price and stock is still correctly decremented at `quantity`.
- **Recommended fix:** Recompute `unit_price` and `line_total` server-side from a fresh `SELECT price FROM products WHERE id = ?` inside the existing transaction, ignoring client-submitted prices entirely (client can still submit `quantity`); reject the order if a referenced `product_id` doesn't resolve; only trust client-submitted `unit_price`/`product_name` for true walk-in/manual line items that have no `product_id` (and flag those distinctly in reporting).
- **Confidence:** Confirmed.

### C3b. Abandoned Supabase project remains live and independently writable by anyone
- **Category:** Security / Data Exposure
- **Location:** `commerce-hub-main/commerce-hub-main/.env` (real, committed values, not `.env.example`); `supabase/migrations/20260422095041_...sql`; `src/integrations/supabase/client.ts`
- **Issue:** The repo ships a real Supabase project URL and anon (public) key. The migration's RLS policies allow **fully unauthenticated** inserts: `CREATE POLICY "Anyone can create order" ON public.orders FOR INSERT WITH CHECK (...)` and the equivalent for `order_items`, with only a `unit_price >= 0` check — no comparison to real product pricing, no `TO authenticated` restriction at all.
- **Impact:** If this Supabase project is still active (the migration plan calls it "abandoned... left in place," not decommissioned), anyone who extracts the anon key from the shipped `.env`/JS bundle can call the Supabase REST API directly — bypassing the Express backend, its JWT auth, and the `requireAuth`/`requireStaff` checks entirely — and insert arbitrary fabricated orders and order line items at any price. This is strictly worse than C3 because it requires no account at all.
- **Evidence:** `.env` line 2 contains a real, non-placeholder JWT for `"role":"anon"`. RLS: `FOR INSERT WITH CHECK (customer_name IS NOT NULL ... AND status = 'pending')` — no auth requirement.
- **Recommended fix:** Confirm whether the Supabase project is still provisioned; if the app has fully moved to MySQL, pause/delete the Supabase project and rotate its keys, or at minimum revoke the anon key and replace the "anyone can insert" policies with `false`/`TO service_role` only. Remove the leftover `.env` values and the `src/integrations/supabase` folder if truly unused, or finish the migration and use exactly one backend.
- **Confidence:** High Confidence (policy text is unambiguous; live-project status is not verifiable from static code, hence not "Confirmed").

### C4. Hardcoded fallback JWT secret
- **Category:** Security
- **Location:** `server/src/auth.js`
- **Issue:** `const JWT_SECRET = process.env.JWT_SECRET || "dev-only-change-me";` This exact string is now public in the repository and in this session's history.
- **Impact:** Any deployment that forgets to set `JWT_SECRET` (easy to miss — `.env.example` and the cPanel example both list it, but nothing enforces it at startup) accepts tokens signed with a well-known secret. An attacker can forge a JWT for `{ sub: <any user id> }`, including a guessed/enumerated admin's UUID, for full account takeover without ever knowing a password.
- **Evidence:** `signToken`/`verifyToken` both use this fallback; `index.js` has no startup assertion that `process.env.JWT_SECRET` is set and sufficiently long.
- **Reproduction:** Run the server without `JWT_SECRET` set; sign a token with `jsonwebtoken` using the literal string `dev-only-change-me` and any `sub`; present it as `Authorization: Bearer ...` to `/api/auth/me` or any staff route.
- **Recommended fix:** Fail fast at startup (`process.exit(1)`) if `JWT_SECRET` is unset or under, say, 32 characters, in any environment; never ship a usable default.
- **Confidence:** Confirmed.

### C5. Path-traversal in the root demo server can disclose the entire project, including secrets
- **Category:** Security / Data Exposure
- **Location:** `backend/server.js` (`resolveStaticPath`)
- **Issue:** The traversal guard is `if (!fullPath.startsWith(rootDir)) return null;` after `path.join(rootDir, path.normalize(requestPath.replace(/^\/+/, "")))`. This is the classic prefix-check bug: it does not verify a path-separator boundary after `rootDir`, and more importantly `rootDir` here is the **entire project root** (`biolinks-master/`), not just the intended `biolinks/` static folder — so *any* file under the whole repository (including `commerce-hub-main/commerce-hub-main/.env` with the Supabase key from C3b, or any future secret file) is servable by design, not just via traversal.
- **Impact:** If this Node demo (`backend/server.js`) is deployed or reachable anywhere, an unauthenticated visitor can read arbitrary files from the whole project tree, e.g. `GET /commerce-hub-main/commerce-hub-main/.env`, `GET /package.json`, `GET /schema.sql`, or any developer-added `.env` placed under the tree in the future.
- **Evidence:**
  ```js
  function resolveStaticPath(requestPath) {
    if (requestPath === "/") return path.join(frontendDir, "index.html");
    const cleanPath = path.normalize(requestPath.replace(/^\/+/, ""));
    const fullPath = path.join(rootDir, cleanPath);
    if (!fullPath.startsWith(rootDir)) return null;
    return fullPath;
  }
  ```
- **Reproduction:** With the demo server running, `curl http://localhost:3000/commerce-hub-main/commerce-hub-main/.env`.
- **Recommended fix:** Scope the static root to `frontendDir` (the `biolinks/` folder) only, not the whole project; resolve with `path.resolve` and verify `resolved === frontendDir || resolved.startsWith(frontendDir + path.sep)`; reject any path containing `..` segments outright before resolving. Longer term: this ad-hoc server duplicates the Express app and should be retired as part of the planned overhaul rather than hardened.
- **Confidence:** Confirmed as a code-level flaw; real-world impact depends on whether this file is still deployed anywhere (the migration plan calls it "marketing/demo purposes only," but it exists in the repo and could be started).

---

## HIGH

### H1. No brute-force protection on login or registration
- **Category:** Security
- **Location:** `server/src/routes/auth.js`, `server/src/index.js`
- **Issue:** `/api/chat` has a hand-rolled per-IP rate limiter; `/api/auth/login` and `/api/auth/register` have none, and no global rate-limiting middleware (e.g. `express-rate-limit`) is mounted in `index.js`.
- **Impact:** Password guessing against known/enumerated emails (see H4) is unmitigated; an attacker can attempt unlimited login combinations.
- **Recommended fix:** Add `express-rate-limit` (or equivalent) scoped to `/api/auth/*`, plus exponential backoff or temporary lockout per account after repeated failures; consider a CAPTCHA on repeated failures.
- **Confidence:** Confirmed.

### H2. "Staff" role is equivalent to "admin" everywhere
- **Category:** Security (Authorization)
- **Location:** `server/src/middleware.js` (`requireStaff`), and every route that gates with it (`products.js`, `clients.js`, `orders.js`, `expenses.js`, `dashboard.js`, `uploads.js`)
- **Issue:** There is no `requireAdmin`. Every privileged action — deleting clients, deleting products, changing prices, recording expenses, uploading files, changing order status — accepts either `admin` or `staff` with no further distinction.
- **Impact:** For an app whose own UI copy (`StaffAuth.tsx`) frames "staff" as a lower tier than "admin," this is a missing least-privilege boundary: a compromised or malicious cashier-level account has full administrative control over inventory, pricing, and finances, not just POS/order operations.
- **Recommended fix:** Split into `requireStaff` (read/POS-level actions) and `requireAdmin` (destructive/financial-config actions: delete client/product, edit prices/cost, manage expenses, manage roles); apply the latter to `DELETE` routes and to `expenses.js` at minimum.
- **Confidence:** High Confidence (design gap, not a bug — but a real gap given the app's own role model implies a hierarchy).

### H3. JWT stored in `localStorage`
- **Category:** Security
- **Location:** `src/lib/api.ts` (`getToken`/`setToken`), `src/integrations/supabase/client.ts` (`storage: localStorage`)
- **Issue:** The 7-day-lived auth token is kept in `localStorage`, readable by any JavaScript running on the page.
- **Impact:** Any XSS on the site (the upload path in C1 is one plausible vector; a compromised third-party script is another) can silently exfiltrate the token and fully impersonate the victim, including staff/admin, for up to 7 days.
- **Recommended fix:** Move to an httpOnly, `Secure`, `SameSite=Lax/Strict` session cookie issued by the server, with CSRF protection added for state-changing requests (double-submit token or `SameSite=Strict` is often sufficient here since this is not a cross-site form flow). This is a larger change appropriate for the planned FastAPI rewrite; in the interim, shorten token lifetime significantly and add a server-side revocation list.
- **Confidence:** Confirmed as a design weakness; exploitability depends on an XSS existing, which is plausible but not separately proven beyond C1's upload path.

### H4. Account enumeration on registration
- **Category:** Security
- **Location:** `server/src/routes/auth.js` `POST /register`
- **Issue:** Returns a distinct `409 { error: "Email already registered" }` when the email exists, versus generic validation errors otherwise. Login correctly uses a generic "Invalid email or password" message, but register does not.
- **Recommended fix:** Return a generic success-shaped response either way, or a generic error, and email the account holder if a duplicate signup is attempted, rather than telling the caller synchronously that the account exists.
- **Confidence:** Confirmed.

### H5. `.env` with live third-party credentials is not excluded by `.gitignore`
- **Category:** Security
- **Location:** `commerce-hub-main/commerce-hub-main/.gitignore`
- **Issue:** The gitignore lists `*.local` but not `.env`. The file is not currently tracked in this repo's history (verified via `git log --all -- .env`), but nothing stops the next `git add -A`/`git add .` from committing it — and per the workspace's own file-handling conventions this is exactly the kind of accidental-commit risk `.gitignore` exists to prevent.
- **Recommended fix:** Add `.env` (and `.env.*` except `.env.example`) to `commerce-hub-main/commerce-hub-main/.gitignore`, matching the pattern already correctly used in `server/.gitignore`. Rotate the Supabase anon key regardless, given C3b.
- **Confidence:** Confirmed.

---

## MEDIUM

### M1. Duplicate-record risk from unguarded create/update forms
- **Category:** Race Condition / Reliability
- **Location:** `src/pages/dashboard/Products.tsx` (`save`), `src/pages/dashboard/Clients.tsx`, `src/pages/dashboard/Finances.tsx`
- **Issue:** Unlike `Pos.tsx` and the auth forms (which correctly track a `submitting`/`loading` boolean and `disabled={submitting}` on the submit button), these three dashboard forms call their async `save`/`create` handlers with no in-flight guard and no `disabled` state on the submit button.
- **Impact:** A fast double-click, an accidental double Enter, or a slow network causing a user to click again all result in two identical `POST` requests, creating duplicate products, clients, or expense entries with no idempotency key on the server to collapse them.
- **Evidence:** `Products.tsx` `save()` has no `submitting` state at all; its `<Button type="submit">` is never disabled during the request.
- **Reproduction:** On the Products dialog, fill the form and double-click "Create" quickly (or throttle the network to Slow 3G and double-click); two products are created.
- **Recommended fix:** Add the same `submitting` boolean pattern already used in `Pos.tsx`/`CustomerAuth.tsx` to these three forms; for defense in depth, also accept an idempotency key on the server for `POST /api/products`, `/api/clients`, `/api/expenses`.
- **Confidence:** Confirmed.

### M2. Chat rate limiter likely ineffective or globally shared behind a proxy
- **Category:** Reliability / Security
- **Location:** `server/src/routes/chat.js`; `server/src/index.js`
- **Issue:** The limiter keys on `req.ip`, but `index.js` never calls `app.set("trust proxy", ...)`. Behind any reverse proxy (Passenger/cPanel, a CDN, Vercel-style routing), Express's `req.ip` typically resolves to the proxy's address for every request unless trust proxy is explicitly configured — collapsing the "20 messages/min per visitor" limit into "20 messages/min for the entire site," or conversely making it trivially bypassable via a spoofed `X-Forwarded-For` if trust proxy is later misconfigured to trust it blindly. Separately, `rateMap` is a plain `Map` that is never pruned — every distinct IP seen leaks one entry for the life of the process.
- **Recommended fix:** Set `app.set("trust proxy", 1)` (or the correct hop count) only when actually behind a known proxy, and prefer a real IP/session identifier; evict stale `rateMap` entries on a timer or cap its size; consider a proper limiter (e.g. `express-rate-limit` with a store) instead of the hand-rolled one.
- **Confidence:** High Confidence (depends on the actual deployment topology, which isn't fully knowable from code alone).

### M3. No meaningful security headers
- **Category:** Security
- **Location:** `commerce-hub-main/commerce-hub-main/.htaccess`, `vercel.json`
- **Issue:** The `.htaccess` actually checked into the repo root sets only cache-control headers. `vercel.json` sets only a rewrite rule. The *alternate* cPanel deploy file (`deploy/cpanel/public_html.htaccess`) sets `X-Content-Type-Options: nosniff` but nothing else, and isn't the one a developer running the documented local/default flow would use.
- **Impact:** No `Content-Security-Policy`, `X-Frame-Options`/`frame-ancestors`, `Referrer-Policy`, `Permissions-Policy`, or `Strict-Transport-Security` anywhere in the shipped configs, on either deploy path. This weakens defense-in-depth against the XSS/clickjacking classes generally, and specifically removes a mitigating control that would have reduced C1's blast radius (a CSP disallowing inline scripts and restricting `object-src`/`script-src` would blunt a stored-HTML/SVG upload).
- **Recommended fix:** Add a baseline CSP, `X-Frame-Options: DENY` (or CSP `frame-ancestors 'none'`), `Referrer-Policy: strict-origin-when-cross-origin`, and HSTS at the web-server layer (or via `helmet` in Express if serving same-origin).
- **Confidence:** Confirmed.

### M4. Client-bundle "bypass dashboard role check" flag is documented in production UI
- **Category:** Security / Reliability
- **Location:** `src/contexts/AuthContext.tsx` (`emergencyBypass`), `src/components/dashboard/DashboardAccessDenied.tsx`
- **Issue:** `VITE_ALLOW_DASHBOARD_WITHOUT_ROLE=true` is a build-time flag baked verbatim into the public JS bundle (all `VITE_*` vars are). It only gates the *client-side* UI shell — every real data call is still separately enforced by `requireStaff` server-side — but the production-facing `DashboardAccessDenied` screen explicitly prints the flag name and the internal `user_roles` table name to any signed-in customer who lands there.
- **Impact:** Low direct exploitability (server-side checks hold), but it's an unnecessary information disclosure of internal implementation details and an operational footgun: if this flag is ever left `true` in a production build (nothing prevents that), every signed-in customer sees the full internal dashboard shell/navigation, which is confusing at best and a bad signal to expose at worst.
- **Recommended fix:** Remove the flag from any production build path (only allow it when `import.meta.env.DEV`); strip the internal-implementation detail (table names, env var names) from the user-facing denial screen and move that guidance to developer docs instead.
- **Confidence:** Confirmed.

### M5. `GET /api/products/:id` does not filter `is_active`
- **Category:** Security (minor IDOR) / Data Exposure
- **Location:** `server/src/routes/products.js`
- **Issue:** The public product-detail route has no `optionalAuth`/staff gate and does not filter on `is_active`, unlike the list route.
- **Impact:** A hidden/discontinued/mis-priced product can still be viewed directly if its ID/slug-derived-id is known or guessed, even though it was deliberately hidden from the catalog listing.
- **Recommended fix:** Filter `is_active = 1` for anonymous/non-staff callers on the detail route too, mirroring the list route's logic.
- **Confidence:** Confirmed.

### M6. `DashboardAccessDenied`'s API-outage messaging is effectively unreachable
- **Category:** Reliability
- **Location:** `src/contexts/AuthContext.tsx` (bootstrap `catch`), `src/components/dashboard/DashboardLayout.tsx`, `src/components/dashboard/DashboardAccessDenied.tsx`
- **Issue:** When `/api/auth/me` fails, the bootstrap `catch` calls `clearAuth()`, which sets `user` to `null`, and sets `rolesFetchFailed = true`. `DashboardLayout` checks `!user` *before* `!isStaff`, so it will always redirect to `/staff` in this scenario rather than render `DashboardAccessDenied`, whose `rolesFetchFailed` branch was clearly written to be shown here.
- **Impact:** Users who hit a transient API failure while the app is checking their role are silently bounced to a login screen with no explanation of what happened, instead of the diagnostic message the code was written to show. This looks like an intended-but-broken failure path rather than a deliberate design.
- **Recommended fix:** Either don't clear `user` on a roles-fetch failure (keep the session, just mark roles as unknown) so `DashboardAccessDenied`'s messaging is reachable, or, if logging the user out on any `/me` failure is intentional, surface the reason on the login page (`/staff`) via the `location.state` that's already threaded through the redirect.
- **Confidence:** High Confidence.

### M7. Auth form fields lack programmatic label association
- **Category:** Accessibility
- **Location:** `src/pages/CustomerAuth.tsx`, `src/pages/StaffAuth.tsx`, `src/pages/dashboard/Products.tsx` (edit dialog)
- **Issue:** Throughout these forms, `<Label>Email</Label>` is a sibling of `<Input .../>` with no `htmlFor`/`id` pairing (contrast with `RestockDialog.tsx`, which correctly uses `htmlFor="restock-email"` + `id="restock-email"`). Visual proximity implies a label, but there is no programmatic association.
- **Impact:** Screen reader users tabbing into these fields (email, password, full name, product name/category/unit/price/cost/stock in the Products dialog) will not hear an accessible name announced from the label; the accessible name may fall back to nothing or to an unhelpful `type` announcement. This fails WCAG 2.2 AA 1.3.1 (Info and Relationships) and 4.1.2 (Name, Role, Value) on the two most important forms in the app — sign in and sign up.
- **Reproduction:** Inspect any `<Input>` in `CustomerAuth.tsx` with a screen reader or the browser accessibility tree — no `aria-labelledby`/`for` relationship exists to the adjacent `<Label>` text.
- **Recommended fix:** Add matching `id`/`htmlFor` pairs to every Label/Input pair in these three files (a couple dozen instances); consider a lint rule (`eslint-plugin-jsx-a11y`'s `label-has-associated-control`) to catch regressions, since it's clearly the team's intended pattern in `RestockDialog.tsx` already.
- **Confidence:** Confirmed.

---

## LOW / INFORMATIONAL

### L1. Weak password policy
- **Category:** Security — **Location:** `server/src/routes/auth.js`, `CustomerAuth.tsx`/`StaffAuth.tsx` zod schemas — 6-character minimum, no complexity or breached-password checks, on both client and server. **Fix:** raise minimum to 8+ and consider a k-anonymity breach check (e.g. HaveIBeenPwned range API) client- or server-side. **Confidence:** Confirmed.

### L2. Native `confirm()` for destructive actions
- **Category:** Accessibility / Visual Consistency — **Location:** `src/pages/dashboard/Products.tsx` (`remove`) — the only place in the reviewed dashboard using the browser's native blocking `confirm()` instead of the app's own Radix `AlertDialog` component (present in `components/ui/alert-dialog.tsx` but unused here), inconsistent styling/behavior and not part of the app's own focus-management system. **Fix:** replace with the existing `AlertDialog` component. **Confidence:** Confirmed.

### L3. Chat widget missing modal semantics/focus management
- **Category:** Accessibility — **Location:** `src/components/site/SiteChatbot.tsx` — the panel uses `role="dialog"` but no `aria-modal="true"`, no focus trap, no Escape-to-close handler, and no focus restoration to the FAB button on close (compare to the Radix `Sheet`/`Dialog` used elsewhere in the app, which handle all of this for free). Keyboard users can tab out of the open chat into page content behind it. **Fix:** either build this on the existing `Dialog`/`Sheet` primitives instead of a bespoke `div`, or add `aria-modal`, a focus trap, `Escape` handling, and focus restoration manually. **Confidence:** Confirmed.

### L4. Internal architecture info leaked via demo endpoints
- **Category:** Security (info disclosure) — **Location:** `backend/server.js` `/api/schema` returns internal module names (`["commerce","inventory","finance","reporting","security"]`); both `/api/health` variants echo internal service identifiers. Low value to an attacker but unnecessary. **Confidence:** Confirmed.

### L5. Public "notify me" and chat endpoints have no abuse protection beyond chat's basic limiter
- **Category:** Security — **Location:** `server/src/routes/stockInterest.js` — no rate limit, no CAPTCHA; an attacker can hammer this to spam-insert rows (bounded only by the `UNIQUE(product_id, email)` constraint) or enumerate which emails are already subscribed via the 409 response. Low impact given the data involved. **Confidence:** Confirmed.

---

## Duplicate-submission / concurrency notes not already covered above

- `Pos.tsx` and the auth forms (`CustomerAuth.tsx`, `StaffAuth.tsx`, `RestockDialog.tsx`) **do** correctly guard against double-submission with a `submitting`/`loading` boolean and a `disabled` button — called out here so the pattern gap in M1 reads as an inconsistency to fix, not a systemic app-wide failure.
- The one genuine server-side concurrency control found — `orders.js`'s stock decrement using `SELECT ... FOR UPDATE` inside a transaction before checking `newStock < 0` — is implemented correctly and prevents overselling under concurrent POS sales. This is a positive finding worth preserving as-is in any rewrite.

---

## Remediation plan (priority order)

1. **Block C1 (upload RCE)** — sniff real file content, whitelist extensions server-side, deny script execution in the uploads path. Do this before anything else is exposed to the internet.
2. **Close C2 (implicit first-admin)** — remove or lock down the auto-admin bootstrap; this is what turns every other staff-only finding (C1, H2) into an anonymous-attacker problem instead of an insider-threat problem.
3. **Fix C4 (JWT secret)** — fail startup without a real secret. Five-minute fix, removes a full account-takeover path.
4. **Decide C3b's fate** — confirm whether Supabase is still live; if so, lock its RLS down to deny-by-default or decommission the project and rotate the key; either way stop shipping the real key in a non-ignored `.env` (H5).
5. **Fix C3 (server-side price recomputation)** — required before any customer-facing checkout is added, and closes the current insider-fraud gap in POS today.
6. **Retire or fix C5 (path traversal in the demo server)** — scope its static root correctly, or remove `backend/server.js` from anything that could be deployed, since it appears to be legacy/demo per the project's own migration notes.
7. Add rate limiting to `/api/auth/*` (H1), split `requireStaff`/`requireAdmin` (H2), move tokens off `localStorage` (H3) — these three are naturally bundled into the planned FastAPI/auth overhaul.
8. Sweep the remaining Medium items (M1–M7) alongside the rewrite; they're all inexpensive and mostly mechanical.

## Quick wins (low regression risk, do immediately regardless of the larger rewrite)

- C4: add a startup assertion for `JWT_SECRET`.
- H4: make the register 409 generic.
- H5: add `.env` to `.gitignore`.
- M1: add `submitting` guards to `Products.tsx`/`Clients.tsx`/`Finances.tsx` forms (copy the existing `Pos.tsx` pattern).
- M5: filter `is_active` on the product-detail route.
- M7: add `id`/`htmlFor` pairs to the auth and product forms.
- L2: swap `confirm()` for the existing `AlertDialog` component.
- M3: add baseline security headers to `.htaccess`/reverse proxy config.

## Needs deeper investigation / architectural change

- C1's real-world severity depends on the actual hosting environment's handler configuration for the uploads directory — verify directly against the target host rather than assuming.
- C3b depends on whether the Supabase project is still provisioned and reachable — this needs an account-level check, not a code check.
- H3 (cookie-based sessions + CSRF) and H2 (proper RBAC) are natural fits for the planned FastAPI rewrite rather than patches to the current Express app — worth designing in from the start rather than retrofitting twice.
- The complete absence of a customer-facing checkout/cart flow today limits C3's blast radius to insiders for now, but the schema, `optionalAuth` middleware, and `customer_email`/`client_id` fields all indicate one is coming — C3's fix should land *before* that ships, not after.

## Release recommendation

**Do not ship** the current `commerce-hub-main` backend to a public/production host as-is. The combination of C1 (upload RCE), C2 (anyone can become admin on a fresh instance), and C4 (guessable JWT fallback) composes into a realistic anonymous-to-full-compromise chain, and C3b means a supposedly-retired backend may still be independently writable by anyone with the shipped anon key. None of these require sophisticated tooling — a single crafted HTTP request each.

If an internal/staging deployment is needed immediately: set a real, unique `JWT_SECRET`; disable public registration or manually seed the admin and remove the auto-bootstrap code path; restrict `/api/uploads/product-image` to a strict allowlisted extension set at minimum; and confirm the Supabase project's live status and lock it down. With those four addressed, "ship with known risks" for a staff-only internal pilot becomes reasonable while the fuller remediation plan proceeds; broader/public launch should wait for the Critical and High items to close.
