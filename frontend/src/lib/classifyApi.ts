import type { SiteScan } from "../data/mockScans";
import type { AITrackerClassification } from "./aiApi";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "http://127.0.0.1:8000";

export async function classifyUnfamiliarDomains(
  scan: SiteScan,
): Promise<AITrackerClassification[]> {
  const unknown = scan.trackers.filter(
    (tracker) => !tracker.known,
  );

  if (unknown.length === 0) {
    return [];
  }

  const response = await fetch(`${API_BASE_URL}/api/classify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      domains: unknown.map((tracker) => ({
        domain: tracker.domain,
        request_count: tracker.requests,
        is_third_party: true,
      })),
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Classification failed (HTTP ${response.status}).`,
    );
  }

  return (await response.json()) as AITrackerClassification[];
}
