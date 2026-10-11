import {
  HANDOFF_REQUEST,
  HANDOFF_RESPONSE,
  WEBSITE_ORIGIN,
} from "../lib/handoff";

window.addEventListener("message", async (event) => {
  if (event.source !== window) return;
  if (event.origin !== WEBSITE_ORIGIN) return;

  const message = event.data;

  if (
    !message ||
    message.type !== HANDOFF_REQUEST ||
    typeof message.token !== "string" ||
    !/^[a-f0-9]{32}$/.test(message.token)
  ) {
    return;
  }

  try {
    const response = await chrome.runtime.sendMessage({
      type: HANDOFF_REQUEST,
      token: message.token,
    });

    if (!response || response.type !== HANDOFF_RESPONSE) {
      return;
    }

    window.postMessage(response, WEBSITE_ORIGIN);
  } catch (error) {
    console.error("Cookie Crumbs handoff failed:", error);
  }
});
