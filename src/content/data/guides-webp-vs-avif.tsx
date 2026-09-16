import { type ReactNode } from "react";
import type { ContentEntry } from "../types";

const P = (children: ReactNode) => <p>{children}</p>;

export const GUIDE_CONTENT: Record<string, ContentEntry> = {
  "/learn/webp-vs-avif": {
    path: "/learn/webp-vs-avif",
    h1: "WebP vs AVIF: which image format wins?",
    lede: "Both are modern formats that make JPEG and PNG look bloated. AVIF compresses better, WebP has broader tooling and slightly faster encode times. Here's how to choose for a real project in 2026.",
    keywords: ["webp vs avif", "avif", "webp", "image formats", "image compression comparison"],
    sections: [
      {
        id: "the-short-answer",
        heading: "The short answer",
        body: [
          P(<>Pick <strong>AVIF</strong> if your build pipeline supports it — it's roughly <strong>20% smaller</strong> than WebP at equivalent quality and is now supported by all major browsers. Pick <strong>WebP</strong> as the reliable default: universal support, faster encoding, smaller decoder, and every image tool handles it. In practice, serving both via <code>&lt;picture&gt;</code> with a JPEG fallback remains the most robust approach.</>),
        ],
      },
      {
        id: "compression-efficiency",
        heading: "Compression efficiency",
        body: [
          P(<>AVIF wins clearly. Based on the same source image at matched visual quality, typical results are: JPEG 100% (baseline), <strong>WebP ~70–75%</strong> of JPEG size, <strong>AVIF ~50–60%</strong>. For a 1 MB JPEG, that's roughly 720 KB WebP and 550 KB AVIF. Across a site with hundreds of images, the difference compounds.</>),
        ],
      },
      {
        id: "browser-support",
        heading: "Browser support",
        body: [
          P(<>Both are now safe. WebP has been universal since ~2020. AVIF is supported in Chrome, Firefox, Safari (16.4+), Edge and all modern mobile browsers — roughly 96%+ of global traffic in 2026. The remaining gap is very old browsers and some email clients, which is why a JPEG fallback still matters.</>),
        ],
      },
      {
        id: "encoding-speed",
        heading: "Encoding speed",
        body: [
          P(<>WebP encodes faster. AVIF's AV1-based encoder is slower — often 3–10× for a single image — though multi-threaded AVIF encoders and hardware acceleration have closed much of the gap. For interactive tools like ImageForge this is why AVIF runs in a background worker.</>),
        ],
      },
      {
        id: "features-compared",
        heading: "Feature comparison",
        body: [
          P(<>
            <strong>Transparency:</strong> both support alpha channels. <strong>Animation:</strong> both support animated sequences, though AVIF's is more efficient. <strong>Lossless mode:</strong> both support true lossless compression. <strong>Color depth:</strong> AVIF supports up to 12-bit and wide gamut; WebP is 8-bit. <strong>Progressive rendering:</strong> neither decodes progressively like JPEG — keep that in mind for very large images.
          </>),
        ],
      },
      {
        id: "which-should-you-use",
        heading: "Which should you use?",
        body: [
          P(<>For most sites in 2026: serve <strong>AVIF first, WebP second, JPEG fallback</strong> using <code>&lt;picture&gt;</code>. If you maintain only one format, WebP is the pragmatic choice. If page weight is critical (mobile-first, e-commerce, image-heavy galleries), AVIF pays for itself.</>),
          P(<>Whatever you choose, format choice matters less than the basics: right dimensions, sensible quality, and correct delivery. A well-compressed JPEG beats an oversized AVIF every time.</>),
        ],
      },
    ],
    faqs: [
      {
        question: "Is AVIF better than WebP?",
        answer: "On compression, yes — AVIF is roughly 20% smaller than WebP at equivalent quality and supports 12-bit color depth. WebP counters with faster encoding, broader tooling support and a smaller decoder. Both are safe to serve in 2026; use the <picture> element to serve AVIF with WebP and JPEG fallbacks.",
      },
      {
        question: "Which is smaller, WebP or AVIF?",
        answer: "AVIF. For the same source image at matched visual quality, AVIF typically produces files 50–60% the size of the JPEG baseline, while WebP produces 70–75%. That makes AVIF roughly 20–25% smaller than WebP.",
      },
      {
        question: "Do all browsers support AVIF and WebP?",
        answer: "WebP has been universally supported since around 2020. AVIF is supported by Chrome, Firefox, Safari 16.4+, Edge and all modern mobile browsers — over 96% of global traffic in 2026. Very old browsers and some email clients still need a JPEG or PNG fallback.",
      },
      {
        question: "Can I convert WebP to AVIF or AVIF to WebP?",
        answer: "Yes — ImageForge converts between AVIF, WebP, JPEG and PNG in the browser. Drop in a WebP and choose AVIF output (or use Auto-Pick, which encodes all three and keeps the smallest). Nothing is uploaded.",
      },
      {
        question: "Should I use AVIF for a website in 2026?",
        answer: "If your build pipeline supports it, yes — serve AVIF first with WebP and JPEG fallbacks. The 20% size reduction compounds across hundreds of images and directly improves LCP and Core Web Vitals. If you can only maintain one format, WebP is the safer pragmatic choice.",
      },
    ],
    related: [
      { path: "/learn/image-optimization-guide", label: "Image optimization: the complete guide" },
      { path: "/formats/webp", label: "WebP compressor" },
      { path: "/formats/avif", label: "AVIF compressor" },
      { path: "/learn/reduce-image-file-size", label: "9 proven ways to reduce image file size" },
    ],
  },
};
