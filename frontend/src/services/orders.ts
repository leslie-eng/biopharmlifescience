import { request } from "@/services/http";
import type { Order, OrderItem } from "@/types/api";

export const ordersApi = {
  list: () => request<Order[]>("/api/orders"),
  items: (orderId: string) => request<OrderItem[]>(`/api/orders/${orderId}/items`),
  updateStatus: (id: string, status: string) =>
    request<Order>(`/api/orders/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
  create: (body: {
    order: Partial<Order>;
    items: Partial<OrderItem>[];
  }) => request<Order>("/api/orders", { method: "POST", body: JSON.stringify(body) }),
};
