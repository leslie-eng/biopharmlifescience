-- Biolinks Commerce — PostgreSQL schema (FastAPI backend)
-- Ported 1:1 from server/mysql-schema.sql. Same tables, columns, and constraints;
-- only the column *types* changed to their Postgres equivalents:
--   CHAR(36)              -> UUID (stored/returned as text, same as before)
--   TINYINT(1)            -> BOOLEAN
--   DATETIME              -> TIMESTAMP
--   ENUM(...)             -> TEXT + CHECK (...)   [Postgres ENUMs are painful to alter later —
--                                                   a CHECK constraint is easy to widen with a migration]
--   ON UPDATE CURRENT_TIMESTAMP -> handled by the ORM layer (see app/models.py, onupdate=func.now())
--
-- Apply with: psql "$DATABASE_URL" -f schema.postgres.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto; -- for gen_random_uuid(), not required since the app generates ids

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  email_confirmed_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NULL,
  email VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'staff', 'customer')),
  UNIQUE (user_id, role)
);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT NULL,
  category VARCHAR(120) NULL,
  price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  unit VARCHAR(40) NULL DEFAULT 'unit',
  image_url TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NULL,
  phone VARCHAR(50) NULL,
  address TEXT NULL,
  notes TEXT NULL,
  notify_on_restock BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY,
  order_number VARCHAR(40) NOT NULL UNIQUE,
  client_id UUID NULL REFERENCES clients(id) ON DELETE SET NULL,
  customer_name VARCHAR(255) NULL,
  customer_email VARCHAR(255) NULL,
  customer_phone VARCHAR(50) NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  payment_method TEXT NULL DEFAULT 'mpesa'
    CHECK (payment_method IS NULL OR payment_method IN ('mpesa', 'cash', 'bank', 'other')),
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  mpesa_receipt VARCHAR(120) NULL,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NULL REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL,
  unit_price NUMERIC(12, 2) NOT NULL,
  quantity INTEGER NOT NULL,
  line_total NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY,
  category VARCHAR(120) NOT NULL,
  description TEXT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  occurred_on DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stock_interest (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  client_id UUID NULL REFERENCES clients(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  notified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (product_id, email)
);

CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products (is_active);
