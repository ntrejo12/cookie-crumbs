import { getDomain } from "tldts";

export interface CookieAnalysis {
  first_party_count: number | null;
  third_party_domain_count: number | null;
  secure_count: number | null;
  http_only_count: number | null;
  session_count: number | null;
  persistent_count: number | null;
  same_site_none_count: number | null;
  partitioned_count: number | null;
  examined_count: number | null;
  third_party_domains_checked: number;
  incomplete: boolean;
}

function siteDomain(hostname: string): string {
  return getDomain(hostname) ?? hostname.toLowerCase();
}

function cookieIdentity(cookie: chrome.cookies.Cookie): string {
  return [
    cookie.storeId,
    cookie.domain,
    cookie.path,
    cookie.name,
    cookie.partitionKey?.topLevelSite ?? "",
    String(cookie.partitionKey?.hasCrossSiteAncestor ?? ""),
  ].join("\u0000");
}

function countProperties(cookies: chrome.cookies.Cookie[]) {
  return {
    secure_count: cookies.filter((cookie) => cookie.secure).length,
    http_only_count: cookies.filter((cookie) => cookie.httpOnly).length,
    session_count: cookies.filter((cookie) => cookie.session).length,
    persistent_count: cookies.filter((cookie) => !cookie.session).length,
    same_site_none_count: cookies.filter(
      (cookie) => cookie.sameSite === "no_restriction",
    ).length,
  };
}

/**
 * Cookie-store inventory for the active site and observed
 * third-party request domains. This does not prove which
 * cookies were transmitted in network requests.
 */
export async function analyzeCookies(
  pageUrl: string,
  observedDomains: string[],
): Promise<CookieAnalysis> {
  const pageHostname = new URL(pageUrl).hostname.toLowerCase();
  const firstPartySite = siteDomain(pageHostname);

  const empty: CookieAnalysis = {
    first_party_count: null,
    third_party_domain_count: null,
    secure_count: null,
    http_only_count: null,
    session_count: null,
    persistent_count: null,
    same_site_none_count: null,
    partitioned_count: null,
    examined_count: null,
    third_party_domains_checked: 0,
    incomplete: true,
  };

  let pageCookies: chrome.cookies.Cookie[];

  try {
    pageCookies = await chrome.cookies.getAll({
      url: pageUrl,
    });
  } catch (error) {
    console.warn("Unable to read page cookies:", error);
    return empty;
  }

  const thirdPartyDomains = [
    ...new Set(
      observedDomains
        .map((domain) => domain.toLowerCase())
        .filter((domain) => {
          return siteDomain(domain) !== firstPartySite;
        }),
    ),
  ];

  const found = new Map<string, chrome.cookies.Cookie>();

  for (const cookie of pageCookies) {
    found.set(cookieIdentity(cookie), cookie);
  }

  let incomplete = false;

  // Query the cookie store for observed third-party domains.
  // Use exact domain matching below to avoid counting unrelated
  // suffix matches as if they belonged to the observed host.
  const results = await Promise.allSettled(
    thirdPartyDomains.map((domain) =>
      chrome.cookies.getAll({ domain }),
    ),
  );

  let checked = 0;

  for (let i = 0; i < results.length; i++) {
    const result = results[i];

    if (result.status !== "fulfilled") {
      incomplete = true;
      continue;
    }

    checked++;

    const observedSite = siteDomain(thirdPartyDomains[i]);

    for (const cookie of result.value) {
      if (siteDomain(cookie.domain.replace(/^\./, "")) !== observedSite) {
        continue;
      }

      found.set(cookieIdentity(cookie), cookie);
    }
  }

  const allCookies = [...found.values()];

  const firstPartyCookies = allCookies.filter(
    (cookie) =>
      siteDomain(cookie.domain.replace(/^\./, "")) === firstPartySite,
  );

  const thirdPartyCookies = allCookies.filter(
    (cookie) =>
      siteDomain(cookie.domain.replace(/^\./, "")) !== firstPartySite,
  );

  const counts = countProperties(allCookies);

  return {
    first_party_count: firstPartyCookies.length,
    third_party_domain_count: incomplete
      ? null
      : thirdPartyCookies.length,
    ...counts,
    // Ordinary getAll calls don't necessarily enumerate all
    // partitioned cookie jars, so don't claim completeness.
    partitioned_count: null,
    examined_count: allCookies.length,
    third_party_domains_checked: checked,
    incomplete,
  };
}
