
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
    "tabs",
    "contentSettings",
  ],
  host_permissions: [
    "http://*/*",
    "https://*/*",
    "http://localhost:8000/*",
    "http://127.0.0.1:8000/*"
  ],
  action: {
    default_popup: "popup.html"
  },
  background: {
    service_worker: "src/background/index.ts",
    type: "module"
  }, 
  content_scripts: [
    {
      matches: ["http://localhost:5173/*"],
      js: ["src/content/handoff.ts"],
      run_at: "document_start",
    },
  ],
});
