import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.config.ts";
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, "..", "VITE_");
  const websiteOrigin =
    env.VITE_WEBSITE_ORIGIN ??
    (mode === "production"
      ? "https://cookiecrumbs.club"
      : "http://localhost:5173");

  return {
    plugins: [
      react(),
      crx({ manifest }),
      tailwindcss()
    ],
    define: {
      "import.meta.env.VITE_WEBSITE_ORIGIN": JSON.stringify(websiteOrigin),
      "import.meta.env.VITE_HANDOFF_DEBUG": JSON.stringify(
        env.VITE_HANDOFF_DEBUG ?? "false",
      ),
    },
    envDir: "..",
    server: {
      host: "localhost",
      port: 5174,
      strictPort: true,
    },
  };
});
