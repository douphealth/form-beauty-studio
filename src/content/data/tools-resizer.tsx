import { type ReactNode } from "react";
import type { ContentEntry } from "../types";

const P = (children: ReactNode) => <p>{children}</p>;

export const TOOL_CONTENT: Record<string, ContentEntry> = {
  "/tools/image-resizer": {
    path: "/tools/image-resizer",
    h1: "Free image resizer — batch resize images online",
    lede: "Resize images and photos online, in bulk, to exact pixel dimensions or standard presets (4K, 2K, 1080p, web, thumbnail). Runs entirely in your browser — nothing is uploaded.",
    keywords: ["image resizer", "resize image online", "batch resize images", "photo resizer", "resize images free"],
    sections: [
      { id: "how-to-resize", heading: "How to resize images with ImageAlchemy", body: [P(<>1. Drop your images or click to browse (up to 200 at once). 2. Under <strong>resize</strong>, pick a preset — 4K (3840px), 2K (2560px), Full HD (1920px), HD (1280px), Web (1920px WebP), Thumbnail (512px) — or set a custom max dimension. 3. Compress, then download individually or as a ZIP.</>)] },
      { id: "why-resize-matters", heading: "Why resizing matters", body: [P(<>Dimensions are the single biggest factor in image file size — halving the pixel count quarters the number of pixels. Most images are exported far larger than they're ever displayed: a 4000px photo shown at 800px carries 25× the pixels it needs.</>)] },
      { id: "choose-the-right-dimensions", heading: "Choosing the right dimensions", body: [P(<><strong>Full-width hero:</strong> 1920–2560px. <strong>Content width:</strong> 1280px. <strong>Product cards:</strong> 800–1000px. <strong>Thumbnails:</strong> 400–512px. For social posts, match the platform's display size — never wider than 2048px. Always keep <code>width</code> and <code>height</code> attributes on the tag to prevent layout shift.</>)] },
      { id: "resize-vs-compress", heading: "Resize vs compress — you need both", body: [P(<>Resizing reduces pixel count; compression encodes those pixels more efficiently. Resizing a 4000px photo to 1920px removes 75% of pixels, then converting to WebP at quality 80 compresses what's left. ImageAlchemy does both in one step.</>)] },
      { id: "privacy", heading: "Private by design", body: [P(<>Your images never leave your computer. ImageAlchemy runs WebAssembly codecs locally — no uploads, no server storage, no tracking pixels, no account. Safe for confidential and client work.</>)] },
    ],
    faqs: [
      { question: "How do I resize an image without losing quality?", answer: "Downscale rather than upscale, keep the aspect ratio locked, and export to a modern format (WebP or AVIF) at quality 80. Downscaling preserves sharpness; enlarging always softens. ImageAlchemy keeps aspect ratio automatically when you set a maximum dimension." },
      { question: "What is the best size for web images?", answer: "Match the display size, not bigger. Full-width heroes: 1920–2560px. Content-width images: 1280px. Product cards: 800–1000px. Thumbnails: 400–512px. Shipping larger dimensions than the container wastes bandwidth and slows LCP." },
      { question: "Can I resize multiple images at once?", answer: "Yes — ImageAlchemy supports batch resizing of up to 200 images per session. Set the dimensions once, apply to the whole batch, and download everything as a single ZIP." },
      { question: "How do I resize a photo on mobile?", answer: "ImageAlchemy works in mobile browsers — the interface is fully responsive. Tap to browse your camera roll, pick a preset or custom dimension, and the resizing happens on-device." },
      { question: "Is this image resizer free and private?", answer: "Yes. No account, no watermark, no upload. Everything runs locally in your browser using WebAssembly. Up to 200 images per batch." },
    ],
    related: [
      { path: "/tools/image-converter", label: "Free image converter" },
      { path: "/learn/responsive-images", label: "Responsive images with srcset" },
      { path: "/learn/image-optimization-guide", label: "Image optimization guide" },
      { path: "/formats/webp", label: "WebP compressor" },
    ],
  },
};
