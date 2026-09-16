import { type ReactNode } from "react";
import type { ContentEntry } from "../types";

const P = (children: ReactNode) => <p>{children}</p>;

export const FORMAT_CONTENT: Record<string, ContentEntry> = {
  "/formats/png": {
    path: "/formats/png",
    h1: "Shrink PNG files — free lossless PNG optimization",
    lede: "Reduce PNG file size without losing a single pixel. OxiPNG-grade re-encoding keeps full transparency and quality while stripping wasted space. Private, free, batch processing.",
    keywords: ["png compressor", "shrink png", "optimize png", "lossless png compression", "reduce png size"],
    sections: [
      { id: "when-to-use-png", heading: "When to use PNG", body: [P(<>PNG is the right choice for <strong>flat-color graphics, logos, screenshots, diagrams and images with hard transparency</strong> — anything where pixel-perfect lossless quality matters. It's the wrong choice for photographs, where WebP at quality 80 looks identical at a fraction of the size.</>)] },
      { id: "how-png-compression-works", heading: "How PNG optimization works", body: [P(<>PNG is always lossless, so a PNG optimizer can't throw pixels away. Instead it re-filters and re-encodes the data more efficiently: better <strong>delta filters</strong> per scanline, stronger <strong>zlib/DEFLATE</strong> compression, and removal of unused palette entries and metadata chunks.</>)] },
      { id: "oxipng", heading: "OxiPNG: the modern PNG optimizer", body: [P(<>OxiPNG is a Rust-based optimizer that tries multiple filter and compression strategies and keeps the smallest result — often <strong>15–40% smaller</strong> than a standard PNG export, with zero quality loss. ImageForge uses it under the hood.</>)] },
      { id: "png-vs-webp", heading: "PNG vs WebP lossless", body: [P(<>WebP's lossless mode beats PNG by roughly <strong>20–30%</strong> on the same content. If you don't strictly need the PNG format, convert flat graphics to WebP lossless. Keep PNG when you need universal compatibility or you're embedding the image somewhere WebP isn't accepted.</>)] },
      { id: "how-to-compress", heading: "How to compress a PNG with ImageForge", body: [P(<>1. Drop your PNG files. 2. Keep <strong>PNG</strong> as the output format (or try the <em>Max Quality</em> preset). 3. Compress — OxiPNG optimization runs automatically. 4. Download individually or as a ZIP. Up to 200 images per batch, fully on-device.</>)] },
    ],
    faqs: [
      { question: "How do I reduce the size of a PNG file?", answer: "Use a lossless optimizer like OxiPNG, which re-filters and re-compresses the data to produce files 15–40% smaller with zero quality loss. Also strip metadata chunks and reduce color depth to a palette when the image has 256 colors or fewer." },
      { question: "Can you compress PNG files losslessly?", answer: "Yes. PNG is a lossless format, so all real PNG optimization is lossless — it improves filtering and DEFLATE compression rather than discarding pixel data. Any tool that visibly degrades a PNG isn't optimizing, it's converting." },
      { question: "Why is my PNG so much larger than a JPEG of the same image?", answer: "PNG stores every pixel losslessly, which is extremely inefficient for photographs with millions of colors. For photos, use WebP or AVIF at quality 80 — visually identical and 5–10× smaller. Reserve PNG for flat-color graphics and hard transparency." },
      { question: "What is OxiPNG?", answer: "OxiPNG is a modern PNG optimizer written in Rust. It tries multiple filter and zlib compression strategies per image and keeps the smallest result, achieving 15–40% reduction with no quality loss. ImageForge uses it for its PNG output." },
      { question: "Should I use PNG or WebP for transparency?", answer: "WebP lossless supports full alpha transparency and is roughly 20–30% smaller than PNG for the same content. Use WebP when the platform allows it; keep PNG where you need maximum compatibility (email, legacy systems, document embedding)." },
    ],
    related: [
      { path: "/formats/webp", label: "WebP compressor" },
      { path: "/formats/jpeg", label: "JPEG compressor" },
      { path: "/learn/reduce-image-file-size", label: "9 ways to reduce image file size" },
      { path: "/glossary/lossless-compression", label: "What is lossless compression?" },
    ],
  },
};
