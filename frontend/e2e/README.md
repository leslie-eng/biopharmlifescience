# Dashboard end-to-end tests

Playwright drives the staff dashboard in your installed Chrome: sign-in, every nav link and page,
deep links and refresh, and a create/edit/delete round trip per module (product image upload,
clients, POS sale to orders, expenses).

They create and delete records, so point them at a local or staging stack, never production.

1. Start an API with an empty database and three accounts (one per role):
   `python -m app.cli create-user --email <email> --role admin|staff|customer --password-env <VAR>`.
   Its `CORS_ORIGIN` must include the site origin below.
2. Build the site against that API and serve it:
   `VITE_API_URL=http://localhost:3011 npm run build && npx vite preview --port 4173`.
3. Run the tests:

   ```sh
   E2E_ADMIN_EMAIL=... E2E_ADMIN_PASSWORD=... \
   E2E_STAFF_EMAIL=... E2E_STAFF_PASSWORD=... \
   E2E_CUSTOMER_EMAIL=... E2E_CUSTOMER_PASSWORD=... \
   npm run test:e2e
   ```

`E2E_BASE_URL` changes the site address (default `http://localhost:4173`). Screenshots of each
page land in `e2e/.results/screens/`; set `E2E_CHANNEL=` to use Playwright's own Chromium instead of Chrome.
