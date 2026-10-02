import { request } from "@/services/http";
import type { Expense } from "@/types/api";

export const expensesApi = {
  list: () => request<Expense[]>("/api/expenses"),
  create: (body: Partial<Expense>) =>
    request<Expense>("/api/expenses", { method: "POST", body: JSON.stringify(body) }),
  delete: (id: string) => request<{ ok: boolean }>(`/api/expenses/${id}`, { method: "DELETE" }),
};
