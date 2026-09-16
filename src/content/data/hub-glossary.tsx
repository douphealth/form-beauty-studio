import { type ReactNode } from "react";
import type { ContentEntry } from "../types";

const P = (children: ReactNode) => <p>{children}</p>;

const TERMS = [
  { path: "/glossary/avif", term: "AVIF", desc: "The AV1 Image File Format — best-in-class compression, now supported by all major browsers." },
  { path: "/glossary/webp", term: "WebP", desc: "Google's all-round web image format: lossy, lossless, transparency and animation in one file." },
  { path: "/glossary/lossless-compression", term: "Lossless compression", desc: "Shrinking a file without discarding any data — the original reconstructs bit for bit." },
  { path: "/glossary/core-web-vitals", term: "Core Web Vitals", desc: "Google's three page-experience metrics: LCP (loading), INP (responsiveness), CLS (stability)." },
  { path: "/glossary/mozjpeg", term: "MozJPEG", desc: "Mozilla's improved JPEG encoder — same format, roughly 10-15% smaller files." },
  { path: "/glossary/chroma-subsampling", term: "Chroma subsampling", desc: "Storing less color detail than brightness detail. Why 4:2:0 works on photos but ruins screenshots." },
  { path: "/glossary/entropy-coding", term: "Entropy coding", desc: "The final lossless stage of most codecs — Huffman, arithmetic and ANS coding." },
  { path: "/glossary/lazy-loading", term: "Lazy loading", desc: "Deferring image downloads until they're needed, via a single HTML attribute." },
];

export const HUB_CONTENT: Record<string, ContentEntry> = {
  "/glossary": {
    path: "/glossary",
    h1: "Image compression & format glossary",
    lede: "Plain-English definitions for the terms used across our guides and in image compression generally. Each definition is a standalone page, so you can link to it directly.",
    keywords: ["image compression glossary", "image format definitions", "avif", "webp", "compression terms"],
    sections: [
      {
        id: "how-to-use",
        heading: "How to use this glossary",
        body: [
          P(<>Terms are cross-linked throughout the guides. Each one opens a dedicated page with a concise definition, practical notes on when it matters, and links to related guides.</>),
        ],
      },
      {
        id: "all-terms",
        heading: "All terms",
        body: [
          P(<><strong>{TERMS.length} terms</strong> defined and growing. If a term you need is missing, it's on our list — the related guides cover most concepts in depth meanwhile.</>),
        ],
      },
    ],
    faqs: [
      { question: "What is image compression?", answer: "Image compression reduces the file size of an image while keeping it usable. Lossy compression (JPEG, WebP, AVIF) discards data the eye rarely notices for much smaller files; lossless compression (PNG, OxiPNG) discards nothing and reconstructs the original exactly." },
      { question: "What is the difference between lossy and lossless?", answer: "Lossy compression permanently discards some pixel data to achieve much smaller files. Lossless compression discards nothing — the decompressed image is identical to the original, so files stay larger. Use lossy for photographs, lossless for graphics, logos and screenshots." },
      { question: "What image format should I use?", answer: "For web use in 2026: AVIF first for the smallest files, WebP as the universal default, JPEG only for maximum compatibility (email, legacy systems), and PNG only for pixel-perfect flat graphics or hard transparency." },
      { question: "What are Core Web Vitals?", answer: "Google's three page-experience metrics measured from real Chrome users: LCP (Largest Contentful Paint) for loading, INP (Interaction to Next Paint) for responsiveness, and CLS (Cumulative Layout Shift) for visual stability." },
    ],
    related: TERMS.map((t) => ({ path: t.path, label: t.term })),
  },
};
