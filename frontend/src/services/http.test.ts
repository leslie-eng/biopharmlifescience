import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, request } from "./http";

afterEach(() => vi.unstubAllGlobals());

describe("request", () => {
  it("turns an unreachable or CORS-blocked API into a readable NETWORK_ERROR", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    const error = await request<never>("/api/auth/login", { method: "POST" }).catch((e: ApiError) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.code).toBe("NETWORK_ERROR");
    expect(error.message).toMatch(/can't reach the server/i);
  });

  it("passes the API's error envelope through", async () => {
    const body = JSON.stringify({ error: "Invalid email or password", code: "INVALID_CREDENTIALS" });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(body, { status: 401 })));

    const error = await request<never>("/api/auth/login", { method: "POST" }).catch((e: ApiError) => e);

    expect([error.status, error.code, error.message]).toEqual([401, "INVALID_CREDENTIALS", "Invalid email or password"]);
  });
});
