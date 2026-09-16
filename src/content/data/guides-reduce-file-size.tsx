import { type ReactNode } from "react";
import type { ContentEntry } from "../types";

const P = (children: ReactNode) => <p>{children}</p>;

export const GUIDE_CONTENT: Record<string, ContentEntry> = {
  "/learn/reduce-image-file-size": {
    path: "/learn/reduce-image-file-size",
    h1: "9 proven ways to reduce image file size",
    lede: "Techniques ordered by impact. Work from the top — the first three account for the vast majority of the bytes you can save.",
    keywords: ["reduce image file size", "make image smaller", "image compression", "shrink image", "image size"],
    sections: [
      { id: "1-convert-to-a-modern-format", heading: "1. Convert to AVIF or WebP", body: [P(<>Still the biggest win. Moving a JPEG to <strong>WebP</strong> at equal quality cuts roughly 25–35%; moving to <strong>AVIF</strong> cuts 40–50%. If you do nothing else on this list, do this.</>)] },
      { id: "2-resize-to-display-dimensions", heading: "2. Resize to display dimensions", body: [P(<>A 4000px image shown at 800px wide is carrying 25× more pixels than needed. Downscale to the largest size it will ever be displayed at — typically 1920px for heroes, 1280px for content images.</>)] },
      { id: "3-lower-quality-to-80", heading: "3. Lower quality to 80", body: [P(<>Quality 100 costs a lot for invisible gains. Quality 80 in WebP or AVIF is visually indistinguishable on screen for nearly all photographs and roughly halves the file versus quality 100.</>)] },
      { id: "4-strip-metadata", heading: "4. Strip EXIF metadata", body: [P(<>Camera model, lens, GPS coordinates, editing history and embedded thumbnails can account for several percent of file size. Stripping it shrinks files and removes a privacy leak.</>)] },
      { id: "5-lossless-re-optimization", heading: "5. Run a lossless re-optimization", body: [P(<>Tools like OxiPNG (PNG) and MozJPEG's trellis/progressive settings re-encode the same pixel data more efficiently. Zero quality loss, another 2–10% gone.</>)] },
      { id: "6-use-the-right-color-space", heading: "6. Use the right color space", body: [P(<>Photographs should be sRGB for web. Wide-gamut profiles (Adobe RGB, ProPhoto) bloat files and render incorrectly in browsers unless handled explicitly.</>)] },
      { id: "7-avoid-png-for-photographs", heading: "7. Stop using PNG for photographs", body: [P(<>PNG is lossless and wonderful for graphics with flat color. For photographs it is enormous — often 5–10× an equivalent WebP at quality 80 with no visible difference. Convert photo PNGs to WebP.</>)] },
      { id: "8-reduce-color-depth", heading: "8. Reduce color depth for graphics", body: [P(<>Logos, icons and flat-color graphics often need 256 colors or fewer. Reducing to 8-bit palette PNG (or SVG) shrinks these files dramatically with no visible change.</>)] },
      { id: "9-crop-and-compose-tighter", heading: "9. Crop tighter", body: [P(<>The most reliable optimization: don't include pixels nobody will see. Crop to the subject, remove dead space, and shoot/export at the aspect ratio you'll actually display.</>)] },
    ],
    faqs: [
      { question: "How do I reduce the file size of an image?", answer: "In order of impact: convert to AVIF or WebP, resize to the actual display dimensions, lower quality to 80, strip EXIF metadata, and run a lossless re-optimization pass. Together these typically cut file size by 50–70% with no visible quality loss." },
      { question: "What reduces image file size the most?", answer: "Converting JPEG and PNG to AVIF or WebP. AVIF is typically 40–50% smaller than the JPEG baseline and WebP 25–35% smaller, at equivalent visual quality. Resizing to display dimensions is a close second." },
      { question: "How do I reduce a JPEG's file size without losing quality?", answer: "Keep the JPEG format but apply lossless optimizations: MozJPEG's trellis quantization and progressive encoding, plus EXIF stripping. That yields roughly 10–15% with no change in pixels. For larger savings, accept quality 80 — visually indistinguishable on screen." },
      { question: "Why is my PNG file so large?", answer: "PNG is lossless, so photographs stored as PNG are huge — often 5–10× the size of an equivalent WebP at quality 80. Use PNG only for flat-color graphics, logos and images needing hard transparency, and run OxiPNG optimization on those." },
      { question: "Does stripping EXIF metadata affect image quality?", answer: "No. EXIF metadata contains camera model, settings, GPS coordinates and embedded thumbnails — none of it affects the visible image. Removing it reduces file size and protects privacy, with zero visual difference." },
    ],
    related: [
      { path: "/learn/image-optimization-guide", label: "Image optimization: the complete guide" },
      { path: "/learn/compress-images-for-web", label: "Compress images for the web" },
      { path: "/learn/best-free-image-compression-tools", label: "Best free image compression tools" },
      { path: "/glossary/lossless-compression", label: "What is lossless compression?" },
    ],
  },
};
