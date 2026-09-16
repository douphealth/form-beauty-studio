import { type ReactNode } from "react";
import type { ContentEntry } from "../types";

const P = (children: ReactNode) => <p>{children}</p>;

export const FORMAT_CONTENT: Record<string, ContentEntry> = {
  "/formats/webp": {
    path: "/formats/webp",
    h1: "Compress and convert images to WebP — free and private",
    lede: "WebP is the best all-round web image format: 25–35% smaller than JPEG, with transparency and animation support. Convert your PNG and JPEG files to WebP here — nothing leaves your browser.",
    keywords: ["webp compressor", "convert to webp", "webp converter", "png to webp", "jpeg to webp"],
    sections: [
      { id: "what-is-webp", heading: "What is WebP?", body: [P(<>WebP is Google's image format, released in 2010 and universally supported since around 2020. It provides <strong>lossy and lossless compression</strong>, <strong>transparency</strong> (alpha channel) and <strong>animation</strong> in a single format, replacing JPEG, PNG and GIF for web use.</>)] },
      { id: "webp-vs-jpeg", heading: "WebP vs JPEG", body: [P(<>At matched visual quality, WebP files are typically <strong>25–35% smaller</strong> than JPEG. WebP additionally supports transparency and lossless mode, which JPEG cannot. JPEG remains marginively better for maximum compatibility — email clients and very old browsers.</>)] },
      { id: "webp-vs-png", heading: "WebP vs PNG", body: [P(<>For photographs, WebP lossy at quality 80 is typically <strong>5–10× smaller</strong> than PNG with no visible difference. For flat-color graphics, WebP lossless still beats PNG by 20–30%. Keep PNG only where pixel-perfect lossless quality or hard transparency is non-negotiable.</>)] },
      { id: "quality-settings", heading: "Recommended quality settings", body: [P(<><strong>78–82</strong> for hero and product photography. <strong>70–75</strong> for content images and thumbnails. <strong>Lossless mode</strong> for screenshots and flat graphics with text. ImageForge's <em>Web</em> preset uses quality 80 at 1920px max — a reliable default.</>)] },
      { id: "browser-support", heading: "Browser support", body: [P(<>Universal in 2026: Chrome, Firefox, Safari, Edge, Opera and all modern mobile browsers. Cover the remaining fraction with a JPEG fallback inside a <code>&lt;picture&gt;</code> element.</>)] },
      { id: "how-to-convert", heading: "How to convert to WebP with ImageForge", body: [P(<>1. Drop your files (or click to browse). 2. Choose <strong>WebP</strong> as the output format. 3. Set quality (80 is the default) and a max dimension. 4. Press compress, then download individually or as a ZIP. Up to 200 images per batch, entirely on-device.</>)] },
    ],
    faqs: [
      { question: "How do I convert a PNG or JPEG to WebP?", answer: "Drop your files into ImageForge, select WebP as the output format, set the quality (80 by default) and any maximum dimension, then compress and download. Conversion happens entirely in your browser — up to 200 images per batch, with individual or ZIP download." },
      { question: "What quality should I use for WebP?", answer: "Quality 78–82 for hero and product photography, 70–75 for thumbnails and content images. At quality 80, WebP is visually indistinguishable from the original for nearly all photographs while being roughly half the size of a quality-100 export." },
      { question: "Does WebP support transparency?", answer: "Yes. WebP supports a full 8-bit alpha channel for transparency in both lossy and lossless modes, so it replaces PNG for transparent graphics as well as JPEG for photographs." },
      { question: "Is WebP still worth using if AVIF exists?", answer: "Yes. WebP encodes faster, has universal support and slightly wider tooling. AVIF is roughly 20% smaller. The most robust approach is serving AVIF first, WebP second and JPEG as fallback using the <picture> element." },
      { question: "Is converting to WebP free and private?", answer: "With ImageForge, yes — conversion runs locally in your browser via WebAssembly codecs. No uploads, no account, no watermark, no limits." },
    ],
    related: [
      { path: "/formats/avif", label: "AVIF compressor" },
      { path: "/learn/webp-vs-avif", label: "WebP vs AVIF" },
      { path: "/learn/compress-images-for-web", label: "Compress images for the web" },
      { path: "/tools/image-converter", label: "Free image converter" },
    ],
  },
};
