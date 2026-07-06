export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export const DEFAULT_GYM_CODE =
  process.env.NEXT_PUBLIC_TENANT_SLUG ?? "gymflow";

/** Show demo login shortcuts on `/login`. Enabled in dev unless explicitly disabled. */
export const SHOW_DEMO_ACCOUNTS =
  process.env.NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS === "true" ||
  (process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS !== "false");
