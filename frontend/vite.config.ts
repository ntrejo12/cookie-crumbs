import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.config.ts";
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    crx({ manifest }),
    tailwindcss()
  ],
  envDir: "..",
  server: {
    host: "localhost",
    port: 5174,
    strictPort: true,
  },
});
