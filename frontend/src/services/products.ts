import { request } from "@/services/http";
import type { Product } from "@/types/api";

export const productsApi = {
  list: (params?: { active?: boolean; staff?: boolean }) => {
    const q = new URLSearchParams();
    if (params?.active) q.set("active", "true");
    if (params?.staff) q.set("staff", "true");
    const qs = q.toString();
    return request<Product[]>(`/api/products${qs ? `?${qs}` : ""}`);
  },
  create: (body: Partial<Product>) =>
    request<Product>("/api/products", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: Partial<Product>) =>
    request<Product>(`/api/products/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (id: string) => request<{ ok: boolean }>(`/api/products/${id}`, { method: "DELETE" }),
};

export async function uploadProductImage(file: File): Promise<{ url: string }> {
  const form = new FormData();
  form.append("file", file);
  return request<{ url: string }>("/api/uploads/product-image", { method: "POST", body: form });
}
