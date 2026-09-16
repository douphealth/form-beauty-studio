import { type ReactNode } from "react";
import type { ContentEntry } from "../types";

const P = (children: ReactNode) => <p>{children}</p>;

export const GUIDE_CONTENT: Record<string, ContentEntry> = {
  "/learn/best-free-image-compression-tools": {
    path: "/learn/best-free-image-compression-tools",
    h1: "The best free image compression tools in 2026",
    lede: "An honest comparison of the tools people actually use — judged on privacy, quality, batch limits and price. We build ImageForge, so we've tried to be fair about where other tools win.",
    keywords: ["best image compression tool", "free image compressor", "tinypng alternative", "squoosh", "image optimizer"],
    sections: [
      {
        id: "what-matters",
        heading: "What actually matters in a compression tool",
        body: [
          P(<>Four things: <strong>privacy</strong> (does it upload your files?), <strong>quality per byte</strong> (how small at what visual quality), <strong>batch capability</strong> (can it handle 200 images at once?) and <strong>format support</strong> (AVIF, WebP, JPEG, PNG — and conversion between them).</>),
        ],
      },
      {
        id: "browser-based-tools",
        heading: "Browser-based (nothing installed, nothing uploaded)",
        body: [
          P(<><strong>ImageForge</strong> (this tool) — batch compression of up to 200 images, AVIF/WebP/JPEG/PNG output, presets for web/email/social/print, per-image overrides, auto-pick smallest format, before/after comparison and ZIP export. Runs fully on-device via WebAssembly. Free, no account, no limits.</>),
          P(<><strong>Squoosh</strong> (by Google) — excellent single-image control with a live comparison slider, supports AVIF, WebP, JPEG and more. No batch processing, which is the main limitation for real work.</>),
        ],
      },
      {
        id: "online-compressors",
        heading: "Online compressors (they upload your files)",
        body: [
          P(<><strong>TinyPNG</strong> — genuinely good compression, but free-tier batch limits apply and your images are uploaded to their servers. Fine for public assets; think twice for client or confidential work.</>),
          P(<><strong>Compressor.io, Optimizilla</strong> — similar tradeoff: convenient and decent quality, but server-side processing and file-retention policies vary.</>),
        ],
      },
      {
        id: "desktop-and-cli",
        heading: "Desktop and command-line tools",
        body: [
          P(<><strong>ImageMagick, libvips, sharp, Squoosh CLI</strong> — the workhorses for automated pipelines. Excellent quality and full format control, but they need installation and technical knowledge. Best for CI/CD and build-time optimization rather than ad-hoc batches.</>),
        ],
      },
      {
        id: "summary-table",
        heading: "How they compare",
        body: [
          P(<><strong>Privacy:</strong> ImageForge and Squoosh process locally; the rest upload. <strong>Batch:</strong> ImageForge (200), TinyPNG (limited on free tier), Squoosh (one at a time). <strong>Formats:</strong> all handle JPEG/PNG; ImageForge, Squoosh and modern CLIs add AVIF and WebP. <strong>Price:</strong> all have a genuinely free tier.</>),
        ],
      },
      {
        id: "which-should-you-use",
        heading: "Which should you use?",
        body: [
          P(<>For most people: <strong>ImageForge for batches and format conversion</strong>, <strong>Squoosh for one image with fine control</strong>, and <strong>sharp or libvips in your build pipeline</strong>. That combination covers ad-hoc work and production automation without spending anything.</>),
        ],
      },
    ],
    faqs: [
      {
        question: "What is the best free image compression tool?",
        answer: "It depends on the job. For batch processing and format conversion with full privacy, ImageForge is the strongest option — nothing is uploaded and up to 200 images can be processed at once. For detailed single-image control, Squoosh by Google is excellent. For automated build pipelines, sharp or libvips are the standard choices.",
      },
      {
        question: "Is TinyPNG safe to use?",
        answer: "TinyPNG produces good results, but it uploads your images to its servers for processing. That's fine for public website assets, but for confidential, client or unreleased material, a local tool like ImageForge or Squoosh is the safer choice.",
      },
      {
        question: "Is there a free TinyPNG alternative that doesn't upload my images?",
        answer: "Yes — ImageForge and Squoosh both run entirely in the browser using WebAssembly codecs. Nothing leaves your device. ImageForge additionally supports batch processing, AVIF/WebP/JPEG/PNG conversion and ZIP export.",
      },
      {
        question: "Can I compress images without installing software?",
        answer: "Yes. Browser-based tools like ImageForge and Squoosh use WebAssembly to run real codecs (MozJPEG, libwebp, AVIF, OxiPNG) locally. You get desktop-class compression with nothing to install and no files uploaded.",
      },
      {
        question: "How many images can I compress at once for free?",
        answer: "With ImageForge, up to 200 images per batch, with no daily limit and no account. Server-based tools typically restrict free batches to 5–20 images or apply daily limits because processing costs them compute.",
      },
    ],
    related: [
      { path: "/learn/image-optimization-guide", label: "Image optimization: the complete guide" },
      { path: "/learn/compress-images-for-web", label: "Compress images for the web" },
      { path: "/learn/webp-vs-avif", label: "WebP vs AVIF" },
      { path: "/learn/reduce-image-file-size", label: "9 proven ways to reduce image file size" },
    ],
  },
};
