const TOKEN_KEY = "gymflow.token";
const USER_KEY = "gymflow.user";
const GYM_KEY = "gymflow.gym";

export type AuthUser = {
  id: number;
  gym_id: number;
  name: string;
  email: string;
  role: string;
};

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  window.localStorage.removeItem(TOKEN_KEY);
}

export function getUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setUser(user: AuthUser): void {
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearUser(): void {
  window.localStorage.removeItem(USER_KEY);
}

export function getGymCode(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(GYM_KEY);
}

export function setGymCode(slug: string): void {
  window.localStorage.setItem(GYM_KEY, slug);
}

export function clearGymCode(): void {
  window.localStorage.removeItem(GYM_KEY);
}

export function logoutLocal(): void {
  clearToken();
  clearUser();
  clearGymCode();
}
