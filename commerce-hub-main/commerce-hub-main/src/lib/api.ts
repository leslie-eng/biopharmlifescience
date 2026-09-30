const API_BASE = import.meta.env.VITE_API_URL || "";

const TOKEN_KEY = "auth_token";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function parseResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    throw new ApiError(data.error || res.statusText, res.status);
  }
  return data as T;
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  return parseResponse<T>(res);
}

export async function uploadProductImage(file: File): Promise<{ url: string }> {
  const token = getToken();
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/api/uploads/product-image`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  return parseResponse(res);
}

export const authApi = {
  login: (body: { email: string; password: string }) =>
    api<{ token: string; user: AuthUser; roles: Role[] }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  me: () => api<{ user: AuthUser; roles: Role[] }>("/api/auth/me"),
};

export type Role = "admin" | "staff" | "customer";

export type AuthUser = {
  id: string;
  email: string;
  user_metadata?: { full_name?: string };
};

export type Session = { access_token: string };

export const productsApi = {
  list: (params?: { active?: boolean; staff?: boolean }) => {
    const q = new URLSearchParams();
    if (params?.active) q.set("active", "true");
    if (params?.staff) q.set("staff", "true");
    const qs = q.toString();
    return api<Product[]>(`/api/products${qs ? `?${qs}` : ""}`);
  },
  create: (body: Partial<Product>) =>
    api<Product>("/api/products", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: Partial<Product>) =>
    api<Product>(`/api/products/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (id: string) => api<{ ok: boolean }>(`/api/products/${id}`, { method: "DELETE" }),
};

export const clientsApi = {
  list: () => api<Client[]>("/api/clients"),
  create: (body: Partial<Client>) =>
    api<Client>("/api/clients", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: Partial<Client>) =>
    api<Client>(`/api/clients/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (id: string) => api<{ ok: boolean }>(`/api/clients/${id}`, { method: "DELETE" }),
};

export const ordersApi = {
  list: () => api<Order[]>("/api/orders"),
  items: (orderId: string) => api<OrderItem[]>(`/api/orders/${orderId}/items`),
  updateStatus: (id: string, status: string) =>
    api<Order>(`/api/orders/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
  create: (body: {
    order: Partial<Order>;
    items: Partial<OrderItem>[];
  }) => api<Order>("/api/orders", { method: "POST", body: JSON.stringify(body) }),
};

export const expensesApi = {
  list: () => api<Expense[]>("/api/expenses"),
  create: (body: Partial<Expense>) =>
    api<Expense>("/api/expenses", { method: "POST", body: JSON.stringify(body) }),
  delete: (id: string) => api<{ ok: boolean }>(`/api/expenses/${id}`, { method: "DELETE" }),
};

export const stockInterestApi = {
  create: (body: { product_id: string; email: string }) =>
    api("/api/stock-interest", { method: "POST", body: JSON.stringify(body) }),
};

export const dashboardApi = {
  overview: () =>
    api<{
      stats: { revenue: number; orders: number; clients: number; products: number; lowStock: number };
      recentOrders: Order[];
    }>("/api/dashboard/overview"),
  reports: (since: string) =>
    api<{ orders: Order[]; order_items: OrderItem[] }>(
      `/api/dashboard/reports?since=${encodeURIComponent(since)}`
    ),
};

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
