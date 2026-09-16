import { type ReactNode } from "react";
import type { ContentEntry } from "../types";

const P = (children: ReactNode) => <p>{children}</p>;

export const COMPANY_CONTENT: Record<string, ContentEntry> = {
  "/about": {
    path: "/about",
    h1: "About ImageForge",
    lede: "ImageForge is a free, private image compression studio that runs entirely in your browser. No uploads, no servers, no compromises.",
    keywords: ["about imageforge", "image compression tool", "private image compression"],
    sections: [
      { id: "what-we-built", heading: "What we built", body: [P(<>ImageForge is a browser-based image compression studio. It converts and compresses images to <strong>AVIF, WebP, JPEG and PNG</strong> using the same professional codecs as desktop tools — MozJPEG, libwebp, OxiPNG and the AV1 encoder — compiled to WebAssembly and running locally on your own device.</>)] },
      { id: "why-privacy", heading: "Why privacy first", body: [P(<>Most online image tools upload your files to servers. That means your images — and your clients' images — sit on someone else's machine, subject to retention policies you can't audit. ImageForge never uploads anything. There is no server that could lose or leak your files, because there is no server in the path.</>)] },
      { id: "how-it-works", heading: "How it works", body: [P(<>When you drop a file, it's decoded and re-encoded by WebAssembly codecs inside your browser. Batch processing runs across Web Workers so the interface stays responsive, with pause, resume and cancel. Auto-Pick encodes each image as AVIF, WebP and JPEG in parallel and keeps the smallest.</>)] },
      { id: "who-behind-it", heading: "Who's behind it", body: [P(<>ImageForge is built by <strong>Alexios Papaioannou</strong>, a digital entrepreneur and full-stack creator. The project is open — the source is available and contributions are welcome.</>)] },
    ],
    faqs: [
      { question: "Is ImageForge really free?", answer: "Yes. No account, no subscription, no watermark, no file limits. Batch process up to 200 images at a time, as often as you like." },
      { question: "Does ImageForge upload my images?", answer: "No. All processing happens in your browser using WebAssembly codecs. Your images never leave your device, which makes it safe for confidential and client work." },
      { question: "What formats does ImageForge support?", answer: "Input: any common image format your browser can decode. Output: AVIF, WebP, JPEG and PNG, with conversion between them and an Auto-Pick mode that keeps the smallest result." },
      { question: "Is there a limit on batch size?", answer: "Up to 200 images per batch, with per-image format and quality overrides. Files up to 50 MB each." },
    ],
    related: [
      { path: "/learn/image-optimization-guide", label: "Image optimization guide" },
      { path: "/learn/best-free-image-compression-tools", label: "Best free image compression tools" },
      { path: "/tools/image-converter", label: "Free image converter" },
    ],
  },

  "/privacy": {
    path: "/privacy",
    h1: "Privacy Policy",
    lede: "ImageForge processes your images entirely on your device. This page explains exactly what we do and do not collect.",
    keywords: ["privacy policy", "imageforge privacy"],
    sections: [
      { id: "images", heading: "Your images", body: [P(<>ImageForge runs entirely client-side. Images you select are decoded and re-encoded by WebAssembly codecs inside your browser and never transmitted over the network. We have no servers storing your files, and no employee or third party ever has access to them.</>)] },
      { id: "data-we-do-not-collect", heading: "Data we do not collect", body: [P(<>We do not collect, store or transmit your images, file names, file contents, IP addresses, browsing history or any personal data. We do not use cookies for tracking, and we do not run analytics that identify you.</>)] },
      { id: "local-storage", heading: "Local browser storage", body: [P(<>ImageForge stores only your UI preferences in your browser's local storage: your theme (light or dark), your selected compression preset, and the auto-compress toggle. This data lives on your device and is never sent anywhere. Clearing your browser data removes it.</>)] },
      { id: "hosting", heading: "Hosting and CDN", body: [P(<>The website itself (HTML, CSS, JavaScript and codec binaries) is delivered over HTTPS through a content delivery network. The CDN may log standard request metadata (such as timestamps and IP addresses) as part of delivering the page, in line with its own privacy practices. Your images are not part of those logs.</>)] },
      { id: "contact", heading: "Changes and contact", body: [P(<>If this policy changes, we will update this page. This tool processes no personal data, so there is no personal data to request, correct or delete.</>)] },
    ],
    faqs: [
      { question: "Does ImageForge upload my images?", answer: "No. All compression and conversion happens in your browser via WebAssembly. Images never leave your device." },
      { question: "Does ImageForge use cookies?", answer: "No tracking cookies. Only your UI preferences (theme, preset, auto-compress toggle) are stored in local storage on your own device, and never transmitted." },
    ],
    related: [
      { path: "/about", label: "About ImageForge" },
    ],
  },
};
