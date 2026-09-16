import { type ReactNode } from "react";
import type { ContentEntry } from "../types";

const P = (children: ReactNode) => <p>{children}</p>;

export const FORMAT_CONTENT: Record<string, ContentEntry> = {
  "/formats/jpeg": {
    path: "/formats/jpeg",
    h1: "Reduce JPEG file size — free, private, in your browser",
    lede: "Shrink JPEG and JPG files without installing software. Batch compress with MozJPEG-grade encoding, preview before and after, and download individually or as a ZIP.",
    keywords: ["jpeg compressor", "reduce jpeg file size", "compress jpg", "jpeg optimizer", "shrink jpeg"],
    sections: [
      { id: "when-to-use-jpeg", heading: "When to use JPEG", body: [P(<>JPEG is the most compatible image format on earth — every browser, email client and device reads it. Use it when you need <strong>maximum compatibility</strong> or your platform doesn't support AVIF/WebP. For modern websites, those formats are better choices.</>)] },
      { id: "how-much-can-you-save", heading: "How much you can save", body: [P(<>A JPEG exported at quality 100 from a camera or editor is typically <strong>40–60% larger</strong> than it needs to be. Re-compressing at quality 80 with MozJPEG's progressive + trellis settings recovers most of that with no visible difference.</>)] },
      { id: "mozjpeg-explained", heading: "Why the encoder matters", body: [P(<>Not all JPEGs are equal. <strong>MozJPEG</strong> is Mozilla's improved JPEG encoder that produces files roughly <strong>10–15% smaller</strong> at the same visual quality, using trellis quantization and progressive encoding. ImageForge uses it — most online compressors don't.</>)] },
      { id: "quality-recommendations", heading: "Quality recommendations", body: [P(<><strong>80</strong> for photographs shown at full width. <strong>70–75</strong> for content images and thumbnails. <strong>90+</strong> only for portfolio images where you want to preserve fine texture. Never use quality 100 — it bloats files for invisible gains.</>)] },
      { id: "progressive-jpeg", heading: "Progressive JPEG", body: [P(<>Progressive JPEGs load in passes, showing a low-quality version quickly before refining. They're typically smaller than baseline JPEGs and perceived as faster. ImageForge outputs progressive JPEG by default.</>)] },
      { id: "how-to-compress", heading: "How to compress a JPEG with ImageForge", body: [P(<>1. Drop your JPEG files. 2. Keep <strong>JPEG</strong> as the output format. 3. Set quality (80 default) and max dimension. 4. Compress and download. Up to 200 images per batch, entirely on-device.</>)] },
    ],
    faqs: [
      { question: "How do I reduce the file size of a JPEG?", answer: "Re-compress it at quality 80 with a modern encoder (MozJPEG with progressive and trellis settings) and resize to the dimensions it's actually displayed at. That typically cuts a quality-100 JPEG by 40–60% with no visible difference. ImageForge does all of this in the browser." },
      { question: "What is the best quality setting for JPEG?", answer: "80 for most photographs. Below 70 you start to see blocking artifacts; above 90 you pay a large file-size penalty for gains no one can see. Quality 100 is almost never correct for web use." },
      { question: "What is MozJPEG and why does it matter?", answer: "MozJPEG is Mozilla's improved JPEG encoder. Using trellis quantization and progressive encoding, it produces JPEG files roughly 10–15% smaller than standard encoders at the same visual quality. Most online JPEG compressors don't use it." },
      { question: "What is a progressive JPEG?", answer: "A progressive JPEG encodes the image in passes from coarse to fine, so a blurry version appears immediately and refines as it downloads. Progressive JPEGs are usually smaller than baseline ones and are perceived as faster by users." },
      { question: "Can I compress JPEG files without uploading them?", answer: "Yes. ImageForge runs MozJPEG-grade encoding locally in your browser via WebAssembly. Files never leave your device, no account is needed, and up to 200 images can be processed per batch." },
    ],
    related: [
      { path: "/formats/webp", label: "WebP compressor" },
      { path: "/formats/avif", label: "AVIF compressor" },
      { path: "/learn/reduce-image-file-size", label: "9 ways to reduce image file size" },
      { path: "/glossary/mozjpeg", label: "What is MozJPEG?" },
    ],
  },
};
