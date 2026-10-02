/**
 * Shapes the API sends and accepts. Hand-maintained to match backend/app/schemas.py;
 * change both together.
 */

export type Role = "admin" | "staff" | "customer";

export type AuthUser = {
  id: string;
  email: string;
  user_metadata?: { full_name?: string };
};

export type Session = { access_token: string };

export type AuthResult = { token: string; user: AuthUser; roles: Role[]; must_change_password: boolean };

export type MeResult = { user: AuthUser; roles: Role[]; must_change_password: boolean };

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  price: number;
  cost: number;
  stock: number;
  unit: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Client {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  notify_on_restock: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Order {
  id: string;
  order_number: string;
  client_id?: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  status: string;
  payment_method: string | null;
  subtotal: number;
  total: number;
  notes: string | null;
  created_at: string;
  updated_at?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  unit_price: number;
  quantity: number;
  line_total: number;
  created_at?: string;
}

export interface Expense {
  id: string;
  category: string;
  description: string | null;
  amount: number;
  occurred_on: string;
  created_at?: string;
}

export type DashboardOverview = {
  stats: { revenue: number; orders: number; clients: number; products: number; lowStock: number };
  recentOrders: Order[];
};

export type DashboardReports = { orders: Order[]; order_items: OrderItem[] };

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ChatResponse = {
  reply: string;
  sources: { id: string; title: string }[];
  mode: "openai" | "retrieval";
};
