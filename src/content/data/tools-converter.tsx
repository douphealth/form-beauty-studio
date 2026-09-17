import { type ReactNode } from "react";
import type { ContentEntry } from "../types";

const P = (children: ReactNode) => <p>{children}</p>;

export const TOOL_CONTENT: Record<string, ContentEntry> = {
  "/tools/image-converter": {
    path: "/tools/image-converter",
    h1: "Free image converter — WebP, AVIF, JPEG and PNG",
    lede: "Convert images between formats in bulk, right in your browser. Turn PNG into WebP, JPEG into AVIF, or let Auto-Pick encode all three and keep the smallest. No uploads, no watermarks, no limits.",
    keywords: ["image converter", "convert image format", "png to webp", "jpeg to avif", "batch image converter"],
    sections: [
      { id: "supported-conversions", heading: "Supported conversions", body: [P(<>ImageAlchemy converts between <strong>AVIF, WebP, JPEG and PNG</strong> in any direction, for up to 200 images at once. Common jobs: PNG → WebP (transparency preserved), JPEG → WebP or AVIF (biggest savings), WebP → JPEG (compatibility), screenshots PNG → WebP lossless.</>)] },
      { id: "auto-pick", heading: "Auto-Pick: let the tool choose", body: [P(<>Enable <strong>Auto-Pick</strong> and ImageAlchemy encodes each image as WebP, AVIF and JPEG in parallel, then keeps whichever came out smallest at your chosen quality. It's the simplest way to get the best possible result per image without thinking about formats.</>)] },
      { id: "how-to-convert", heading: "How to convert images", body: [P(<>1. Drop your files. 2. Choose the output format, or enable <strong>Auto-Pick</strong>. 3. Set quality (80 default; 60–70 for AVIF) and max dimension. 4. Compress and download — individually or as one ZIP. Filenames are preserved, only the extension changes.</>)] },
      { id: "quality-and-transparency", heading: "Quality and transparency", body: [P(<>Transparency is preserved when converting PNG → WebP or AVIF. Converting a photograph to PNG won't improve it — you'll just get a much larger file. Converting lossy formats into each other (JPEG → WebP → AVIF) re-compresses; keep an eye on quality if you do it repeatedly.</>)] },
      { id: "why-convert", heading: "Why convert at all", body: [P(<>Format choice is the single largest lever on image file size. Converting JPEGs and PNGs to AVIF or WebP typically saves 25–50% of page weight with no visible quality change — which directly improves LCP and Core Web Vitals.</>)] },
    ],
    faqs: [
      { question: "How do I convert a PNG to WebP?", answer: "Drop the file into ImageAlchemy, select WebP as the output format, set quality and max dimension, then compress and download. Transparency is preserved automatically. Up to 200 images can be converted per batch, entirely in the browser." },
      { question: "How do I convert a JPEG to AVIF?", answer: "Drop the file, select AVIF as the output format, set quality to 60–70 (AVIF's scale differs from JPEG — quality 65 in AVIF looks like quality 80 in JPEG), and compress. Encoding runs in a background worker, so you can pause and resume large batches." },
      { question: "What is the best format to convert images to?", answer: "For web use in 2026: AVIF first for the smallest files, WebP as the universal default, JPEG only for maximum compatibility (email, legacy systems), PNG only for pixel-perfect flat graphics. Use the <picture> element to serve AVIF with WebP and JPEG fallbacks." },
      { question: "Can I convert images in bulk?", answer: "Yes. ImageAlchemy processes up to 200 images per batch, with per-image format and quality overrides if individual files need different settings. Download the results individually or as a single ZIP." },
      { question: "Does converting images reduce quality?", answer: "Converting to a lossy format (WebP, AVIF, JPEG) at quality 80 is visually indistinguishable from the original for nearly all photographs. Converting to PNG is lossless but produces very large files for photographs. Auto-Pick mode avoids the decision by encoding all three formats and keeping the smallest." },
    ],
    related: [
      { path: "/tools/image-resizer", label: "Free image resizer" },
      { path: "/formats/webp", label: "WebP compressor" },
      { path: "/formats/avif", label: "AVIF compressor" },
      { path: "/learn/webp-vs-avif", label: "WebP vs AVIF" },
    ],
  },
};
