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

/** Set or replace a product's photo (JPEG, PNG or WebP, max 5 MB); the old one is deleted. */
export function uploadProductImage(productId: string, file: File): Promise<Product> {
  const form = new FormData();
  form.append("file", file);
  return request<Product>(`/api/products/${productId}/image`, { method: "POST", body: form });
}

export function removeProductImage(productId: string): Promise<Product> {
  return request<Product>(`/api/products/${productId}/image`, { method: "DELETE" });
}
