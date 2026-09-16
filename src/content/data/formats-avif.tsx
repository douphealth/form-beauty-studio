import { type ReactNode } from "react";
import type { ContentEntry } from "../types";

const P = (children: ReactNode) => <p>{children}</p>;

export const FORMAT_CONTENT: Record<string, ContentEntry> = {
  "/formats/avif": {
    path: "/formats/avif",
    h1: "Convert images to AVIF — the smallest web image format",
    lede: "AVIF produces the smallest files of any web image format — roughly 40–50% smaller than JPEG and 20% smaller than WebP. Convert your images to AVIF here, free and private.",
    keywords: ["avif compressor", "convert to avif", "avif converter", "avif compression", "smallest image format"],
    sections: [
      { id: "what-is-avif", heading: "What is AVIF?", body: [P(<>AVIF (AV1 Image File Format) is a modern, royalty-free image format based on the AV1 video codec. It offers the <strong>best compression of any web image format</strong>: lossy and lossless modes, transparency, animation, 12-bit color and wide gamut.</>)] },
      { id: "how-much-smaller", heading: "How much smaller is AVIF?", body: [P(<>At matched visual quality: JPEG = 100% (baseline), WebP ≈ 70–75%, <strong>AVIF ≈ 50–60%</strong>. For a 1 MB JPEG that's roughly 550 KB in AVIF — a 45% saving that compounds across hundreds of images.</>)] },
      { id: "quality-scale", heading: "AVIF's quality scale is different", body: [P(<>AVIF reaches equivalent visual quality at lower numbers than JPEG or WebP. Where you'd use quality 80 for WebP, use <strong>60–70 for AVIF</strong>. Don't be alarmed by the lower number — compare by eye, not by the slider.</>)] },
      { id: "browser-support", heading: "Browser support", body: [P(<>Chrome, Firefox, Safari 16.4+, Edge and all modern mobile browsers — over 96% of global traffic in 2026. Serve WebP and JPEG fallbacks inside a <code>&lt;picture&gt;</code> element to cover the rest.</>)] },
      { id: "encoding-speed", heading: "Encoding speed", body: [P(<>AVIF's AV1-based encoder is slower than WebP's — often 3–10× for a single image. ImageForge runs AVIF encoding in background Web Workers with pause, resume and cancel, so batches never block the interface.</>)] },
      { id: "how-to-convert", heading: "How to convert to AVIF with ImageForge", body: [P(<>1. Drop your files. 2. Choose <strong>AVIF</strong> as the output format. 3. Set quality (60–70 recommended) and max dimension. 4. Compress, then download individually or as a ZIP. Up to 200 images per batch, fully on-device.</>)] },
    ],
    faqs: [
      { question: "How do I convert an image to AVIF?", answer: "Drop your files into ImageForge, select AVIF as the output format, set quality (60–70 recommended, since AVIF's scale differs from JPEG and WebP) and any max dimension, then compress and download. Everything runs in your browser; up to 200 images per batch." },
      { question: "Is AVIF better than WebP?", answer: "On file size, yes — AVIF is roughly 20% smaller than WebP at equivalent quality, with 12-bit color and wide-gamut support. WebP encodes faster and has marginally broader tooling. Serve AVIF first with WebP and JPEG fallbacks via the <picture> element for the best of both." },
      { question: "What quality should I use for AVIF?", answer: "60–70 for most photographs. AVIF reaches equivalent visual quality at lower numbers than JPEG or WebP, so quality 65 in AVIF looks roughly like quality 80 in WebP. Always judge by eye on your own images." },
      { question: "Does AVIF support transparency and animation?", answer: "Yes to both. AVIF supports a full alpha channel for transparency and animated image sequences — and does both more efficiently than PNG and animated GIF." },
      { question: "Why is AVIF encoding slow?", answer: "AVIF uses the AV1 video codec's encoder, which is computationally heavier than WebP's or JPEG's. ImageForge handles this by encoding in background WebAssembly workers, so you can pause, resume and cancel while the interface stays responsive." },
    ],
    related: [
      { path: "/formats/webp", label: "WebP compressor" },
      { path: "/learn/webp-vs-avif", label: "WebP vs AVIF" },
      { path: "/glossary/avif", label: "What is AVIF?" },
      { path: "/tools/image-converter", label: "Free image converter" },
    ],
  },
};
