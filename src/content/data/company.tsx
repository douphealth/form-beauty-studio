import { type ReactNode } from "react";
import type { ContentEntry } from "../types";

const P = (children: ReactNode) => <p>{children}</p>;

export const COMPANY_CONTENT: Record<string, ContentEntry> = {
  "/about": {
    path: "/about",
    h1: "About ImageAlchemy",
    lede: "ImageAlchemy is a free, private image compression studio that runs entirely in your browser. No uploads, no servers, no compromises — and a deliberate answer to the question of why it was built this way.",
    keywords: ["about imagealchemy", "image compression tool", "private image compression", "browser image compressor"],
    sections: [
      {
        id: "what-we-built",
        heading: "What we built",
        body: [
          P(<>ImageAlchemy is a browser-based image compression studio. It converts and compresses images to <strong>AVIF, WebP, JPEG and PNG</strong> using the same professional codecs as desktop tools — MozJPEG, libwebp, OxiPNG and the AV1 encoder — compiled to WebAssembly and running locally on your own device.</>),
          P(<>That means you get desktop-grade encoding without installing anything, and without your files ever leaving the machine you are sitting at. Batch up to 200 images at a time, fine-tune quality per image or across the set, and download the results individually or as a single ZIP.</>),
        ],
      },
      {
        id: "why-privacy",
        heading: "Why privacy first",
        body: [
          P(<>Most online image tools upload your files to a server. That means your images — and your clients' images — sit on someone else's machine, subject to a retention policy you cannot audit and a breach you would never hear about promptly.</>),
          P(<>ImageAlchemy inverts that. There is no server that could lose or leak your files, because there is no server in the image path at all. This is not a policy we promise to uphold; it is a property of how the tool is built, and it is the single most important design decision in the project.</>),
          P(<>The practical consequence is that the tool is usable for work that a cloud converter is not: confidential client photography, unreleased product shots, medical or legal imagery, and anything under an NDA.</>),
        ],
      },
      {
        id: "how-it-works",
        heading: "How it works",
        body: [
          P(<>When you drop a file, it is decoded and re-encoded by WebAssembly codecs inside your browser. Batch processing runs across Web Workers so the interface stays responsive, with pause, resume and cancel. <strong>Auto-Pick</strong> encodes each image as AVIF, WebP and JPEG in parallel and keeps the smallest result, which removes the guesswork about which format wins for a given picture.</>),
          P(<>Because the codecs are the same ones the professional ecosystem uses, the output is the output you would get from a command-line tool — just without the terminal, and without a round trip to anyone's server.</>),
        ],
      },
      {
        id: "what-makes-it-different",
        heading: "What actually makes it different",
        body: [
          P(<>Format support and quality sliders are table stakes; most tools have them. The differences that matter are structural:</>),
          P(<><strong>No upload path.</strong> Not "we delete your files after an hour" — there is no upload step to delete anything from.</>),
          P(<><strong>No account, no quota, no watermark.</strong> There is nothing to sign up for and no artificial limit designed to push you toward a paid tier. The free tool is not a demo of the paid one.</>),
          P(<><strong>Real encoders, not re-wrappers.</strong> MozJPEG, libwebp, OxiPNG and AV1 — the same libraries behind professional pipelines.</>),
          P(<><strong>Honest numbers.</strong> Where the site quotes a saving, that figure came from an actual encode you can reproduce. The comparison demo on the home page is two genuine files, and the build fails if the measured difference collapses.</>),
        ],
      },
      {
        id: "who-behind-it",
        heading: "Who's behind it",
        body: [
          P(<>ImageAlchemy is built by <strong>Alexios Papaioannou</strong>, a digital entrepreneur and full-stack creator who builds and operates web products. The tool started as a practical answer to a recurring problem — needing to compress images for client work without handing those images to a third-party service.</>),
          P(<>The project is developed in the open and the source is available. If you find a bug or a claim on this site that does not hold up, that is worth reporting, and it will be fixed rather than reworded.</>),
        ],
      },
      {
        id: "how-to-judge-it",
        heading: "How to judge the claims on this site",
        body: [
          P(<>Every performance or savings figure published here is either measured at build time or attributed to published research, and the site distinguishes between the two. Where a number is modelled rather than measured, it is labelled as such — the quality explorer on the guides is the clearest example.</>),
          P(<>This matters because image compression is a category full of invented statistics. If a claim on this site cannot be traced to a measurement or a cited source, treat that as a defect and tell us.</>),
        ],
      },
    ],
    faqs: [
      {
        question: "Is ImageAlchemy really free?",
        answer: "Yes. No account, no subscription, no watermark and no file limits. Batch process up to 200 images at a time, as often as you like. The Pro audit is a separate one-time purchase for a different job — auditing pages you do not own — and the free compressor is not restricted to sell it.",
      },
      {
        question: "Does ImageAlchemy upload my images?",
        answer: "No. All processing happens in your browser using WebAssembly codecs. Your image data never leaves your device, which makes the tool safe for confidential, medical, legal and client-owned work where uploading to a third-party converter would be a problem.",
      },
      {
        question: "What formats does ImageAlchemy support?",
        answer: "Input: any common image format your browser can decode, including JPEG, PNG, WebP, AVIF, GIF, BMP and SVG. Output: AVIF, WebP, JPEG and PNG, with conversion between them and an Auto-Pick mode that encodes several formats and keeps the smallest result.",
      },
      {
        question: "Is there a limit on batch size?",
        answer: "Up to 200 images per batch, with per-image format and quality overrides, and files up to 50 MB each. Because processing is client-side, the practical limit is your device's memory rather than a server quota.",
      },
      {
        question: "How is ImageAlchemy different from TinyPNG or Squoosh?",
        answer: "The main difference is structural: there is no upload step at all, so your images never exist on anyone else's infrastructure. ImageAlchemy also exposes the real encoder controls — quality, format, resizing, chroma handling — rather than a single automatic button, and it uses the same codecs (MozJPEG, libwebp, OxiPNG, AV1) as professional pipelines.",
      },
    ],
    related: [
      { path: "/learn/image-optimization-guide", label: "Image optimization guide" },
      { path: "/learn/best-free-image-compression-tools", label: "Best free image compression tools" },
      { path: "/tools/image-converter", label: "Free image converter" },
      { path: "/privacy", label: "Privacy policy" },
    ],
  },

  "/privacy": {
    path: "/privacy",
    h1: "Privacy Policy",
    lede: "ImageAlchemy processes your images entirely on your device. This page describes precisely what leaves your browser and what does not — including the performance analytics the site runs and the local data it stores.",
    keywords: ["privacy policy", "imagealchemy privacy", "client-side image compression privacy"],
    sections: [
      {
        id: "the-short-version",
        heading: "The short version",
        body: [
          P(<>Your images are never uploaded. Every file you select is decoded and re-encoded by WebAssembly codecs inside your browser, and the bytes never cross the network. That guarantee has no exceptions and no asterisks.</>),
          P(<>The site does collect <strong>anonymous performance analytics</strong> — page paths, load timings and Core Web Vitals — so we can tell whether the tool is fast enough. It does not receive your images, your file names, or anything that identifies you. The details are below, written to match what the code actually does rather than what sounds reassuring.</>),
        ],
      },
      {
        id: "images",
        heading: "Your images",
        body: [
          P(<>ImageAlchemy runs entirely client-side. Images you select are decoded and re-encoded by WebAssembly codecs inside your browser and are never transmitted over the network. We operate no server that receives image data, so there is no store of your files to lose, subpoena or leak.</>),
          P(<>This extends to the Pro website audit, with one deliberate exception: to audit a page you do not own, a request has to be made to fetch that page's HTML. That request fetches the <strong>public URL you type in</strong> — never your images, and never any file from your device. See <strong>Pro audit</strong> below.</>),
        ],
      },
      {
        id: "analytics",
        heading: "Analytics we do run",
        body: [
          P(<>The site loads a lightweight, privacy-oriented analytics script that records <strong>aggregate, non-identifying</strong> information: the page path you visited, the referring URL, your browser's user-agent string, a country derived from your browser's locale setting, page-load performance metrics (including Core Web Vitals timings), and a random identifier generated per visit.</>),
          P(<>That random identifier is created in your browser, is not tied to any account, and is not used to build a profile across other websites. We do not run advertising pixels, we do not sell or share this data with data brokers, and we do not attempt to identify individual visitors.</>),
          P(<>We are describing this explicitly because vague privacy copy is worse than none. If you would prefer not to be measured at all, any content blocker or the browser's tracking-protection setting will suppress the script, and the tool will continue to work exactly the same — it is client-side and requires no network access to function.</>),
        ],
      },
      {
        id: "local-storage",
        heading: "What is stored on your device",
        body: [
          P(<>Two categories of data live in your browser's local storage, both on your device only:</>),
          P(<><strong>Your preferences</strong> — the theme you picked (light or dark), the compression preset you last used, the auto-compress toggle, and your Pro licence key if you have purchased one. These exist so the tool remembers your setup between visits.</>),
          P(<><strong>A queue of pending analytics events</strong> — the analytics script buffers measurements locally before sending them, and flushes the queue once it can reach the endpoint. This contains the performance and page-path values described above, never image data or file names.</>),
          P(<>Nothing in local storage is shared with other websites. Clearing your browser's site data removes all of it, and the tool will simply start from its defaults.</>),
        ],
      },
      {
        id: "pro-audit",
        heading: "Pro website audit",
        body: [
          P(<>The Pro audit is the only feature that makes a network request on your behalf. When you submit a URL, the page's <strong>HTML is fetched by our proxy</strong> so it can be parsed — browsers block a page from reading another origin's HTML, so this step cannot happen client-side.</>),
          P(<>The proxy receives the URL you typed, fetches only public HTTP and HTTPS addresses, and refuses private, loopback and internal network ranges. Parsing, measurement and scoring all happen back in your browser; the fetched HTML is not retained as a corpus, and no audit results are stored on a server after the response is returned.</>),
        ],
      },
      {
        id: "hosting",
        heading: "Hosting and delivery",
        body: [
          P(<>The website itself — HTML, CSS, JavaScript and the WebAssembly codec binaries — is delivered over HTTPS. The hosting platform necessarily processes standard request metadata such as timestamps, IP addresses and requested paths in order to serve the page and protect against abuse, under its own privacy terms. Your image data is not part of those logs, because it is never sent.</>),
        ],
      },
      {
        id: "your-controls",
        heading: "Your controls",
        body: [
          P(<>You can block the analytics script without affecting any feature. You can clear local storage at any time to remove your preferences and the pending event queue. Because we hold no account and no personal record, there is nothing to request, correct or export — there is no profile to retrieve.</>),
        ],
      },
      {
        id: "changes",
        heading: "Changes to this policy",
        body: [
          P(<>If the instrumentation or data handling changes, this page changes with it in the same release. The guarantee that your images never leave your device is structural — it follows from the architecture, not from a promise — and will not change while the tool remains client-side.</>),
        ],
      },
    ],
    faqs: [
      {
        question: "Does ImageAlchemy upload my images?",
        answer: "No. All compression, conversion and resizing happens in your browser via WebAssembly. Your image data is never transmitted, so there is no server-side copy to lose or leak. This is the core design guarantee of the tool.",
      },
      {
        question: "Does ImageAlchemy use cookies?",
        answer: "No advertising or tracking cookies are set. The site loads a privacy-oriented analytics script that records anonymous page-path and performance data, and the hosting platform may set a bot-management cookie as part of serving the page. Your preferences and Pro licence key live in local storage, on your device only.",
      },
      {
        question: "What data does ImageAlchemy collect?",
        answer: "Anonymous performance and navigation data: the page path visited, the referring URL, a user-agent string, a locale-derived country, Core Web Vitals timings, and a random per-visit identifier that is not tied to any account. No images, no file names, no cross-site profiling, and nothing sold to third parties.",
      },
      {
        question: "Can I use ImageAlchemy without being tracked?",
        answer: "Yes. Blocking the analytics script does not affect any feature — the compressor is client-side and needs no network access to work. You can also clear local storage at any time to remove your stored preferences and the pending event queue.",
      },
      {
        question: "Is ImageAlchemy safe for confidential client work?",
        answer: "Yes. Because files are processed locally and never uploaded, the tool is suitable for confidential, medical, legal or client-owned imagery where uploading to a third-party service would be a problem. There is no server in the image path.",
      },
    ],
    related: [
      { path: "/about", label: "About ImageAlchemy" },
      { path: "/learn/image-optimization-guide", label: "Image optimization guide" },
    ],
  },
};
