import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
  },
  build: {
    rollupOptions: {
      input: {
        home: resolve(__dirname, "index.html"),
        faq: resolve(__dirname, "faq/index.html"),
        privacy: resolve(__dirname, "privacy/index.html"),
        cookies: resolve(__dirname, "cookies/index.html"),
        terms: resolve(__dirname, "terms/index.html"),
        legal: resolve(__dirname, "legal/index.html"),
        admin: resolve(__dirname, "admin/index.html"),
        freelancers: resolve(__dirname, "freelancers/index.html"),
        consultants: resolve(__dirname, "consultants/index.html"),
        contractors: resolve(__dirname, "contractors/index.html"),
        designers: resolve(__dirname, "designers/index.html"),
        photographers: resolve(__dirname, "photographers/index.html"),
        entrepreneurs: resolve(__dirname, "entrepreneurs/index.html")
      }
    }
  }
});
