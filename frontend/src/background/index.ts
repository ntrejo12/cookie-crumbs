type RequestCounts = Record<string, number>;

interface TabScan {
  website: string;
  requests: RequestCounts;
}

const scans = new Map<number, TabScan>();

function getHostname(url: string): string | null {
  try {
    const parsed = new URL(url);

    if (
      parsed.protocol !== "http:" &&
      parsed.protocol !== "https:"
    ) {
      return null;
    }

    return parsed.hostname.toLowerCase();
  } catch {
    return null;
  }
}

// MVP approximation of whether a request is third-party.
// A production implementation should use a public suffix list
// to handle domains such as example.co.uk correctly.
function isThirdParty(
  requestDomain: string,
  websiteDomain: string
): boolean {
  const getBaseDomain = (domain: string) =>
    domain.split(".").slice(-2).join(".");

  return (
    getBaseDomain(requestDomain) !==
    getBaseDomain(websiteDomain)
  );
}

chrome.tabs.onUpdated.addListener(
  (tabId, changeInfo) => {
    if (!changeInfo.url) return;

    const website = getHostname(changeInfo.url);

    if (!website) {
      scans.delete(tabId);
      return;
    }

    // Reset the scan when the tab navigates.
    scans.set(tabId, {
      website,
      requests: {},
    });
  }
);

chrome.tabs.onRemoved.addListener((tabId) => {
  scans.delete(tabId);
});

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (details.tabId < 0) return;

    const scan = scans.get(details.tabId);
    if (!scan) return;

    const requestDomain = getHostname(details.url);
    if (!requestDomain) return;

    if (!isThirdParty(requestDomain, scan.website)) {
      return;
    }

    scan.requests[requestDomain] =
      (scan.requests[requestDomain] ?? 0) + 1;
  },
  {
    urls: ["http://*/*", "https://*/*"]
  }
);

chrome.runtime.onMessage.addListener(
  (message, sender, sendResponse) => {
    if (message.type !== "GET_TAB_SCAN") {
      return;
    }

    const tabId = message.tabId as number;
    const scan = scans.get(tabId);

    sendResponse(
      scan ?? {
        website: "",
        requests: {},
      }
    );
  }
);

console.log("Cookie Crumbs tracker collection active!");
