import type { SiteScan } from "../data/mockScans";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "http://127.0.0.1:8000";

export interface AITrackerClassification {
  name: string;
  company: string | null;
  category: string | null;
  risk_level: "low" | "medium" | "high" | "unknown" | null;
  confidence: number | null;
  source: "known_list" | "model" | "heuristic" | null;
  verified: boolean;
  request_count: number;
  explanation: string | null;
}

export interface AIAnalysisResponse {
  explanation: string;
  risk_summary: string | null;
  data_collected: string[];
  possible_uses: string[];
  protections: string[];
  recommendations: string[];
  uncertainty_note: string | null;
  tracker_classifications: AITrackerClassification[];
  generated_by: "model" | "template";
}

export async function analyzeSiteWithAI(
  scan: SiteScan,
  authenticatedHeaders: Record<string, string>,
): Promise<AIAnalysisResponse> {
  const allowedPermissions = Object.entries(
    scan.permissionSettings ?? {},
  )
    .filter(([, value]) => value === "allow")
    .map(([name]) => name);

  const response = await fetch(
    `${API_BASE_URL}/api/ai/analyze-scan`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authenticatedHeaders,
      },
      body: JSON.stringify({
        website: scan.domain,
        cookie_count: scan.cookies,
        permissions: allowedPermissions,
        domains: scan.trackers.map((tracker) => ({
          domain: tracker.domain,
          request_count: tracker.requests,
          is_third_party: true,
        })),
      }),
    },
  );

  if (!response.ok) {
    let detail = `AI analysis failed: HTTP ${response.status}`;

    try {
      const body = await response.json();
      if (typeof body.detail === "string") {
        detail = body.detail;
      }
    } catch {
      // Keep the HTTP error.
    }

    throw new Error(detail);
  }

  return (await response.json()) as AIAnalysisResponse;
}
