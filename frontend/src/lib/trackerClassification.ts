import { getDomain } from "tldts";
import type { AITrackerClassification } from "./aiApi";
import type { Category } from "../data/mockScans";

export function normalizeTrackerDomain(value: string): string {
  const trimmed = value.trim().toLowerCase();

  try {
    const url = new URL(
      trimmed.includes("://") ? trimmed : `https://${trimmed}`,
    );

    return url.hostname.replace(/\.$/, "");
  } catch {
    return trimmed.replace(/\.$/, "");
  }
}

export function findTrackerClassification(
  domain: string,
  classifications: AITrackerClassification[],
): AITrackerClassification | undefined {
  const hostname = normalizeTrackerDomain(domain);

  // Prefer an exact hostname match.
  const exact = classifications.find(
    (item) => normalizeTrackerDomain(item.name) === hostname,
  );

  if (exact) return exact;

  // The Python classifier returns registrable domains.
  const baseDomain = getDomain(hostname);

  if (!baseDomain) return undefined;

  return classifications.find(
    (item) => normalizeTrackerDomain(item.name) === baseDomain,
  );
}

export function toDashboardCategory(
  category: string | null | undefined,
): Category | null {
  switch (category?.toLowerCase()) {
    case "advertising":
      return "advertising";
    case "analytics":
      return "analytics";
    case "social":
      return "social";
    case "fingerprinting":
    case "fingerprint":
      return "fingerprint";
    default:
      return null;
  }
}
