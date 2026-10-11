import type { ScanResponse } from "./scanApi";

export interface CrumbScoreResult {
  score: number | null;
  deductions: {
    trackers: number;
    requests: number;
    cookies: number;
    permissions: number;
  };
  limitations: string[];
}

/**
 * Higher score = more tracking exposure.
 *
 * This is an explainable exposure index, not a certified
 * security rating or proof that a website is malicious.
 */
export function calculateCrumbScore(
  scan: ScanResponse,
): CrumbScoreResult {
  const limitations: string[] = [];

  const knownTrackers = scan.trackers.filter(
    (tracker) => tracker.known_tracker,
  );

  const categoryWeights: Record<string, number> = {
    advertising: 7,
    fingerprinting: 9,
    social: 5,
    analytics: 3,
    other: 0,
  };

  const trackerDeduction = Math.min(
    45,
    knownTrackers.reduce(
      (total, tracker) =>
        total + (categoryWeights[tracker.category] ?? 0),
      0,
    ),
  );

  const requestDeduction = Math.min(
    20,
    Math.floor(scan.third_party_requests / 10),
  );

  const cookieDeduction = Math.min(
    20,
    Math.floor(scan.cookie_count / 5),
  );

  let permissionDeduction = 0;

  if (scan.permissions) {
    const settings = Object.values(scan.permissions);

    permissionDeduction =
      settings.filter((setting) => setting === "allow").length * 4;

    if (settings.includes("unknown")) {
      limitations.push(
        "Some site permission settings were unavailable.",
      );
    }
  } else {
    limitations.push("Site permission settings were unavailable.");
  }

  if (scan.cookie_analysis?.incomplete) {
    limitations.push(
      "Cookie-store inventory may be incomplete.",
    );
  }

  if (scan.cookie_analysis?.partitioned_count == null) {
    limitations.push(
      "Partitioned cookie coverage was not measured.",
    );
  }

  // No reliable request evidence: don't imply the site
  // has no tracking exposure.
  if (
    scan.third_party_requests === 0 &&
    scan.trackers.length === 0
  ) {
    limitations.push(
      "No third-party requests were captured. The scan may have missed page-load activity.",
    );

    return {
      score: null,
      deductions: {
        trackers: 0,
        requests: 0,
        cookies: 0,
        permissions: 0,
      },
      limitations,
    };
  }

  const deductions = {
    trackers: trackerDeduction,
    requests: requestDeduction,
    cookies: cookieDeduction,
    permissions: permissionDeduction,
  };

  const score = Math.min(
    100,
    trackerDeduction +
      requestDeduction +
      cookieDeduction +
      permissionDeduction,
  );

  return {
    score,
    deductions,
    limitations,
  };
}
