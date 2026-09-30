"""Baseline: the launch schema (users, roles, products, clients, orders, expenses, restock requests).

Revision ID: 0001
Revises:
"""

from alembic import op

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None

TABLES_CHILDREN_FIRST = [
    "stock_interest",
    "expenses",
    "order_items",
    "orders",
    "clients",
    "products",
    "user_roles",
    "profiles",
    "users",
]


def upgrade() -> None:
    op.execute(
        """
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  email_confirmed_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NULL,
  email VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE user_roles (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'staff', 'customer')),
  UNIQUE (user_id, role)
);

CREATE TABLE products (
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

CREATE TABLE clients (
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

CREATE TABLE orders (
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

CREATE TABLE order_items (
  id UUID PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NULL REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL,
  unit_price NUMERIC(12, 2) NOT NULL,
  quantity INTEGER NOT NULL,
  line_total NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE expenses (
  id UUID PRIMARY KEY,
  category VARCHAR(120) NOT NULL,
  description TEXT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  occurred_on DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE stock_interest (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  client_id UUID NULL REFERENCES clients(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  notified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (product_id, email)
);

CREATE INDEX idx_orders_created_at ON orders (created_at DESC);
CREATE INDEX idx_order_items_order_id ON order_items (order_id);
CREATE INDEX idx_products_is_active ON products (is_active);
"""
    )


def downgrade() -> None:
    for table in TABLES_CHILDREN_FIRST:
        op.execute(f"DROP TABLE {table}")
