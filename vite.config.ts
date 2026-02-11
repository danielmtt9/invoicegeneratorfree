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
        invoice: resolve(__dirname, "invoice/index.html"),
        faq: resolve(__dirname, "faq/index.html"),
        privacy: resolve(__dirname, "privacy/index.html"),
        cookies: resolve(__dirname, "cookies/index.html"),
        terms: resolve(__dirname, "terms/index.html"),
        legal: resolve(__dirname, "legal/index.html"),
        admin: resolve(__dirname, "admin/index.html")
      }
    }
  }
});
