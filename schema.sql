CREATE TABLE roles (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(80) NOT NULL UNIQUE,
  description TEXT
);

CREATE TABLE app_users (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  role_id BIGINT NOT NULL REFERENCES roles(id),
  full_name VARCHAR(160) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE customers (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  customer_code VARCHAR(40) NOT NULL UNIQUE,
  customer_type VARCHAR(20) NOT NULL CHECK (customer_type IN ('individual', 'business')),
  company_name VARCHAR(180),
  first_name VARCHAR(120),
  last_name VARCHAR(120),
  email VARCHAR(190) NOT NULL,
  phone VARCHAR(50),
  tax_id VARCHAR(80),
  credit_limit NUMERIC(14, 2) DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE customer_addresses (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  address_type VARCHAR(20) NOT NULL CHECK (address_type IN ('billing', 'shipping', 'office', 'warehouse')),
  country VARCHAR(100) NOT NULL,
  city VARCHAR(120) NOT NULL,
  region VARCHAR(120),
  street_line_1 VARCHAR(255) NOT NULL,
  street_line_2 VARCHAR(255),
  postal_code VARCHAR(40),
  is_default BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE categories (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(140) NOT NULL UNIQUE,
  parent_id BIGINT REFERENCES categories(id)
);

CREATE TABLE brands (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(120) NOT NULL UNIQUE
);

CREATE TABLE products (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  category_id BIGINT REFERENCES categories(id),
  brand_id BIGINT REFERENCES brands(id),
  sku VARCHAR(60) NOT NULL UNIQUE,
  name VARCHAR(180) NOT NULL,
  description TEXT,
  unit_price NUMERIC(14, 2) NOT NULL,
  cost_price NUMERIC(14, 2) NOT NULL,
  tax_class VARCHAR(50),
  reorder_point INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE warehouses (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(120) NOT NULL,
  code VARCHAR(30) NOT NULL UNIQUE,
  city VARCHAR(120),
  country VARCHAR(100)
);

CREATE TABLE inventory_balances (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  product_id BIGINT NOT NULL REFERENCES products(id),
  warehouse_id BIGINT NOT NULL REFERENCES warehouses(id),
  quantity_on_hand INTEGER NOT NULL DEFAULT 0,
  quantity_reserved INTEGER NOT NULL DEFAULT 0,
  quantity_available INTEGER NOT NULL DEFAULT 0,
  UNIQUE (product_id, warehouse_id)
);

CREATE TABLE inventory_movements (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  product_id BIGINT NOT NULL REFERENCES products(id),
  warehouse_id BIGINT NOT NULL REFERENCES warehouses(id),
  movement_type VARCHAR(30) NOT NULL CHECK (
    movement_type IN ('purchase', 'sale', 'adjustment', 'return_in', 'return_out', 'transfer_in', 'transfer_out')
  ),
  quantity INTEGER NOT NULL,
  reference_type VARCHAR(40),
  reference_id BIGINT,
  moved_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sales_channels (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(100) NOT NULL UNIQUE,
  channel_type VARCHAR(30) NOT NULL CHECK (channel_type IN ('web', 'marketplace', 'wholesale', 'direct'))
);

CREATE TABLE orders (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  order_number VARCHAR(40) NOT NULL UNIQUE,
  customer_id BIGINT NOT NULL REFERENCES customers(id),
  channel_id BIGINT REFERENCES sales_channels(id),
  billing_address_id BIGINT REFERENCES customer_addresses(id),
  shipping_address_id BIGINT REFERENCES customer_addresses(id),
  status VARCHAR(20) NOT NULL CHECK (
    status IN ('draft', 'pending', 'paid', 'processing', 'fulfilled', 'cancelled', 'refunded')
  ),
  currency_code CHAR(3) NOT NULL DEFAULT 'KES',
  subtotal_amount NUMERIC(14, 2) NOT NULL,
  discount_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  shipping_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(14, 2) NOT NULL,
  ordered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(14, 2) NOT NULL,
  unit_cost NUMERIC(14, 2) NOT NULL,
  tax_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(14, 2) NOT NULL DEFAULT 0
);

CREATE TABLE shipments (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  order_id BIGINT NOT NULL REFERENCES orders(id),
  warehouse_id BIGINT REFERENCES warehouses(id),
  carrier_name VARCHAR(120),
  tracking_number VARCHAR(120),
  shipment_status VARCHAR(20) NOT NULL CHECK (
    shipment_status IN ('queued', 'packed', 'dispatched', 'delivered', 'failed', 'returned')
  ),
  shipped_at TIMESTAMP,
  delivered_at TIMESTAMP
);

CREATE TABLE payment_methods (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(80) NOT NULL UNIQUE,
  provider VARCHAR(80)
);

CREATE TABLE payments (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  order_id BIGINT NOT NULL REFERENCES orders(id),
  payment_method_id BIGINT REFERENCES payment_methods(id),
  payment_reference VARCHAR(120),
  payment_status VARCHAR(20) NOT NULL CHECK (
    payment_status IN ('pending', 'authorized', 'captured', 'failed', 'refunded', 'partially_refunded')
  ),
  amount NUMERIC(14, 2) NOT NULL,
  paid_at TIMESTAMP
);

CREATE TABLE returns (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  order_id BIGINT NOT NULL REFERENCES orders(id),
  customer_id BIGINT NOT NULL REFERENCES customers(id),
  return_status VARCHAR(20) NOT NULL CHECK (
    return_status IN ('requested', 'approved', 'received', 'rejected', 'refunded')
  ),
  reason TEXT,
  requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE suppliers (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  supplier_code VARCHAR(40) NOT NULL UNIQUE,
  supplier_name VARCHAR(180) NOT NULL,
  contact_email VARCHAR(190),
  contact_phone VARCHAR(50)
);

CREATE TABLE purchase_orders (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  supplier_id BIGINT NOT NULL REFERENCES suppliers(id),
  warehouse_id BIGINT REFERENCES warehouses(id),
  po_number VARCHAR(40) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'ordered', 'received', 'partial', 'cancelled')),
  total_amount NUMERIC(14, 2) NOT NULL,
  ordered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE purchase_order_items (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  purchase_order_id BIGINT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_cost NUMERIC(14, 2) NOT NULL
);

CREATE TABLE invoices (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  customer_id BIGINT NOT NULL REFERENCES customers(id),
  order_id BIGINT REFERENCES orders(id),
  invoice_number VARCHAR(40) NOT NULL UNIQUE,
  invoice_status VARCHAR(20) NOT NULL CHECK (invoice_status IN ('draft', 'issued', 'part_paid', 'paid', 'void')),
  due_date DATE,
  subtotal_amount NUMERIC(14, 2) NOT NULL,
  tax_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(14, 2) NOT NULL,
  issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE expenses (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  supplier_id BIGINT REFERENCES suppliers(id),
  amount NUMERIC(14, 2) NOT NULL,
  expense_date DATE NOT NULL,
  description TEXT
);

CREATE TABLE ledger_accounts (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  account_code VARCHAR(30) NOT NULL UNIQUE,
  account_name VARCHAR(120) NOT NULL,
  account_type VARCHAR(30) NOT NULL CHECK (
    account_type IN ('asset', 'liability', 'equity', 'revenue', 'expense')
  )
);

CREATE TABLE journal_entries (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  reference_type VARCHAR(40),
  reference_id BIGINT,
  entry_date DATE NOT NULL,
  memo TEXT
);

CREATE TABLE journal_lines (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  journal_entry_id BIGINT NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  ledger_account_id BIGINT NOT NULL REFERENCES ledger_accounts(id),
  debit_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  credit_amount NUMERIC(14, 2) NOT NULL DEFAULT 0
);

CREATE TABLE analytics_daily_kpis (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  kpi_date DATE NOT NULL UNIQUE,
  gross_sales NUMERIC(14, 2) NOT NULL DEFAULT 0,
  net_sales NUMERIC(14, 2) NOT NULL DEFAULT 0,
  orders_count INTEGER NOT NULL DEFAULT 0,
  customers_count INTEGER NOT NULL DEFAULT 0,
  average_order_value NUMERIC(14, 2) NOT NULL DEFAULT 0,
  return_rate NUMERIC(6, 3) NOT NULL DEFAULT 0,
  net_margin_percent NUMERIC(6, 3) NOT NULL DEFAULT 0
);

CREATE TABLE analytics_product_performance (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  performance_date DATE NOT NULL,
  product_id BIGINT NOT NULL REFERENCES products(id),
  units_sold INTEGER NOT NULL DEFAULT 0,
  gross_revenue NUMERIC(14, 2) NOT NULL DEFAULT 0,
  gross_margin NUMERIC(14, 2) NOT NULL DEFAULT 0,
  UNIQUE (performance_date, product_id)
);

CREATE TABLE analytics_customer_cohorts (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  cohort_month DATE NOT NULL,
  acquisition_channel_id BIGINT REFERENCES sales_channels(id),
  customers_acquired INTEGER NOT NULL DEFAULT 0,
  retained_after_90_days INTEGER NOT NULL DEFAULT 0,
  lifetime_value NUMERIC(14, 2) NOT NULL DEFAULT 0,
  UNIQUE (cohort_month, acquisition_channel_id)
);

CREATE TABLE audit_logs (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id BIGINT REFERENCES app_users(id),
  action_name VARCHAR(120) NOT NULL,
  entity_name VARCHAR(120) NOT NULL,
  entity_id BIGINT,
  action_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
