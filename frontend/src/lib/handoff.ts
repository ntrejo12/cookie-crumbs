export const WEBSITE_ORIGIN =
  import.meta.env.VITE_WEBSITE_ORIGIN ?? "http://localhost:5173";
export const HANDOFF_REQUEST = "COOKIE_CRUMBS_HANDOFF_REQUEST";
export const HANDOFF_RESPONSE = "COOKIE_CRUMBS_HANDOFF_RESPONSE";
export const HANDOFF_STORAGE_PREFIX = "cookie-crumbs-handoff:";
export const HANDOFF_EXPIRATION_MS = 2 * 60 * 1000;

export interface HandoffRequest {
  type: typeof HANDOFF_REQUEST;
  token: string;
}

export interface HandoffResponse {
  type: typeof HANDOFF_RESPONSE;
  token: string;
  scan: unknown;
}
