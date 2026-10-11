import {
  HANDOFF_REQUEST,
  HANDOFF_RESPONSE,
  WEBSITE_ORIGIN,
  handoffDebug,
} from "../lib/handoff";

window.addEventListener("message", async (event) => {
  if (event.source !== window) {
    handoffDebug("Content script ignored message", { reason: "unexpected source" });
    return;
  }
  if (event.origin !== WEBSITE_ORIGIN) {
    handoffDebug("Content script ignored message", {
      reason: "unexpected origin",
      origin: event.origin,
    });
    return;
  }

  const message = event.data;

  if (
    !message ||
    message.type !== HANDOFF_REQUEST ||
    typeof message.token !== "string" ||
    !/^[a-f0-9]{32}$/.test(message.token)
  ) {
    handoffDebug("Content script ignored message", { reason: "invalid request shape" });
    return;
  }

  handoffDebug("Content script received request", { requestType: message.type });

  try {
    const response = await chrome.runtime.sendMessage({
      type: HANDOFF_REQUEST,
      token: message.token,
    });

    if (!response || response.type !== HANDOFF_RESPONSE) {
      handoffDebug("Content script received no usable response", {
        reason: "service worker returned null or unexpected type",
      });
      return;
    }

    window.postMessage(response, WEBSITE_ORIGIN);
    handoffDebug("Content script sent response", { responseType: response.type });
  } catch (error) {
    handoffDebug("Content script handoff failed", {
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
});