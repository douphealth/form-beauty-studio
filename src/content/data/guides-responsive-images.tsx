import { type ReactNode } from "react";
import type { ContentEntry } from "../types";

const P = (children: ReactNode) => <p>{children}</p>;

export const GUIDE_CONTENT: Record<string, ContentEntry> = {
  "/learn/responsive-images": {
    path: "/learn/responsive-images",
    h1: "Responsive images: srcset, sizes and <picture> explained",
    lede: "Stop shipping a 4000-pixel image to a 390-pixel phone. srcset, sizes and the <picture> element are the browser-native way to serve the right file to the right screen — no JavaScript required.",
    keywords: ["responsive images", "srcset", "sizes attribute", "picture element", "art direction"],
    sections: [
      {
        id: "the-problem",
        heading: "The problem srcset solves",
        body: [
          P(<>A single <code>src</code> attribute gives every device the same file. Phones download a desktop-sized image and scale it down; desktops get a mobile-sized image that looks soft. Both cases waste bandwidth and hurt LCP.</>),
        ],
      },
      {
        id: "srcset-widths",
        heading: "srcset with width descriptors",
        body: [
          P(<>List the same image at several widths and let the browser choose:</>),
          P(<>The browser knows its viewport width, pixel density and network conditions, and picks the best candidate from that list. Rule of thumb: generate widths at <strong>320, 640, 960, 1280, 1920 and 2560px</strong> and stop where your layout's widest column ends.</>),
        ],
      },
      {
        id: "sizes-attribute",
        heading: "The sizes attribute",
        body: [
          P(<>The <code>sizes</code> attribute tells the browser how wide the image will actually be displayed, so it doesn't have to guess. Without it, the browser assumes the image spans the full viewport width and downloads something too large.</>),
          P(<>Write it as a media-condition list: <code>sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"</code>. Getting sizes right is the difference between srcset working and srcset quietly wasting data.</>),
        ],
      },
      {
        id: "picture-element",
        heading: "The <picture> element and art direction",
        body: [
          P(<>Use <code>&lt;picture&gt;</code> for two things. First, <strong>format negotiation</strong> — serve AVIF to browsers that accept it, WebP next, JPEG as fallback. Second, <strong>art direction</strong> — a cropped, tighter version of a hero image on mobile instead of the same wide image shrunk down.</>),
          P(<>The final <code>&lt;img&gt;</code> inside <code>&lt;picture&gt;</code> is mandatory: it's the fallback, and it's what carries <code>alt</code>, <code>width</code>, <code>height</code> and loading behavior.</>),
        ],
      },
      {
        id: "common-mistakes",
        heading: "Common mistakes",
        body: [
          P(<>Forgetting <code>sizes</code> (srcset then over-downloads); putting <code>loading="lazy"</code> on the LCP image; omitting <code>width</code> and <code>height</code> (causes CLS); generating widths far beyond your layout's actual maximum; and using <code>&lt;picture&gt;</code> media queries when a simple srcset would do.</>),
        ],
      },
    ],
    faqs: [
      {
        question: "What does the srcset attribute do?",
        answer: "srcset lets you list multiple versions of the same image at different widths (or pixel densities). The browser picks the best one for the current viewport, pixel ratio and network conditions, so phones get small files and desktops get sharp ones.",
      },
      {
        question: "What is the sizes attribute for?",
        answer: "It tells the browser how wide the image will be displayed, in CSS pixels, at various breakpoints. Without it the browser assumes the image fills the viewport width and downloads a file larger than needed. Always provide sizes when using width descriptors in srcset.",
      },
      {
        question: "When should I use the <picture> element?",
        answer: "Use <picture> when you need format negotiation (serve AVIF, fall back to WebP then JPEG) or art direction (different crops or entirely different images at different screen sizes). For a single image at multiple widths, srcset with width descriptors is enough.",
      },
      {
        question: "How many image widths should I generate?",
        answer: "Typically 4–6 widths spanning your layout's actual range: e.g. 320, 640, 960, 1280 and 1920px. Don't generate widths wider than the largest column the image will ever occupy — that wastes generation time and storage for files nobody downloads.",
      },
      {
        question: "Do responsive images help SEO?",
        answer: "Yes. Serving correctly sized images reduces downloaded bytes, which improves LCP and other Core Web Vitals metrics that Google uses as ranking signals. Google also recommends responsive images directly in its image SEO and Core Web Vitals documentation.",
      },
    ],
    related: [
      { path: "/learn/core-web-vitals-images", label: "Images & Core Web Vitals" },
      { path: "/learn/image-optimization-guide", label: "Image optimization: the complete guide" },
      { path: "/tools/image-resizer", label: "Free image resizer" },
      { path: "/learn/reduce-image-file-size", label: "9 proven ways to reduce image file size" },
    ],
  },
};
