import { request } from "@/services/http";
import type { StorefrontCategory, StorefrontPage, StorefrontProduct } from "@/types/api";

/** The public website's catalog. Products come only from the POS (backend/app/api/routes/public.py). */
export const storefrontApi = {
  list: (params: { page?: number; pageSize?: number; category?: string; q?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.page) q.set("page", String(params.page));
    if (params.pageSize) q.set("page_size", String(params.pageSize));
    if (params.category) q.set("category", params.category);
    if (params.q) q.set("q", params.q);
    const qs = q.toString();
    return request<StorefrontPage>(`/api/public/products${qs ? `?${qs}` : ""}`);
  },
  get: (idOrSlug: string) => request<StorefrontProduct>(`/api/public/products/${encodeURIComponent(idOrSlug)}`),
  categories: () => request<StorefrontCategory[]>("/api/public/categories"),
};
