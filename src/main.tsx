import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import "./studio.css";

const routeTags = [
  'meta[name="description"]', 'meta[name="robots"]', 'link[rel="canonical"]',
  'meta[property^="og:"]:not([property="og:image:type"])', 'meta[name^="twitter:"]:not([name="twitter:site"])',
  'link[rel="alternate"][type="text/markdown"]', 'script[type="application/ld+json"]',
  'link[rel="icon"]', 'link[rel="shortcut icon"]', 'link[rel="apple-touch-icon"]',
];
document.head.querySelectorAll(routeTags.join(",")).forEach(tag => tag.setAttribute("data-rh", "true"));

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
