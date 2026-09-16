import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { seoSitemapPlugin } from "./plugins/seo-sitemap-plugin";

// Pre-rendering lives in scripts/prerender.mjs (run as a build post-step)
// because importing TSX from the config breaks esbuild's JSX factory.
// See scripts/prerender.mjs for the reasoning.

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    seoSitemapPlugin(),
  ].filter(Boolean),
  worker: {
    format: "es",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    exclude: [
      "@jsquash/jpeg",
      "@jsquash/webp",
      "@jsquash/png",
      "@jsquash/avif",
      "@jsquash/oxipng",
      "@jsquash/resize",
    ],
  },
}));
