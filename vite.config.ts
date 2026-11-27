import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { appIds } from "./src/registry";

// GitHub Pages serves the site from /<repo>/, so assets use paths relative to each page.
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        admin: "index.html",
        ...Object.fromEntries(appIds.map((id) => [id, `${id}/index.html`])),
      },
    },
  },
});
