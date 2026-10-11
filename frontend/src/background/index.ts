import {
  HANDOFF_REQUEST,
  HANDOFF_RESPONSE,
  HANDOFF_STORAGE_PREFIX,
  HANDOFF_EXPIRATION_MS,
  WEBSITE_ORIGIN,
  handoffDebug,
} from "../lib/handoff";
import { getDomain } from "tldts";

type RequestCounts = Record<string, number>;

interface TabScan {
  website: string;
  requests: RequestCounts;
}

interface PendingHandoff {
  token: string;
  createdAt: number;
  scan: unknown;
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
  websiteDomain: string,
): boolean {
  const requestSite = getDomain(requestDomain);
  const websiteSite = getDomain(websiteDomain);

  if (!requestSite || !websiteSite) {
    return requestDomain !== websiteDomain;
  }

  return requestSite !== websiteSite;
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
    if (message?.type === "GET_TAB_SCAN") {
      const tabId = message.tabId as number;

      sendResponse(
        scans.get(tabId) ?? {
          website: "",
          requests: {},
        },
      );

      return;
    }

    if (message?.type === HANDOFF_REQUEST) {
      const token = message.token;
      handoffDebug("Service worker received request", {
        requestType: message.type,
        senderUrlPresent: Boolean(sender.tab?.url),
        frameId: sender.frameId,
      });

      if (
        typeof token !== "string" ||
        !/^[a-f0-9]{32}$/.test(token) ||
        !sender.tab?.url
      ) {
        handoffDebug("Service worker rejected request", { reason: "invalid token or sender tab" });
        sendResponse(null);
        return;
      }

      // Only a content script in our local dashboard
      // may redeem a pending handoff.
      let senderOrigin: string;

      try {
        senderOrigin = new URL(sender.tab.url).origin;
      } catch {
        handoffDebug("Service worker rejected request", { reason: "invalid sender URL" });
        sendResponse(null);
        return;
      }

      if (
        senderOrigin !== WEBSITE_ORIGIN ||
        sender.frameId !== 0
      ) {
        handoffDebug("Service worker rejected request", {
          reason: "origin or frame mismatch",
          senderOrigin,
          expectedOrigin: WEBSITE_ORIGIN,
          frameId: sender.frameId,
        });
        sendResponse(null);
        return;
      }

      const key = `${HANDOFF_STORAGE_PREFIX}${token}`;

      void chrome.storage.session.get(key).then(
        async (stored) => {
          const handoff = stored[key] as PendingHandoff | undefined;

          if (
            !handoff ||
            handoff.token !== token ||
            Date.now() - handoff.createdAt >
              HANDOFF_EXPIRATION_MS
          ) {
            handoffDebug("Service worker rejected request", {
              reason: !handoff ? "token not found" : "token expired or mismatched",
            });
            await chrome.storage.session.remove(key);
            sendResponse(null);
            return;
          }

          // One-time transfer: remove before responding.
          await chrome.storage.session.remove(key);

          sendResponse({
            type: HANDOFF_RESPONSE,
            token,
            scan: handoff.scan,
          });
          handoffDebug("Service worker sent response", { responseType: HANDOFF_RESPONSE });
        },
      ).catch((error) => {
        handoffDebug("Service worker handoff failed", {
          reason: error instanceof Error ? error.message : "Unknown error",
        });
        sendResponse(null);
      });

      return true;
    }
  },
);

console.log("Cookie Crumbs tracker collection active!");
