import { type ReactNode } from "react";
import type { ContentEntry } from "../types";

const P = (children: ReactNode) => <p>{children}</p>;

const GUIDE_CARDS = [
  { path: "/learn/image-optimization-guide", title: "Image optimization: the complete guide", desc: "Every decision that matters — format, quality, dimensions, compression and delivery — with concrete numbers." },
  { path: "/learn/compress-images-for-web", title: "Compress images for the web without losing quality", desc: "A five-step process that cuts image weight by half or more while keeping photos looking exactly as they should." },
  { path: "/learn/webp-vs-avif", title: "WebP vs AVIF: which format wins?", desc: "Compression, browser support, encoding speed and features compared, with clear recommendations." },
  { path: "/learn/core-web-vitals-images", title: "Images & Core Web Vitals: fix LCP, INP and CLS", desc: "How images affect each Core Web Vitals metric and the exact fixes that move your scores green." },
  { path: "/learn/responsive-images", title: "Responsive images: srcset, sizes and <picture>", desc: "Serve the right file to the right screen with browser-native attributes — no JavaScript required." },
  { path: "/learn/reduce-image-file-size", title: "9 proven ways to reduce image file size", desc: "Nine reliable techniques ordered by impact, from format conversion to tighter cropping." },
  { path: "/learn/best-free-image-compression-tools", title: "The best free image compression tools", desc: "An honest comparison of TinyPNG, Squoosh, ImageAlchemy and more on privacy, quality and limits." },
];

export const HUB_CONTENT: Record<string, ContentEntry> = {
  "/learn": {
    path: "/learn",
    h1: "Image optimization & compression guides",
    lede: "Practical, up-to-date guides on compressing, converting and delivering web images. Written by the makers of ImageAlchemy, so everything here is tested against a real browser-based tool — not theory.",
    keywords: ["image optimization guide", "image compression", "webp", "avif", "core web vitals"],
    sections: [
      {
        id: "start-here",
        heading: "Start here",
        body: [
          P(<>If you're new to image optimization, begin with <a href="/learn/image-optimization-guide">the complete guide</a> — it walks through format choice, quality settings, resizing, compression and delivery in order of impact. If you have a specific question, jump straight to the guide you need below.</>),
        ],
      },
      {
        id: "all-guides",
        heading: "All guides",
        body: [
          P(<>Every guide is free, has no paywall and is updated as formats and browser support change. <strong>{GUIDE_CARDS.length} guides</strong>, each with concrete numbers you can apply today.</>),
        ],
      },
    ],
    faqs: [
      { question: "Where should I start with image optimization?", answer: "Start with the complete image optimization guide, which covers format choice, quality settings, resizing, compression and delivery in order of impact. Most pages can cut image weight by 40-70% with the first three steps alone." },
      { question: "Are these image optimization guides free?", answer: "Yes. Every guide is free to read, has no paywall, and requires no account. The ImageAlchemy compression tool they accompany is also free and private." },
      { question: "How often are these guides updated?", answer: "Guides are reviewed and updated as image formats, browser support and Core Web Vitals metrics change. The 2026 editions cover AVIF, WebP, the current INP metric and modern delivery patterns." },
      { question: "Can I compress images using what I learn here?", answer: "Yes — the ImageAlchemy tool is linked from every guide. It runs entirely in your browser, so nothing is uploaded, and it applies the exact techniques described in these guides." },
    ],
    related: GUIDE_CARDS.map((g) => ({ path: g.path, label: g.title })),
  },
};
