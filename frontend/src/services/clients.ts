import { request } from "@/services/http";
import type { Client } from "@/types/api";

export const clientsApi = {
  list: () => request<Client[]>("/api/clients"),
  create: (body: Partial<Client>) =>
    request<Client>("/api/clients", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: Partial<Client>) =>
    request<Client>(`/api/clients/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (id: string) => request<{ ok: boolean }>(`/api/clients/${id}`, { method: "DELETE" }),
};
