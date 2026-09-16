/**
 * GUIDES — the informational core of the content silo.
 * Exported as one object so the whole corpus stays consistent and greppable.
 */
import { type ReactNode } from "react";
import type { ContentEntry } from "../types";

const P = (children: ReactNode) => <p>{children}</p>;

export const GUIDE_CONTENT: Record<string, ContentEntry> = {
  "/learn/image-optimization-guide": {
    path: "/learn/image-optimization-guide",
    h1: "Image optimization: the complete guide",
    lede: "Images are the heaviest thing on most web pages. This guide covers every decision that matters — format, quality, dimensions, compression and delivery — with concrete numbers you can use today.",
    keywords: ["image optimization", "image compression", "web performance", "Core Web Vitals", "image formats"],
    sections: [
      {
        id: "why-image-optimization-matters",
        heading: "Why image optimization matters",
        body: [
          P(<>The average web page now ships <strong>over 900 KB of images</strong> — more than HTML, CSS and JavaScript combined. On mobile networks that is the single largest cause of slow pages, high bounce rates and lost revenue. Google has confirmed page speed is a ranking factor, and Core Web Vitals metrics (LCP, INP, CLS) are directly affected by how you handle images.</>),
          P(<>The good news: images are also the easiest thing to fix. A well-optimized image pipeline typically cuts page weight by <strong>40–70%</strong> with zero visible quality loss, because most images are exported with settings designed for print or editing, not for screens.</>),
        ],
      },
      {
        id: "choose-the-right-format",
        heading: "Step 1 — Choose the right format",
        body: [
          P(<>Format choice dominates everything else. As a rule of thumb for 2026:</>),
          P(<>Use <strong>AVIF</strong> when you can — it produces the smallest files and is now supported by every major browser. Use <strong>WebP</strong> as the safe default: excellent compression, universal support, and it handles photographs, transparency and animation in one format. Use <strong>JPEG</strong> only for maximum compatibility (email, legacy CMS) and <strong>PNG</strong> only when you need pixel-perfect lossless quality or hard transparency.</>),
          P(<>A common mistake is treating "PNG" as the quality choice. PNG is lossless, but for photographs it is enormous — often 5–10× the size of an equivalent WebP at quality 80, with no visible difference on screen.</>),
        ],
      },
      {
        id: "set-the-right-quality",
        heading: "Step 2 — Set quality, not maximum quality",
        body: [
          P(<>Quality 100 is almost never correct for the web. Photographs at quality 80 in WebP or AVIF are visually indistinguishable from the original for nearly all viewing conditions, and the file is half the size.</>),
          P(<>Practical settings that work for most sites: <strong>WebP quality 78–82</strong> for hero and product photography, <strong>quality 70–75</strong> for thumbnails and content images, <strong>AVIF quality 60–70</strong> (AVIF's scale differs — it reaches equivalent quality at lower numbers than WebP or JPEG).</>),
        ],
      },
      {
        id: "resize-for-the-viewport",
        heading: "Step 3 — Resize for the viewport, not the source",
        body: [
          P(<>Shipping a 4000×3000 pixel image to a 390-pixel-wide phone is the most common waste on the web. Your source dimensions only matter if someone will display them. Set a maximum dimension that matches the largest container the image will ever occupy — typically <strong>1920px</strong> for full-width heroes, <strong>1280px</strong> for content width, and far less for cards and thumbnails.</>),
          P(<>Then serve different sizes to different screens with the <code>srcset</code> and <code>sizes</code> attributes. This alone routinely saves 50% of mobile image bandwidth.</>),
        ],
      },
      {
        id: "compress-and-strip",
        heading: "Step 4 — Compress losslessly and strip metadata",
        body: [
          P(<>After format, quality and dimensions are set, a lossless re-optimization pass (OxiPNG for PNG, MozJPEG's trellis and progressive settings for JPEG) removes redundant data and EXIF metadata your visitors don't need. This is what ImageForge does in its final pass.</>),
          P(<>Metadata alone — camera model, GPS coordinates, editing history — can account for several percent of file size. Stripping it is also a privacy win for your users.</>),
        ],
      },
      {
        id: "deliver-correctly",
        heading: "Step 5 — Deliver correctly",
        body: [
          P(<>Optimized files still need correct delivery: cache them long-term, lazy-load everything below the fold with <code>loading="lazy"</code>, set explicit <code>width</code> and <code>height</code> to prevent layout shift, and serve AVIF/WebP with a JPEG/PNG fallback using the <code>&lt;picture&gt;</code> element.</>),
        ],
      },
    ],
    faqs: [
      {
        question: "What is the best image format for websites in 2026?",
        answer: "WebP is the best overall default — universally supported, 25–35% smaller than JPEG and PNG, and it handles photographs, transparency and animation. AVIF beats WebP on file size by roughly 20% and is now supported everywhere; use it when your tooling supports it. Reserve JPEG for maximum compatibility (email, legacy systems) and PNG for pixel-perfect lossless graphics.",
      },
      {
        question: "What quality setting should I use for web images?",
        answer: "For photographs, WebP quality 78–82 is the sweet spot — visually indistinguishable from the original at roughly half the file size of quality 100. Use 70–75 for thumbnails and content images. For AVIF, equivalent quality lands at 60–70 because AVIF's quality scale differs. Always judge by eye on your own images, not by the number.",
      },
      {
        question: "How much can I compress an image without losing quality?",
        answer: "Typically 40–70%. Most images are exported with settings meant for print or editing, so converting to WebP or AVIF at quality 80 and resizing to the actual display dimensions produces no visible difference while cutting file size dramatically. Lossless re-optimization (OxiPNG, MozJPEG trellis) adds another few percent on top.",
      },
      {
        question: "Does image optimization affect SEO?",
        answer: "Yes. Google has confirmed page speed is a ranking signal, and images are the largest contributor to page weight on most sites. Slow LCP (Largest Contentful Paint) — very often an unoptimized hero image — directly hurts Core Web Vitals scores, which feed into rankings and can also limit eligibility for rich results and the mobile news carousel.",
      },
      {
        question: "Is ImageForge free and private?",
        answer: "Yes. ImageForge runs entirely in your browser using WebAssembly codecs. Your images are never uploaded to a server, no account is required, there is no tracking, and there is no limit on how many images you can process.",
      },
    ],
    related: [
      { path: "/learn/compress-images-for-web", label: "How to compress images for the web" },
      { path: "/learn/webp-vs-avif", label: "WebP vs AVIF" },
      { path: "/learn/core-web-vitals-images", label: "Images & Core Web Vitals" },
      { path: "/learn/responsive-images", label: "Responsive images with srcset" },
    ],
  },
};
