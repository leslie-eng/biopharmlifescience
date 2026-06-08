# Biolinks Commerce OS

Biolinks Commerce OS is a branded ecommerce operations platform concept for managing orders, sales, clients, finances, inventory, and advanced business analytics.

## Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js HTTP server
- Database design: relational SQL schema in `schema.sql`

## Run locally

```bash
npm start
```

Open `http://localhost:3000`.

## API endpoints

- `GET /api/health`
- `GET /api/dashboard`
- `GET /api/schema`

## Project structure

- `biolinks/index.html` - dashboard UI
- `biolinks/styles.css` - Biolinks-inspired visual system
- `biolinks/app.js` - frontend rendering logic
- `backend/server.js` - static server and API
- `backend/data.js` - sample ecommerce business data
- `schema.sql` - ecommerce relational schema

## Notes

- The backend uses in-memory sample data so the UI is demo-ready immediately.
- The schema is designed so you can later connect PostgreSQL or MySQL.
- The visual design uses the provided Biolinks logo and brand colors for an executive operations dashboard.
