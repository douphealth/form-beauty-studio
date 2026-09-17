import { type ReactNode } from "react";
import type { ContentEntry } from "../types";

const P = (children: ReactNode) => <p>{children}</p>;

export const GUIDE_CONTENT: Record<string, ContentEntry> = {
  "/learn/core-web-vitals-images": {
    path: "/learn/core-web-vitals-images",
    h1: "Images and Core Web Vitals: fixing LCP, INP and CLS",
    lede: "Images are the number one cause of poor Core Web Vitals. Here's exactly how each metric is affected and the fixes that move your scores green — with the impact you can expect from each.",
    keywords: ["core web vitals", "lcp", "inp", "cls", "image performance", "page speed"],
    sections: [
      {
        id: "what-are-core-web-vitals",
        heading: "What are Core Web Vitals?",
        body: [
          P(<>Core Web Vitals are Google's three metrics for page experience: <strong>LCP</strong> (Largest Contentful Paint — loading), <strong>INP</strong> (Interaction to Next Paint — responsiveness) and <strong>CLS</strong> (Cumulative Layout Shift — visual stability). Google measures these from real users (field data via the Chrome UX Report) and uses them as ranking signals.</>),
          P(<>Images touch all three — usually negatively. The hero image is very often the LCP element, heavy main-thread work during image decoding blocks INP, and images without dimensions cause CLS.</>),
        ],
      },
      {
        id: "lcp-largest-contentful-paint",
        heading: "LCP — the hero image problem",
        body: [
          P(<>LCP measures when the largest visible element renders. On most pages that's a hero image or banner. Targets: <strong>under 2.5 seconds</strong> for at least 75% of page loads.</>),
          P(<><strong>Fixes, in order of impact:</strong> compress and convert to AVIF/WebP (biggest single win); resize to display dimensions; set <code>fetchpriority="high"</code> on the LCP image; preload it; avoid lazy-loading it; serve it from a CDN with long cache headers.</>),
        ],
      },
      {
        id: "inp-interaction-to-next-paint",
        heading: "INP — decoding blocks interaction",
        body: [
          P(<>INP measures how quickly the page responds to taps and clicks. Large images decoding on the main thread delay that response. Target: <strong>under 200 milliseconds</strong>.</>),
          P(<><strong>Fixes:</strong> ship fewer, smaller images; use modern formats (they decode faster per byte); lazy-load below-the-fold images so decoding is deferred; keep the main thread free during scrolling.</>),
        ],
      },
      {
        id: "cls-cumulative-layout-shift",
        heading: "CLS — images without dimensions",
        body: [
          P(<>When an image loads without reserved space, everything below it jumps. That shift accumulates into CLS. Target: <strong>under 0.1</strong>.</>),
          P(<><strong>Fixes:</strong> always set explicit <code>width</code> and <code>height</code> attributes (the browser computes the aspect ratio and reserves space); use <code>aspect-ratio</code> in CSS; reserve space for ads and embeds; avoid injecting images above existing content.</>),
        ],
      },
      {
        id: "measuring-and-fixing",
        heading: "Measuring and prioritizing fixes",
        embed: "page-weight",
        body: [
          P(<>Measure with PageSpeed Insights or Search Console (field data) and Chrome DevTools' Performance panel (lab data). Fix LCP first — it has the largest effect on both scores and perceived speed. Then CLS (cheap and quick: add dimensions), then INP.</>),
          P(<>Run your images through ImageAlchemy before anything else. Getting format and dimensions right fixes more Core Web Vitals problems than any code change.</>),
        ],
      },
    ],
    faqs: [
      {
        question: "What are Core Web Vitals?",
        answer: "Google's three page-experience metrics: LCP (Largest Contentful Paint) measures loading performance, INP (Interaction to Next Paint) measures responsiveness to user input, and CLS (Cumulative Layout Shift) measures visual stability. Each has a target: LCP under 2.5s, INP under 200ms, CLS under 0.1, each for at least 75% of page loads.",
      },
      {
        question: "How do images affect LCP?",
        answer: "The largest visible element on a page is usually a hero image, and LCP fires when it finishes rendering. Slow, oversized or unoptimized images directly delay LCP. The highest-impact fixes are compressing to AVIF or WebP, resizing to display dimensions, and adding fetchpriority=\"high\" plus a preload hint.",
      },
      {
        question: "Why do images cause layout shift (CLS)?",
        answer: "When an image loads without width and height attributes, the browser can't reserve space for it, so surrounding content shifts when it appears. Setting explicit dimensions (or an aspect-ratio in CSS) on every image eliminates virtually all image-related CLS.",
      },
      {
        question: "What is a good LCP score?",
        answer: "Under 2.5 seconds for at least 75% of page loads. Between 2.5s and 4s needs improvement; over 4s is poor. For image-heavy pages, converting the LCP image to AVIF or WebP and preloading it is usually the fastest route to green.",
      },
      {
        question: "Does Google rank image-optimized pages higher?",
        answer: "Page speed is a confirmed ranking signal and Core Web Vitals are part of that. Images are the largest contributor to page weight on most sites, so optimizing them improves LCP, INP and CLS — which feeds directly into rankings and can also unlock rich results.",
      },
    ],
    related: [
      { path: "/learn/image-optimization-guide", label: "Image optimization: the complete guide" },
      { path: "/learn/responsive-images", label: "Responsive images with srcset" },
      { path: "/glossary/core-web-vitals", label: "Core Web Vitals glossary definition" },
      { path: "/learn/compress-images-for-web", label: "Compress images for the web" },
    ],
  },
};
