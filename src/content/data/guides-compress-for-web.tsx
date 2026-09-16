import { type ReactNode } from "react";
import type { ContentEntry } from "../types";

const P = (children: ReactNode) => <p>{children}</p>;

export const GUIDE_CONTENT: Record<string, ContentEntry> = {
  "/learn/compress-images-for-web": {
    path: "/learn/compress-images-for-web",
    h1: "How to compress images for the web without losing quality",
    lede: "A practical, five-step process that cuts image weight by half or more while keeping your photos looking exactly as they should. No tools to install — everything here works in your browser.",
    keywords: ["compress images for web", "reduce image size", "image compression", "web images", "compress without quality loss"],
    sections: [
      {
        id: "the-30-second-version",
        heading: "The 30-second version",
        body: [
          P(<>Open <a href="https://imagealchemy.app/">ImageForge</a>, drop your images in, pick the <strong>Web</strong> preset, and download. That alone handles steps 1–4 below for most people and typically saves <strong>50–70%</strong> of file size.</>),
        ],
      },
      {
        id: "step-1-pick-the-format",
        heading: "Step 1 — Pick the format",
        body: [
          P(<>Photographs → <strong>WebP</strong> (or AVIF for the smallest files). Graphics with flat colors or hard transparency → <strong>PNG</strong>, then losslessly optimized. Maximum compatibility (email, old CMSs) → <strong>JPEG</strong>. Never ship a BMP, TIFF or raw PSD to a browser.</>),
        ],
      },
      {
        id: "step-2-resize",
        heading: "Step 2 — Resize to the display size",
        body: [
          P(<>Find the widest pixel dimension your image will actually be shown at, and downscale to it. A hero image is rarely needed wider than <strong>1920px</strong>; a blog image rarely wider than <strong>1280px</strong>; a thumbnail perhaps 400px. Shrinking a 4000px photo to 1920px removes 75% of its pixels before any compression even starts.</>),
        ],
      },
      {
        id: "step-3-set-quality",
        heading: "Step 3 — Set quality to 80, not 100",
        body: [
          P(<>At quality 100 you pay a large file-size penalty for changes no human eye can detect on a screen. <strong>Quality 80</strong> in WebP is the standard sweet spot; 70–75 is fine for content images and thumbnails. Preview at the size it will be shown — compression artifacts nearly vanish at real viewing scale.</>),
        ],
      },
      {
        id: "step-4-lossless-pass",
        heading: "Step 4 — Run a lossless pass and strip metadata",
        body: [
          P(<>A lossless optimizer re-encodes the file with better entropy coding and drops EXIF data (camera model, GPS, software). Quality stays identical; the file shrinks a few percent more. ImageForge applies this automatically with OxiPNG and MozJPEG's progressive + trellis settings.</>),
        ],
      },
      {
        id: "step-5-verify",
        heading: "Step 5 — Verify before you ship",
        body: [
          P(<>Check the result at 100% zoom and at display size. Compare the original and the compressed version side by side — ImageForge's before/after slider is built for exactly this. If you can't see a difference at the size your visitors will see it, the compression was free.</>),
        ],
      },
    ],
    faqs: [
      {
        question: "How do I compress an image without losing quality?",
        answer: "Use a lossy format (WebP or AVIF) at quality 80 and resize to the actual display dimensions, then run a lossless optimization pass. For most photographs this produces a file 50–70% smaller with no visible difference at viewing size. If you need pixel-perfect fidelity, use PNG with lossless optimization instead.",
      },
      {
        question: "What is the best free image compressor?",
        answer: "For privacy and batch processing, a browser-based tool like ImageForge is best — nothing is uploaded, there are no file limits, and you can process hundreds of images at once. Squoosh is good for single images and detailed per-format control. TinyPNG is convenient but uploads your files and limits batch size on the free tier.",
      },
      {
        question: "Does compressing images reduce quality?",
        answer: "Lossy compression always discards some data, but the goal is to discard data your eyes can't use. At quality 80 in WebP or AVIF, the difference is imperceptible at normal viewing distance for nearly all photographs. Lossless compression (PNG, OxiPNG) reduces file size without discarding anything at all.",
      },
      {
        question: "How much file size can I save by compressing images?",
        answer: "Typically 50–70% for photographs by converting to WebP at quality 80 and resizing to display dimensions. Converting a PNG photograph to WebP can save 80–90%. Lossless re-optimization adds another 2–10%.",
      },
      {
        question: "Is it safe to compress images online?",
        answer: "It depends on the tool. Server-based compressors upload your images to their servers. ImageForge performs all compression locally in your browser using WebAssembly codecs — files never leave your device, which makes it safe even for confidential or client work.",
      },
    ],
    related: [
      { path: "/learn/image-optimization-guide", label: "Image optimization: the complete guide" },
      { path: "/learn/reduce-image-file-size", label: "9 proven ways to reduce image file size" },
      { path: "/learn/webp-vs-avif", label: "WebP vs AVIF" },
      { path: "/learn/best-free-image-compression-tools", label: "Best free image compression tools" },
    ],
  },
};
