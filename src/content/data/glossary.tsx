import { type ReactNode } from "react";
import type { ContentEntry } from "../types";

const P = (children: ReactNode) => <p>{children}</p>;

export const GLOSSARY_CONTENT: Record<string, ContentEntry> = {
  "/glossary/avif": {
    path: "/glossary/avif",
    h1: "AVIF (AV1 Image File Format)",
    lede: "A modern, royalty-free image format based on the AV1 video codec — the best compression of any web image format.",
    keywords: ["avif", "av1 image file format", "image format", "image compression"],
    sections: [
      { id: "definition", heading: "Definition", body: [P(<>AVIF (AV1 Image File Format) is an image format that encodes still images using the AV1 video codec. It supports lossy and lossless compression, an alpha channel for transparency, animation, 12-bit color depth and wide color gamuts, and produces the smallest files of any current web image format.</>)] },
      { id: "in-practice", heading: "In practice", body: [P(<>At matched visual quality, AVIF files are roughly <strong>50–60%</strong> the size of JPEG and <strong>80%</strong> the size of WebP. Supported in Chrome, Firefox, Safari 16.4+ and Edge — over 96% of browsers in 2026. Its encoder is slower than WebP's, which is why batch tools run it in background workers.</>)] },
    ],
    faqs: [
      { question: "What does AVIF stand for?", answer: "AV1 Image File Format. It encodes still images using the AV1 video codec, which is why it achieves better compression than older image formats." },
      { question: "Is AVIF free to use?", answer: "Yes. AVIF is royalty-free and open, backed by the Alliance for Open Media. There are no licensing fees for encoding or decoding." },
      { question: "What browsers support AVIF?", answer: "Chrome, Firefox, Safari 16.4 and later, Edge, and all modern mobile browsers — over 96% of global traffic in 2026. A WebP or JPEG fallback inside a <picture> element covers the remainder." },
    ],
    related: [
      { path: "/formats/avif", label: "AVIF compressor" },
      { path: "/learn/webp-vs-avif", label: "WebP vs AVIF" },
      { path: "/glossary/webp", label: "What is WebP?" },
    ],
  },

  "/glossary/webp": {
    path: "/glossary/webp",
    h1: "WebP",
    lede: "Google's web image format — lossy, lossless, transparency and animation in one file, 25–35% smaller than JPEG and PNG.",
    keywords: ["webp", "image format", "google image format", "image compression"],
    sections: [
      { id: "definition", heading: "Definition", body: [P(<>WebP is an image format developed by Google, based on the VP8 video codec. It supports lossy compression, lossless compression, transparency (alpha channel) and animation within a single format, effectively replacing JPEG, PNG and animated GIF for web use.</>)] },
      { id: "in-practice", heading: "In practice", body: [P(<>At matched visual quality, WebP files are roughly <strong>25–35% smaller</strong> than JPEG and 20–30% smaller than PNG lossless. Universally supported since around 2020. It's the pragmatic default format for web images when AVIF isn't available.</>)] },
    ],
    faqs: [
      { question: "What is WebP used for?", answer: "WebP is used for web images — photographs, graphics with transparency, and animations. It produces files 25–35% smaller than JPEG at equivalent quality, which reduces page weight and improves load times." },
      { question: "Does WebP support transparency?", answer: "Yes. WebP supports a full 8-bit alpha channel for transparency in both lossy and lossless modes." },
      { question: "Is WebP better than JPEG?", answer: "For web use, yes. WebP produces files 25–35% smaller than JPEG at matched visual quality and additionally supports transparency and lossless compression. JPEG remains useful only for maximum compatibility." },
    ],
    related: [
      { path: "/formats/webp", label: "WebP compressor" },
      { path: "/learn/webp-vs-avif", label: "WebP vs AVIF" },
      { path: "/glossary/avif", label: "What is AVIF?" },
    ],
  },

  "/glossary/lossless-compression": {
    path: "/glossary/lossless-compression",
    h1: "Lossless compression",
    lede: "Compression that shrinks a file without discarding any data — the original can be reconstructed bit for bit.",
    keywords: ["lossless compression", "lossy vs lossless", "image compression", "png optimization"],
    sections: [
      { id: "definition", heading: "Definition", body: [P(<>Lossless compression reduces file size by encoding data more efficiently, while discarding nothing. The decompressed image is mathematically identical to the original — pixel for pixel. PNG and WebP's lossless mode are lossless formats; OxiPNG and zlib re-compression are lossless operations.</>)] },
      { id: "vs-lossy", heading: "Lossless vs lossy", body: [P(<>Lossy compression (JPEG, AVIF, WebP lossy) permanently discards data the eye is unlikely to notice — typically achieving far smaller files. Lossless compression never discards anything, so its savings are smaller but its fidelity is perfect. Use lossless for flat graphics, logos, screenshots and medical or technical imagery; lossy for photographs.</>)] },
    ],
    faqs: [
      { question: "What is the difference between lossy and lossless compression?", answer: "Lossy compression permanently discards some data to achieve much smaller files (JPEG, AVIF, WebP lossy). Lossless compression discards nothing — the original is reconstructed exactly — so files are larger but perfect (PNG, WebP lossless, OxiPNG optimization)." },
      { question: "Is PNG lossless?", answer: "Yes, PNG is always lossless. Any tool that visibly degrades a PNG is converting it, not optimizing it. PNG optimization works by improving filters and DEFLATE compression, not by removing pixels." },
      { question: "Should I use lossless or lossy compression for web images?", answer: "Lossy for photographs (WebP or AVIF at quality 80 — visually identical, far smaller). Lossless for flat-color graphics, logos, screenshots and anything with text, where compression artifacts are obvious." },
    ],
    related: [
      { path: "/formats/png", label: "PNG compressor" },
      { path: "/learn/reduce-image-file-size", label: "9 ways to reduce image file size" },
      { path: "/learn/image-optimization-guide", label: "Image optimization guide" },
    ],
  },

  "/glossary/core-web-vitals": {
    path: "/glossary/core-web-vitals",
    h1: "Core Web Vitals",
    lede: "Google's three metrics for real-world page experience: LCP (loading), INP (responsiveness) and CLS (visual stability).",
    keywords: ["core web vitals", "lcp", "inp", "cls", "page experience"],
    sections: [
      { id: "definition", heading: "Definition", body: [P(<>Core Web Vitals are Google's standardized metrics for page experience, measured from real Chrome users: <strong>LCP</strong> (Largest Contentful Paint), <strong>INP</strong> (Interaction to Next Paint) and <strong>CLS</strong> (Cumulative Layout Shift). Each has a target that must be met for at least 75% of page loads.</>)] },
      { id: "targets", heading: "The targets", body: [P(<><strong>LCP under 2.5 seconds</strong> — loading. <strong>INP under 200 milliseconds</strong> — responsiveness to taps and clicks. <strong>CLS under 0.1</strong> — visual stability. Images are the leading cause of failures in all three: the hero image usually is the LCP element, decoding blocks INP, and missing width/height attributes cause CLS.</>)] },
    ],
    faqs: [
      { question: "What are the three Core Web Vitals?", answer: "LCP (Largest Contentful Paint) measures loading, INP (Interaction to Next Paint) measures responsiveness to user input, and CLS (Cumulative Layout Shift) measures visual stability. Each must meet its target for at least 75% of page loads." },
      { question: "What is a good LCP score?", answer: "Under 2.5 seconds for at least 75% of page loads. On most pages the LCP element is a hero image, so compressing it, converting it to AVIF or WebP, and adding fetchpriority=\"high\" plus a preload are the highest-impact fixes." },
      { question: "Do Core Web Vitals affect SEO?", answer: "Yes. Page speed is a confirmed Google ranking signal and Core Web Vitals are part of that signal. Google measures them from real users via the Chrome UX Report, and poor scores can also limit eligibility for certain rich results." },
    ],
    related: [
      { path: "/learn/core-web-vitals-images", label: "Images & Core Web Vitals" },
      { path: "/learn/image-optimization-guide", label: "Image optimization guide" },
      { path: "/glossary/lcp", label: "What is LCP?" },
    ],
  },

  "/glossary/mozjpeg": {
    path: "/glossary/mozjpeg",
    h1: "MozJPEG",
    lede: "Mozilla's improved JPEG encoder — same JPEG format, roughly 10–15% smaller files at equal quality.",
    keywords: ["mozjpeg", "jpeg encoder", "jpeg compression", "progressive jpeg"],
    sections: [
      { id: "definition", heading: "Definition", body: [P(<>MozJPEG is a JPEG encoder maintained by Mozilla. It improves on the standard libjpeg encoder with <strong>trellis quantization</strong> (choosing coefficients that compress better at equal visual quality) and <strong>progressive encoding</strong>, producing JPEGs that are typically 10–15% smaller at the same visual quality while remaining 100% standard JPEG files.</>)] },
      { id: "in-practice", heading: "In practice", body: [P(<>Because MozJPEG output is a standard JPEG, it works everywhere JPEG works — no browser or tool changes needed. The catch is that few online compressors actually use it. ImageAlchemy uses MozJPEG for its JPEG output path.</>)] },
    ],
    faqs: [
      { question: "What does MozJPEG do?", answer: "MozJPEG is an improved JPEG encoder. Using trellis quantization and progressive encoding, it produces standard JPEG files that are roughly 10–15% smaller than those from the default libjpeg encoder, at the same visual quality." },
      { question: "Are MozJPEG files different from normal JPEGs?", answer: "No. MozJPEG output is a 100% standard JPEG file — every browser, editor and device reads it. The improvement is purely in how the file is encoded, not in the format itself." },
      { question: "Is MozJPEG free?", answer: "Yes. MozJPEG is open source, maintained by Mozilla, and royalty-free to use. ImageAlchemy uses it as its JPEG encoder." },
    ],
    related: [
      { path: "/formats/jpeg", label: "JPEG compressor" },
      { path: "/learn/reduce-image-file-size", label: "9 ways to reduce image file size" },
      { path: "/glossary/chroma-subsampling", label: "What is chroma subsampling?" },
    ],
  },

  "/glossary/chroma-subsampling": {
    path: "/glossary/chroma-subsampling",
    h1: "Chroma subsampling",
    lede: "How JPEG and other formats shrink files by storing less color detail than brightness detail.",
    keywords: ["chroma subsampling", "4:4:4", "4:2:0", "jpeg color", "image compression"],
    sections: [
      { id: "definition", heading: "Definition", body: [P(<>Chroma subsampling reduces file size by storing <strong>color (chroma) information at lower resolution than brightness (luma) information</strong>. The human eye is more sensitive to brightness detail than color detail, so discarding color data is rarely noticed. Notation like 4:4:4, 4:2:2 and 4:2:0 describes how many chroma samples are kept per block of pixels.</>)] },
      { id: "in-practice", heading: "In practice", body: [P(<><strong>4:2:0</strong> is the default for most web JPEGs and halves the color data — usually invisible on photographs. <strong>4:4:4</strong> keeps full color resolution and matters for images with saturated hard edges: graphics, text, screenshots and product shots with strong color boundaries. If you see color bleeding on a compressed screenshot, that's chroma subsampling.</>)] },
    ],
    faqs: [
      { question: "What does 4:2:0 mean?", answer: "It's a chroma subsampling mode: for every 4-pixel-by-2-pixel block, 2 chroma samples are kept in the horizontal direction and 0 additional vertical resolution — effectively halving color resolution in both directions. It's the default for most web JPEGs and is invisible on most photographs." },
      { question: "What is the difference between 4:4:4 and 4:2:0?", answer: "4:4:4 keeps full color resolution; 4:2:0 halves it horizontally and vertically. 4:2:0 produces smaller files and is fine for photographs. Use 4:4:4 for graphics, text and screenshots where color bleeding along hard edges would be visible." },
      { question: "Does chroma subsampling reduce quality?", answer: "It reduces color detail, which the human eye notices far less than brightness detail. On photographs at normal viewing size, 4:2:0 is effectively invisible. On saturated hard edges — text, screenshots, flat graphics — it can cause visible color bleeding, which is why those images are better served as PNG or WebP." },
    ],
    related: [
      { path: "/formats/jpeg", label: "JPEG compressor" },
      { path: "/glossary/mozjpeg", label: "What is MozJPEG?" },
      { path: "/learn/image-optimization-guide", label: "Image optimization guide" },
    ],
  },

  "/glossary/entropy-coding": {
    path: "/glossary/entropy-coding",
    h1: "Entropy coding",
    lede: "The final, lossless stage of image compression — squeezing out the last bits by representing common values more compactly.",
    keywords: ["entropy coding", "huffman coding", "deflate", "image compression"],
    sections: [
      { id: "definition", heading: "Definition", body: [P(<>Entropy coding is a lossless compression step that represents frequently occurring values with short codes and rare values with long ones. It's the last stage of most image codecs: PNG's DEFLATE, JPEG's Huffman tables, and the arithmetic/ANS coding in AV1 and WebP. Because it's lossless, re-encoding it more aggressively can only help.</>)] },
      { id: "in-practice", heading: "In practice", body: [P(<>This is what a PNG optimizer like OxiPNG attacks: it re-runs entropy coding with stronger settings and better filters to produce a mathematically identical but smaller file. It's why \"lossless optimization\" is real and why two PNGs of the same pixels can have different file sizes.</>)] },
    ],
    faqs: [
      { question: "What is entropy coding in image compression?", answer: "It's the final lossless stage of most image codecs, where frequently occurring values are encoded with short codes and rare values with long ones. PNG uses DEFLATE, JPEG uses Huffman tables, and AV1/WebP use arithmetic or ANS coding." },
      { question: "Is entropy coding lossless?", answer: "Yes, always. Entropy coding only changes how data is represented, never the data itself. That's why PNG optimizers like OxiPNG can shrink files with zero quality loss — they only redo this stage more efficiently." },
    ],
    related: [
      { path: "/formats/png", label: "PNG compressor" },
      { path: "/glossary/lossless-compression", label: "What is lossless compression?" },
    ],
  },

  "/glossary/lazy-loading": {
    path: "/glossary/lazy-loading",
    h1: "Lazy loading",
    lede: "Deferring image downloads until they're actually needed, cutting initial page weight and improving load times.",
    keywords: ["lazy loading", "loading lazy", "image loading", "web performance"],
    sections: [
      { id: "definition", heading: "Definition", body: [P(<>Lazy loading means an image is only fetched when it approaches the viewport. In modern browsers it needs no JavaScript: add <code>loading="lazy"</code> to the <code>&lt;img&gt;</code> tag. The browser estimates each image's position and loads off-screen images just before they scroll into view.</>)] },
      { id: "in-practice", heading: "In practice", body: [P(<>Lazy-load everything <em>below</em> the fold — never the hero image, which is usually the LCP element and should load eagerly with <code>fetchpriority="high"</code>. Without lazy loading, a long page with 40 images downloads all of them immediately; with it, a visitor who reads two paragraphs never downloads most of them.</>)] },
    ],
    faqs: [
      { question: "What is lazy loading of images?", answer: "It's deferring an image's download until it's about to enter the viewport. In modern browsers it's built in: add loading=\"lazy\" to an <img> tag and the browser handles the rest, no JavaScript required." },
      { question: "Should I lazy-load the hero image?", answer: "No. The hero image is usually the Largest Contentful Paint element, and lazy loading it delays the single most important render on the page. Load it eagerly with fetchpriority=\"high\" and a preload hint. Lazy-load only below-the-fold images." },
      { question: "Does lazy loading help SEO?", answer: "Indirectly, yes. It reduces initial page weight and main-thread work, which improves LCP, INP and CLS — all Core Web Vitals metrics Google uses as ranking signals." },
    ],
    related: [
      { path: "/learn/core-web-vitals-images", label: "Images & Core Web Vitals" },
      { path: "/learn/responsive-images", label: "Responsive images" },
      { path: "/learn/image-optimization-guide", label: "Image optimization guide" },
    ],
  },
};
