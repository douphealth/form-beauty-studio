import { type ReactNode } from "react";
import type { ContentEntry } from "../types";

const P = (children: ReactNode) => <p>{children}</p>;

export const GUIDE_CONTENT: Record<string, ContentEntry> = {
  "/learn/best-free-image-compression-tools": {
    path: "/learn/best-free-image-compression-tools",
    h1: "The best free image compression tools in 2026",
    lede: "An honest comparison of the tools people actually use — judged on privacy, quality, batch limits and price. We build ImageAlchemy, so we've tried to be fair about where other tools win.",
    keywords: ["best image compression tool", "free image compressor", "tinypng alternative", "squoosh", "image optimizer"],
    sections: [
      {
        id: "what-matters",
        heading: "What actually matters in a compression tool",
        body: [
          P(<>Four things: <strong>privacy</strong> (does it upload your files?), <strong>quality per byte</strong> (how small at what visual quality), <strong>batch capability</strong> (can it handle 200 images at once?) and <strong>format support</strong> (AVIF, WebP, JPEG, PNG — and conversion between them).</>),
        P(<>Each of these four criteria uses terms defined in the <a href="/glossary">image compression glossary</a>.</>),
        ],
      },
      {
        id: "browser-based-tools",
        heading: "Browser-based (nothing installed, nothing uploaded)",
        body: [
          P(<><strong>ImageAlchemy</strong> (this tool) — batch compression of up to 200 images, AVIF/WebP/JPEG/PNG output, presets for web/email/social/print, per-image overrides, auto-pick smallest format, before/after comparison and ZIP export. Runs fully on-device via WebAssembly. Free and no account; a batch holds up to 200 images of up to 50 MB each.</>),
          P(<><strong>Squoosh</strong> (by Google) — excellent single-image control with a live comparison slider, supports AVIF, WebP, JPEG and more, and processes locally in your browser. The web app opens one image at a time, which is the main limitation for batch work.</>),
        ],
      },
      {
        id: "online-compressors",
        heading: "Online compressors (they upload your files)",
        body: [
          P(<><strong>TinyPNG</strong> — genuinely good compression, and it now outputs AVIF and WebP as well as PNG and JPEG. The free web tier takes up to 20 images per session at 5 MB each, with 3 format conversions per session (<a href="https://tinypng.com/pricing" rel="noopener">TinyPNG’s pricing page</a>). Images are uploaded to TinyPNG’s servers, which its FAQ says keep them for up to 48 hours. Fine for public assets; think twice for client or confidential work.</>),
          P(<><strong>Other online compressors</strong> — check each one’s own privacy page rather than assuming. Some upload your files; others now run in the browser. <a href="https://imagecompressor.com/" rel="noopener">imagecompressor.com</a>, for example, states that there are no uploads to any server and no daily limits, and accepts JPEG, PNG, WebP, GIF and SVG.</>),
        ],
      },
      {
        id: "desktop-and-cli",
        heading: "Desktop and command-line tools",
        body: [
          P(<><strong>ImageMagick, libvips, sharp</strong> — the workhorses for automated pipelines. Excellent quality and full format control, but they need installation and technical knowledge. Best for CI/CD and build-time optimization rather than ad-hoc batches.</>),
        ],
      },
      {
        id: "summary-table",
        heading: "How they compare",
        body: [
          P(<><strong>Privacy:</strong> ImageAlchemy, Squoosh and imagecompressor.com process in the browser; TinyPNG uploads and deletes within 48 hours. <strong>Batch:</strong> ImageAlchemy (200 images, 50 MB each), TinyPNG free (20 per session, 5 MB each), Squoosh (one image at a time). <strong>Formats:</strong> all handle JPEG and PNG; ImageAlchemy, Squoosh, TinyPNG and the command-line tools also output AVIF and WebP. <strong>Price:</strong> all have a free tier. Vendor limits checked on each vendor’s own site on 25 November 2026; they change, so confirm before relying on them.</>),
        P(<>The format and quality choices above are covered step by step in the <a href="/learn">image optimization guides</a>.</>),
        P(<>For the full format, quality and delivery sequence behind these comparisons, see <a href="/learn/image-optimization-guide">the complete image optimization guide</a>.</>),
        ],
      },
      {
        id: "which-should-you-use",
        heading: "Which should you use?",
        body: [
          P(<>For most people: <strong>ImageAlchemy for batches and format conversion</strong>, <strong>Squoosh for one image with fine control</strong>, and <strong>sharp or libvips in your build pipeline</strong>. That combination covers ad-hoc work and production automation without spending anything.</>),
          P(<>If privacy is what tips the choice, that claim is structural rather than a policy promise — see <a href="/about">About ImageAlchemy</a> for who built the tool and why there is no server in the image path at all.</>),
          P(<>The converter on this site is the browser-based entry in that comparison — no install, no upload — try the <a href="/tools/image-converter">image converter</a> on a batch of your own files.</>),
        ],
      },
    ],
    faqs: [
      {
        question: "What is the best free image compression tool?",
        answer: "It depends on the job. For batch processing and format conversion with full privacy, ImageAlchemy is the strongest option — nothing is uploaded and up to 200 images can be processed at once. For detailed single-image control, Squoosh by Google is excellent. For automated build pipelines, sharp or libvips are the standard choices.",
      },
      {
        question: "Is TinyPNG safe to use?",
        answer: "TinyPNG produces good results, but it uploads your images to its servers for processing and, per its FAQ, keeps them for up to 48 hours. That's fine for public website assets, but for confidential, client or unreleased material, a local tool like ImageAlchemy or Squoosh is the safer choice.",
      },
      {
        question: "Is there a free TinyPNG alternative that doesn't upload my images?",
        answer: "Yes — ImageAlchemy and Squoosh both run entirely in the browser using WebAssembly codecs, and imagecompressor.com also states it processes images without uploading them. With ImageAlchemy and Squoosh, nothing leaves your device. ImageAlchemy additionally supports batch processing, AVIF/WebP/JPEG/PNG conversion and ZIP export.",
      },
      {
        question: "Can I compress images without installing software?",
        answer: "Yes. Browser-based tools like ImageAlchemy and Squoosh use WebAssembly to run real codecs (MozJPEG, libwebp, AVIF, OxiPNG) locally. You get desktop-class compression with nothing to install and no files uploaded.",
      },
      {
        question: "How many images can I compress at once for free?",
        answer: "With ImageAlchemy, up to 200 images per batch (50 MB each), with no daily limit and no account. For comparison, TinyPNG's free web tier takes up to 20 images per session at 5 MB each (checked on TinyPNG's pricing page, November 2026).",
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
