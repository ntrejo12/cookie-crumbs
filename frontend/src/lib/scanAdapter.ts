import type { ScanResponse } from "./scanApi";
import type {
  Category,
  SiteScan,
  Tracker,
} from "../data/mockScans";

export interface SharedScan {
  version: 1;
  analyzedAt: string;
  result: ScanResponse;
}

export function isSharedScan(value: unknown): value is SharedScan {
  if (!value || typeof value !== "object") return false;

  const shared = value as Partial<SharedScan>;
  if (shared.version !== 1) return false;
  if (typeof shared.analyzedAt !== "string") return false;

  const result = shared.result;
  if (!result || typeof result !== "object") return false;
  if (typeof result.website !== "string") return false;
  if (!/^[a-z0-9.-]{1,253}$/i.test(result.website)) return false;

  if (!Array.isArray(result.trackers) || result.trackers.length > 500) {
    return false;
  }

  if (
    typeof result.tracker_count !== "number" ||
    typeof result.third_party_requests !== "number" ||
    typeof result.cookie_count !== "number"
  ) {
    return false;
  }

  const categories = new Set([
    "advertising",
    "analytics",
    "social",
    "fingerprinting",
    "other",
  ]);

  return result.trackers.every((tracker) => (
    tracker &&
    typeof tracker.domain === "string" &&
    /^[a-z0-9.-]{1,253}$/i.test(tracker.domain) &&
    categories.has(tracker.category) &&
    Number.isSafeInteger(tracker.request_count) &&
    tracker.request_count >= 0 &&
    typeof tracker.known_tracker === "boolean"
  ));
}

// the scanner says "fingerprinting" and "other"; the dashboard calls them "fingerprint" and "unknown"
function toCategory(category: string): Category {
  if (category === "fingerprinting") return "fingerprint";
  if (category === "other") return "unknown";
  return category as Category;
}

export function toSiteScan(shared: SharedScan): SiteScan {
  const result = shared.result;

  const trackers: Tracker[] = result.trackers.map((tracker) => ({
    id: tracker.domain,
    domain: tracker.domain,
    category: toCategory(tracker.category),
    requests: tracker.request_count,
    cookies: null,
    known: tracker.known_tracker,
  }));

  return {
  domain: result.website,
  score: null,
  scannedAt: new Date(shared.analyzedAt).toLocaleString(),
  cookies: result.cookie_count,
  thirdPartyRequests: result.third_party_requests,
  permissions: null,
  trackers,
  cookieAnalysis: result.cookie_analysis,
  permissionSettings: result.permissions,
};
}
