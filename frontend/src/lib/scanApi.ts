const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

import type { CookieAnalysis } from "./cookieAnalysis";
import type { PermissionAnalysis } from "./permissionAnalysis";

export interface NetworkRequest {
  domain: string;
  request_count: number;
}

export interface ScanRequest {
  website: string;
  requests: NetworkRequest[];
  cookies: {
    total: number;
    third_party: number | null;
    analysis: CookieAnalysis | null;
  };
  permission_count: number | null;
  permissions: PermissionAnalysis | null;
}

export interface TrackerInfo {
  domain: string;
  category:
    | "advertising"
    | "analytics"
    | "social"
    | "fingerprinting"
    | "other";
  request_count: number;
  known_tracker: boolean;
  description: string | null;
}

export interface ScanResponse {
  website: string;
  tracker_count: number;
  third_party_requests: number;
  cookie_count: number;
  permission_count: number | null;
  trackers: TrackerInfo[];
  category_counts: Record<string, number>;
  cookie_analysis: CookieAnalysis | null;
  permissions: PermissionAnalysis | null;
}

export async function analyzeScan(
  scan: ScanRequest
): Promise<ScanResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/scans/analyze`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(scan),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Scan analysis failed: HTTP ${response.status}`
    );
  }

  return (await response.json()) as ScanResponse;
}
