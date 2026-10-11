/**
 * Mock scan data for the dashboard.
 * Swap MOCK_SCANS for real data from the backend later; the shapes below are the contract.
 */
import type { CookieAnalysis } from "../lib/cookieAnalysis";
import type { PermissionAnalysis } from "../lib/permissionAnalysis";
export type Category = "advertising" | "analytics" | "social" | "fingerprint" | "unknown";
export type KnownCategory = Exclude<Category, "unknown">;

export const CATEGORY_META: Record<Category, { label: string; color: string; why: string }> = {
  advertising: {
    label: "Advertising",
    color: "#C6E3AA", // green frosting (extension)
    why: "Builds a profile of the sites you visit so ads can follow you around the web.",
  },
  analytics: {
    label: "Analytics",
    color: "#F0A8A2", // pink frosting (extension)
    why: "Counts your visits, clicks and scrolling so the site can see what people do.",
  },
  social: {
    label: "Social",
    color: "#A9D8DA", // blue frosting (extension)
    why: "Lets a social network know you visited this page, even if you never clicked Like or Share.",
  },
  fingerprint: {
    label: "Fingerprint",
    color: "#F2C08F", // peach (crumb test mockup)
    why: "Recognizes your device from its settings, with no cookie needed. Clearing cookies won't stop it.",
  },
  unknown: {
    label: "Unknown",
    color: "#BDBDBD", // gray (crumb test mockup), drawn dashed
    why: "This domain isn't on the known tracker list, so we can't say for sure what it does.",
  },
};

export const CATEGORY_ORDER: KnownCategory[] = ["advertising", "analytics", "social", "fingerprint"];


export interface Tracker {
  id: string;
  domain: string;
  category: Category;
  requests: number;
  cookies: number | null;
  known: boolean;
  owner?: string;
  via?: string;
  ai?: {
    guess: KnownCategory;
    confidence: number;
    reason: string;
  };
}

export interface SiteScan {
  domain: string;
  score: number | null;
  scannedAt: string;
  cookies: number;
  thirdPartyRequests: number;
  permissions: string[] | null;
  trackers: Tracker[];
  cookieAnalysis?: CookieAnalysis | null;
  permissionSettings?: PermissionAnalysis | null;
}

export function scoreLabel(score: number) {
  if (score >= 75) return "Covered in crumbs";
  if (score >= 50) return "A few too many crumbs left behind";
  if (score >= 25) return "Just a sprinkle of crumbs";
  return "Practically crumb-free";
}

export function countByCategory(trackers: Tracker[]) {
  const counts: Record<Category, number> = { advertising: 0, analytics: 0, social: 0, fingerprint: 0, unknown: 0 };
  trackers.forEach((t) => counts[t.category]++);
  return counts;
}

// small helper to keep the mock lists readable
let n = 0;
function t(domain: string, category: Category, requests: number, cookies: number, extra: Partial<Tracker> = {}): Tracker {
  n++;
  return { id: extra.id ?? `t${n}`, domain, category, requests, cookies, known: category !== "unknown", ...extra };
}

export const MOCK_SCANS: SiteScan[] = [
  {
    domain: "espn.com",
    score: 62,
    scannedAt: "Oct 10, 9:41 AM",
    cookies: 48,
    thirdPartyRequests: 93,
    permissions: ["Location", "Notifications", "Clipboard"],
    trackers: [
      t("doubleclick.net", "advertising", 24, 9, { id: "dc", owner: "Google" }),
      t("adnxs.com", "advertising", 8, 4, { owner: "Microsoft (Xandr)", via: "dc" }),
      t("pxl-sync.io", "unknown", 6, 2, {
        via: "dc",
        ai: { guess: "advertising", confidence: 0.64, reason: "Fires right after ad requests and sets a long-lived ID cookie, a pattern common to ad syncing." },
      }),
      t("rubiconproject.com", "advertising", 11, 5, { id: "rb", owner: "Magnite" }),
      t("casalemedia.com", "advertising", 5, 3, { owner: "Index Exchange", via: "rb" }),
      t("criteo.com", "advertising", 7, 4, { owner: "Criteo" }),
      t("google-analytics.com", "analytics", 9, 4, { owner: "Google" }),
      t("hotjar.com", "analytics", 6, 3, { owner: "Hotjar" }),
      t("cdn-metrics.xyz", "unknown", 4, 1, {
        ai: { guess: "analytics", confidence: 0.71, reason: "Sends small beacons on every page load and scroll, similar to visit counters." },
      }),
      t("connect.facebook.net", "social", 5, 4, { owner: "Meta" }),
      t("platform.twitter.com", "social", 3, 2, { owner: "X" }),
      t("fpjs.io", "fingerprint", 4, 0, { owner: "FingerprintJS" }),
    ],
  },
  {
    domain: "cnn.com",
    score: 82,
    scannedAt: "Oct 10, 9:52 AM",
    cookies: 131,
    thirdPartyRequests: 214,
    permissions: ["Location", "Notifications"],
    trackers: [
      t("doubleclick.net", "advertising", 31, 12, { id: "dc2", owner: "Google" }),
      t("adnxs.com", "advertising", 12, 6, { owner: "Microsoft (Xandr)", via: "dc2" }),
      t("pubmatic.com", "advertising", 9, 5, { owner: "PubMatic", via: "dc2" }),
      t("taboola.com", "advertising", 14, 8, { id: "tb", owner: "Taboola" }),
      t("outbrain.com", "advertising", 10, 6, { owner: "Outbrain", via: "tb" }),
      t("criteo.com", "advertising", 8, 5, { owner: "Criteo" }),
      t("amazon-adsystem.com", "advertising", 7, 4, { owner: "Amazon" }),
      t("google-analytics.com", "analytics", 11, 5, { owner: "Google" }),
      t("chartbeat.com", "analytics", 9, 3, { owner: "Chartbeat" }),
      t("scorecardresearch.com", "analytics", 6, 4, { owner: "Comscore" }),
      t("newrelic.com", "analytics", 5, 1, { owner: "New Relic" }),
      t("connect.facebook.net", "social", 6, 4, { owner: "Meta" }),
      t("platform.twitter.com", "social", 4, 2, { owner: "X" }),
      t("snap.licdn.com", "social", 3, 2, { owner: "LinkedIn" }),
      t("fpjs.io", "fingerprint", 5, 0, { owner: "FingerprintJS" }),
      t("track-edge.net", "unknown", 7, 3, {
        ai: { guess: "fingerprint", confidence: 0.58, reason: "Reads canvas and font details without setting cookies, which looks like device fingerprinting." },
      }),
    ],
  },
  {
    domain: "allrecipes.com",
    score: 41,
    scannedAt: "Oct 10, 10:03 AM",
    cookies: 19,
    thirdPartyRequests: 37,
    permissions: [],
    trackers: [
      t("doubleclick.net", "advertising", 6, 3, { owner: "Google" }),
      t("mediavine.com", "advertising", 5, 2, { owner: "Mediavine" }),
      t("google-analytics.com", "analytics", 4, 2, { owner: "Google" }),
      t("plausible.io", "analytics", 2, 0, { owner: "Plausible" }),
      t("pinterest.com", "social", 3, 1, { owner: "Pinterest" }),
      t("connect.facebook.net", "social", 2, 1, { owner: "Meta" }),
      t("stat-ping.co", "unknown", 2, 0, {
        ai: { guess: "analytics", confidence: 0.67, reason: "One small request per page view with page path info, like a lightweight counter." },
      }),
    ],
  },
];
