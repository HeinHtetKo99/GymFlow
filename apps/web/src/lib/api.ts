import { API_URL, DEFAULT_GYM_CODE } from "./config";
import { getGymCode } from "./auth";

export type ApiError = {
  message: string;
  errors?: Record<string, string[]>;
};

async function readJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & {
    token?: string | null;
    gymCode?: string | null;
    skipGym?: boolean;
  } = {},
): Promise<T> {
  const url = `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (!options.skipGym) {
    const slug = options.gymCode ?? getGymCode() ?? DEFAULT_GYM_CODE;
    headers.set("X-Gym", slug);
  }

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  const token = options.token;
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(url, {
    ...options,
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    const data = await readJson<ApiError>(res).catch(() => null);
    const message = data?.message ?? `Request failed (${res.status}).`;
    const err = new Error(message) as Error & { status?: number; data?: ApiError };
    err.status = res.status;
    if (data) err.data = data;
    throw err;
  }

  return readJson<T>(res);
}
