import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.config.ts";
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
<<<<<<< HEAD
  plugins: [react()],
  envDir: '..',
})
=======
  plugins: [
    react(),
    crx({ manifest }),
    tailwindcss()
  ]
});
>>>>>>> origin/main
