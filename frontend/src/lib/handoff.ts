export const WEBSITE_ORIGIN =
  import.meta.env.VITE_WEBSITE_ORIGIN ?? "http://localhost:5173";
export const HANDOFF_REQUEST = "COOKIE_CRUMBS_HANDOFF_REQUEST";
export const HANDOFF_RESPONSE = "COOKIE_CRUMBS_HANDOFF_RESPONSE";
export const HANDOFF_STORAGE_PREFIX = "cookie-crumbs-handoff:";
export const HANDOFF_EXPIRATION_MS = 2 * 60 * 1000;
const HANDOFF_DEBUG = import.meta.env.VITE_HANDOFF_DEBUG === "true";

export function handoffDebug(
  message: string,
  details?: Record<string, unknown>,
) {
  if (!HANDOFF_DEBUG) return;
  console.debug("[CookieCrumbs Handoff]", message, details ?? "");
}

export interface HandoffRequest {
  type: typeof HANDOFF_REQUEST;
  token: string;
}

export interface HandoffResponse {
  type: typeof HANDOFF_RESPONSE;
  token: string;
  scan: unknown;
}
