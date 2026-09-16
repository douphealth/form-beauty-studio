/**
 * Route manifest — the SINGLE SOURCE OF TRUTH for indexable URLs.
 *
 * - The React router maps `path` -> lazily imported content module.
 * - The Vite sitemap plugin (`plugins/sitemap-plugin.ts`) reads this file at
 *   build time and emits public/sitemap.xml.
 * - `src/test/seo-consistency.test.tsx` asserts every path here has a matching
 *   content module and vice-versa, so the three can never drift.
 *
 * Add a page here AND in src/content/* — the test will catch a mismatch.
 */

export type ContentKind = "guide" | "format" | "tool" | "glossary" | "company";

export interface RouteEntry {
  path: string;
  kind: ContentKind;
  /** <title> content — keyword-targeted, brand last */
  title: string;
  /** Meta description — action verb + primary keyword + value prop, <=155 chars */
  description: string;
  /** sitemap priority */
  priority?: number;
  /** sitemap changefreq */
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  /** Exclude from sitemap + robots (privacy, 404, legal drafts) */
  noindex?: boolean;
}

export const HOME: RouteEntry = {
  path: "/",
  kind: "tool",
  title: "ImageForge — Free Private Image Compressor (WebP, AVIF, JPEG, PNG)",
  description:
    "Compress and convert images to WebP, AVIF, JPEG and PNG in your browser. Free, private, unlimited batch compression — no uploads, no accounts, no tracking.",
  priority: 1.0,
  changefreq: "weekly",
};

export const ROUTES: RouteEntry[] = [
  // ── Learn hub + guides (informational intent) ────────────────────────────
  {
    path: "/learn",
    kind: "guide",
    title: "Image Optimization & Compression Guides — ImageForge",
    description:
      "Practical, up-to-date guides on image compression, WebP and AVIF conversion, responsive images and Core Web Vitals. Written by the makers of ImageForge.",
    priority: 0.9,
    changefreq: "weekly",
  },
  {
    path: "/learn/image-optimization-guide",
    kind: "guide",
    title: "Image Optimization: The Complete Guide (2026) — ImageForge",
    description:
      "A complete, practical image optimization guide: choose the right format, set quality, resize, compress and serve responsively to cut page weight and speed up your site.",
    priority: 0.8,
    changefreq: "monthly",
  },
  {
    path: "/learn/compress-images-for-web",
    kind: "guide",
    title: "How to Compress Images for the Web Without Losing Quality",
    description:
      "Step-by-step: compress images for the web without visible quality loss. Right formats, quality settings, resizing rules and the tools that actually save bytes.",
    priority: 0.8,
    changefreq: "monthly",
  },
  {
    path: "/learn/webp-vs-avif",
    kind: "guide",
    title: "WebP vs AVIF: Which Image Format Wins in 2026?",
    description:
      "WebP vs AVIF compared: compression efficiency, browser support, encoding speed, animation, alpha and transparency. Clear recommendations for real projects.",
    priority: 0.8,
    changefreq: "monthly",
  },
  {
    path: "/learn/core-web-vitals-images",
    kind: "guide",
    title: "Images & Core Web Vitals: Fix LCP, INP and CLS",
    description:
      "How images affect Core Web Vitals (LCP, INP, CLS) and the exact fixes that move your scores green: sizing, priority, lazy loading and format choice.",
    priority: 0.8,
    changefreq: "monthly",
  },
  {
    path: "/learn/responsive-images",
    kind: "guide",
    title: "Responsive Images with srcset, sizes and <picture> Explained",
    description:
      "Master responsive images: srcset, the sizes attribute, art direction with <picture>, and how to stop shipping oversized images to small screens.",
    priority: 0.7,
    changefreq: "monthly",
  },
  {
    path: "/learn/best-free-image-compression-tools",
    kind: "guide",
    title: "Best Free Image Compression Tools in 2026 (Compared)",
    description:
      "An honest comparison of the best free image compression tools — TinyPNG, Squoosh, ImageForge and more — on privacy, quality, batch limits and price.",
    priority: 0.7,
    changefreq: "monthly",
  },
  {
    path: "/learn/reduce-image-file-size",
    kind: "guide",
    title: "9 Proven Ways to Reduce Image File Size (2026)",
    description:
      "Nine reliable techniques to shrink image file size: modern formats, quality tuning, resizing, metadata stripping, lossless re-optimization and more.",
    priority: 0.7,
    changefreq: "monthly",
  },

  // ── Format pages (format-level intent: "compress to webp", "convert to avif") ─
  {
    path: "/formats/webp",
    kind: "format",
    title: "WebP Compressor & Converter — Compress Images to WebP Free",
    description:
      "Compress and convert images to WebP for free in your browser. Batch convert PNG and JPEG to WebP, choose quality, keep transparency — nothing is uploaded.",
    priority: 0.8,
    changefreq: "monthly",
  },
  {
    path: "/formats/avif",
    kind: "format",
    title: "AVIF Compressor & Converter — Convert Images to AVIF Free",
    description:
      "Convert images to AVIF for free, right in your browser. Batch AVIF compression with quality control and the smallest files of any web image format.",
    priority: 0.8,
    changefreq: "monthly",
  },
  {
    path: "/formats/jpeg",
    kind: "format",
    title: "JPEG Compressor — Reduce JPEG File Size Free, In-Browser",
    description:
      "Reduce JPEG file size for free without installing software. Batch compress JPEGs with MozJPEG-grade encoding, quality preview and ZIP download.",
    priority: 0.7,
    changefreq: "monthly",
  },
  {
    path: "/formats/png",
    kind: "format",
    title: "PNG Compressor & Optimizer — Shrink PNG Files Free",
    description:
      "Shrink PNG file size losslessly and free, in your browser. Optimize PNGs with OxiPNG-grade re-encoding and keep full transparency and quality.",
    priority: 0.7,
    changefreq: "monthly",
  },

  // ── Tool pages (task-based intent) ──────────────────────────────────────────
  {
    path: "/tools/image-resizer",
    kind: "tool",
    title: "Free Image Resizer — Batch Resize Images Online, Private",
    description:
      "Resize images and photos online for free: batch resize to exact dimensions or presets (4K, 2K, 1080p, web, thumbnail). Runs entirely in your browser.",
    priority: 0.8,
    changefreq: "monthly",
  },
  {
    path: "/tools/image-converter",
    kind: "tool",
    title: "Free Image Converter — Batch Convert to WebP, AVIF, JPEG, PNG",
    description:
      "Convert images between WebP, AVIF, JPEG and PNG for free, in bulk, in your browser. No uploads, no watermarks, no limits — auto-pick picks the smallest format.",
    priority: 0.8,
    changefreq: "monthly",
  },

  // ── Glossary (definition intent — strong for AI/answer engines) ─────────────
  {
    path: "/glossary",
    kind: "glossary",
    title: "Image Compression & Format Glossary — ImageForge",
    description:
      "Plain-English definitions for image compression and web image format terms: AVIF, WebP, lossless, MozJPEG, Core Web Vitals, chroma subsampling and more.",
    priority: 0.6,
    changefreq: "monthly",
  },

  // ── Company / trust (E-E-A-T) ───────────────────────────────────────────────
  {
    path: "/about",
    kind: "company",
    title: "About ImageForge — Private, Browser-Based Image Compression",
    description:
      "ImageForge is a free, private image compression studio that runs entirely in your browser. Learn who built it, how it works and why privacy comes first.",
    priority: 0.5,
    changefreq: "yearly",
  },
  {
    path: "/privacy",
    kind: "company",
    title: "Privacy Policy — ImageForge",
    description:
      "ImageForge processes your images entirely on your device. This privacy policy explains what we do and do not collect.",
    priority: 0.3,
    changefreq: "yearly",
    noindex: true,
  },
];

/** GLOSSARY TERMS — definition pages, each individually indexable. */
export interface GlossaryEntry {
  path: string;
  title: string;
  description: string;
  term: string;
  priority?: number;
}

export const GLOSSARY: GlossaryEntry[] = [
  {
    path: "/glossary/avif",
    term: "AVIF",
    title: "What Is AVIF? AV1 Image File Format Explained",
    description:
      "AVIF (AV1 Image File Format) is a modern, royalty-free image format with the best compression of any web image format. Here's how it works and when to use it.",
  },
  {
    path: "/glossary/webp",
    term: "WebP",
    title: "What Is WebP? Google's Web Image Format Explained",
    description:
      "WebP is Google's image format offering lossy and lossless compression, transparency and animation in one file, ~25-35% smaller than JPEG and PNG.",
  },
  {
    path: "/glossary/lossless-compression",
    term: "Lossless compression",
    title: "What Is Lossless Compression? (vs Lossy, Explained)",
    description:
      "Lossless compression shrinks file size without discarding any pixel data. Learn how it differs from lossy and when to choose it.",
  },
  {
    path: "/glossary/core-web-vitals",
    term: "Core Web Vitals",
    title: "What Are Core Web Vitals? LCP, INP and CLS Explained",
    description:
      "Core Web Vitals are Google's three speed and stability metrics — LCP, INP and CLS. Here's what each measures and the targets you need to hit.",
  },
  {
    path: "/glossary/mozjpeg",
    term: "MozJPEG",
    title: "What Is MozJPEG? Better JPEG Compression Explained",
    description:
      "MozJPEG is Mozilla's improved JPEG encoder that produces JPEG files roughly 10-15% smaller at the same visual quality. Here's how it works.",
  },
  {
    path: "/glossary/chroma-subsampling",
    term: "Chroma subsampling",
    title: "What Is Chroma Subsampling? (4:4:4 vs 4:2:0 Explained)",
    description:
      "Chroma subsampling reduces color data to shrink image files. Learn the difference between 4:4:4, 4:2:2 and 4:2:0 and what it costs you.",
  },
  {
    path: "/glossary/entropy-coding",
    term: "Entropy coding",
    title: "What Is Entropy Coding in Image Compression?",
    description:
      "Entropy coding is the final, lossless stage of most image and video codecs. Learn how Huffman and arithmetic coding squeeze out the last bits.",
  },
  {
    path: "/glossary/lazy-loading",
    term: "Lazy loading",
    title: "What Is Lazy Loading? Images, the loading Attribute Explained",
    description:
      "Lazy loading defers off-screen images until they're needed, cutting initial page weight and speeding up first paint. Here's how to do it right.",
  },
];

export const GLOSSARY_ROUTE_ENTRIES: RouteEntry[] = GLOSSARY.map((g) => ({
  path: g.path,
  kind: "glossary" as const,
  title: g.title,
  description: g.description,
  priority: g.priority ?? 0.5,
  changefreq: "yearly" as const,
}));

/** Every indexable route (home + content + glossary), excluding noindex entries. */
export const ALL_ROUTES: RouteEntry[] = [
  HOME,
  ...ROUTES,
  ...GLOSSARY_ROUTE_ENTRIES,
];

/** Indexable only — used by the sitemap plugin and robots. */
export const INDEXABLE_ROUTES = ALL_ROUTES.filter((r) => !r.noindex);

export function findRoute(path: string): RouteEntry | undefined {
  return ALL_ROUTES.find((r) => r.path === path);
}
