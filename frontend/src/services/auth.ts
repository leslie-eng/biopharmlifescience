import { request } from "@/services/http";
import type { AuthResult, MeResult } from "@/types/api";

export const authApi = {
  login: (body: { email: string; password: string }) =>
    request<AuthResult>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  me: () => request<MeResult>("/api/auth/me"),
  changePassword: (body: { current_password: string; new_password: string }) =>
    request<AuthResult>("/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};
