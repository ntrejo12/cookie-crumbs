
import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest({
  manifest_version: 3,
  name: "Cookie Crumbs",
  version: "0.1.0",
  description: "Follow the crumbs. Find the trackers.",
  permissions: [
    "webRequest",
    "cookies",
    "storage",
    "tabs"
  ],
  host_permissions: [
    "http://*/*",
    "https://*/*"
  ],
  action: {
    default_popup: "popup.html"
  },
  background: {
    service_worker: "src/background/index.ts",
    type: "module"
  }
});
