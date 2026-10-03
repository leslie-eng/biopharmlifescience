/**
 * The one place the frontend talks HTTP to the API. Domain services (auth, products, …)
 * build on `request`; components never call fetch themselves.
 *
 * VITE_API_URL is the API origin (e.g. https://api.biopharmlifescience.co.ke). Leave it
 * empty in local dev: Vite proxies /api to the backend (vite.config.ts).
 */
const API_BASE = import.meta.env.VITE_API_URL || "";

const TOKEN_KEY = "auth_token";

/** An error response from the API: `{ error, code }` (backend/app/core/errors.py). */
export class ApiError extends Error {
  status: number;
  /** Stable machine-readable code, e.g. INVALID_CREDENTIALS. Empty if the response had none. */
  code: string;
  constructor(message: string, status: number, code = "") {
    super(message);
    this.status = status;
    this.code = code;
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
  let data: Record<string, unknown> = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    // Not JSON (e.g. an HTML page because VITE_API_URL points at the wrong host).
    if (res.ok) throw new ApiError("Unexpected response from the server", res.status, "BAD_RESPONSE");
  }
  if (!res.ok) {
    throw new ApiError(
      typeof data.error === "string" ? data.error : res.statusText,
      res.status,
      typeof data.code === "string" ? data.code : "",
    );
  }
  return data as T;
}

/** Call the API. JSON bodies get a JSON content type; FormData is sent as multipart. */
export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch {
    // fetch only rejects when no response arrived: offline, the API down, or blocked by CORS.
    throw new ApiError(
      "Can't reach the server. Check your connection and try again; if this keeps happening, the API may be down or refusing this site (CORS).",
      0,
      "NETWORK_ERROR",
    );
  }
  return parseResponse<T>(res);
}
