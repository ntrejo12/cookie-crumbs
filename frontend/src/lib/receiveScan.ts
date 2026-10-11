import {
  HANDOFF_REQUEST,
  HANDOFF_RESPONSE,
  WEBSITE_ORIGIN,
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
    if (!TOKEN_PATTERN.test(token)) {
      reject(new Error("Invalid scan handoff token."));
      return;
    }

    let settled = false;

    const cleanup = () => {
      window.removeEventListener("message", onMessage);
      clearTimeout(timeoutId);
    };

    const onMessage = (event: MessageEvent) => {
      if (event.source !== window) return;
      if (event.origin !== WEBSITE_ORIGIN) return;

      const data = event.data;

      if (
        !data ||
        data.type !== HANDOFF_RESPONSE ||
        data.token !== token
      ) {
        return;
      }

      if (settled) return;

      if (!isSharedScan(data.scan)) {
        settled = true;
        cleanup();
        clearHandoffFragment();
        reject(new Error("The extension sent invalid scan data."));
        return;
      }

      settled = true;
      cleanup();
      clearHandoffFragment();
      resolve(data.scan);
    };

    const timeoutId = window.setTimeout(() => {
      if (settled) return;

      settled = true;
      cleanup();
      clearHandoffFragment();

      reject(
        new Error(
          "Could not receive the scan. Make sure the " +
          "Cookie Crumbs extension is installed and enabled.",
        ),
      );
    }, 10000);

    window.addEventListener("message", onMessage);

    window.postMessage(
      {
        type: HANDOFF_REQUEST,
        token,
      },
      WEBSITE_ORIGIN,
    );
  });
}
