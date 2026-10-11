import {
  HANDOFF_REQUEST,
  HANDOFF_RESPONSE,
  handoffDebug,
} from "./handoff";
import {
  isSharedScan,
  type SharedScan,
} from "./scanAdapter";

const TOKEN_PATTERN = /^[a-f0-9]{32}$/;

export function getHandoffToken(): string | null {
  const match = /^#scan=([a-f0-9]{32})$/.exec(
    window.location.hash,
  );

  return match?.[1] ?? null;
}

function clearHandoffFragment() {
  window.history.replaceState(
    null,
    "",
    window.location.pathname + window.location.search,
  );
}

export function receiveScan(
  token: string,
): Promise<SharedScan> {
  return new Promise((resolve, reject) => {
    const pageOrigin = window.location.origin;
    handoffDebug("Dashboard handoff started", {
      origin: pageOrigin,
      tokenLength: token.length,
    });

    if (!TOKEN_PATTERN.test(token)) {
      handoffDebug("Scan rejected", { reason: "invalid token format" });
      reject(new Error("Invalid scan handoff token."));
      return;
    }

    let settled = false;
    let requestIntervalId: number;
    let requestCount = 0;

    const cleanup = () => {
      window.removeEventListener("message", onMessage);
      clearTimeout(timeoutId);
      clearInterval(requestIntervalId);
    };

    const onMessage = (event: MessageEvent) => {
      if (event.source !== window) {
        handoffDebug("Dashboard ignored message", { reason: "unexpected source" });
        return;
      }
      if (event.origin !== pageOrigin) {
        handoffDebug("Dashboard ignored message", {
          reason: "unexpected origin",
          origin: event.origin,
        });
        return;
      }

      const data = event.data;

      if (
        !data ||
        data.type !== HANDOFF_RESPONSE ||
        data.token !== token
      ) {
        handoffDebug("Dashboard ignored message", { reason: "unexpected response shape" });
        return;
      }

      handoffDebug("Dashboard received response", { responseType: data.type });

      if (settled) return;

      if (!isSharedScan(data.scan)) {
        handoffDebug("Scan rejected", { reason: "invalid scan payload" });
        settled = true;
        cleanup();
        clearHandoffFragment();
        reject(new Error("The extension sent invalid scan data."));
        return;
      }

      settled = true;
      cleanup();
      clearHandoffFragment();
      handoffDebug("Scan accepted");
      resolve(data.scan);
    };

    const timeoutId = window.setTimeout(() => {
      if (settled) return;

      settled = true;
      cleanup();
      clearHandoffFragment();
      handoffDebug("Dashboard handoff timed out", { timeoutMs: 10000 });

      reject(
        new Error(
          "Could not receive the scan. Make sure the " +
          "Cookie Crumbs extension is installed and enabled.",
        ),
      );
    }, 10000);

    window.addEventListener("message", onMessage);

    const requestHandoff = () => {
      requestCount += 1;
      if (requestCount === 1 || requestCount % 10 === 0) {
        handoffDebug("Dashboard handoff request sent", {
          requestType: HANDOFF_REQUEST,
          requestCount,
        });
      }
      window.postMessage(
        {
          type: HANDOFF_REQUEST,
          token,
        },
        pageOrigin,
      );
    };

    requestHandoff();
    requestIntervalId = window.setInterval(requestHandoff, 250);
  });
}
