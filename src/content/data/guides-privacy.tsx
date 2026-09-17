import { type ReactNode } from "react";
import type { ContentEntry } from "../types";

const P = (children: ReactNode) => <p>{children}</p>;

/**
 * "Compress images without uploading" — the site's differentiator as a page.
 *
 * WHY THIS PAGE EXISTS
 * --------------------
 * "Your images never leave your device" is the single strongest thing about
 * this product and it had no page of its own. It was one line in a feature
 * card. Meanwhile there is a real, growing search demand from people who
 * specifically do not want to hand their files to a cloud converter —
 * healthcare, legal, agency, NDA-bound and privacy-conscious users — and that
 * demand is exactly this product's natural audience.
 *
 * A page targeting it does three things at once: it captures high-intent
 * traffic that currently has nowhere to land, it gives answer engines a
 * quotable page about client-side processing, and it reinforces the brand's
 * genuine point of difference instead of competing on "free compressor"
 * against a dozen identical tools.
 *
 * HONESTY NOTE
 * ------------
 * This page must not overstate. Client-side processing is a real architectural
 * property, not a marketing claim, but the site does run anonymous performance
 * analytics — and the page says so and links to the policy. A privacy page
 * that oversells is the defect this site already had once.
 */
export const GUIDE_CONTENT: Record<string, ContentEntry> = {
  "/learn/compress-images-without-uploading": {
    path: "/learn/compress-images-without-uploading",
    h1: "How to compress images without uploading them",
    lede: "Most online image tools upload your files to a server you cannot audit. Here is how client-side compression works, why it is meaningfully different, and how to tell whether a tool is actually processing locally or just saying so.",
    keywords: [
      "compress images without uploading",
      "offline image compression",
      "private image compressor",
      "client side image compression",
      "secure image compression",
      "compress images without internet",
    ],
    sections: [
      {
        id: "why-uploading-is-a-problem",
        heading: "Why uploading is a real problem, not just a preference",
        body: [
          P(<>The default model for online image tools is: you send your file to a server, the server compresses it, and the server sends it back. That is a reasonable architecture for a public logo. It is a poor fit for a great many real situations.</>),
          P(<><strong>Confidentiality.</strong> Client photography under NDA, unreleased product shots, patient or case imagery, financial documents, identity documents, internal screenshots. Once uploaded, those files exist on infrastructure you do not control and cannot audit.</>),
          P(<><strong>Retention you cannot verify.</strong> Many tools state that files are deleted after an hour. You have no way to confirm that, and you have no way to know whether a copy exists in a backup, a log, a cache or a training corpus.</>),
          P(<><strong>Compliance.</strong> If you handle personal or special-category data, uploading it to an arbitrary third-party processor can be a reportable transfer. The simplest way to have no data-processing risk is to have no data processed by anyone else.</>),
          P(<><strong>Bandwidth and size limits.</strong> Uploading a 200-image batch means pushing hundreds of megabytes upstream over a domestic connection — often slower than downloading, and frequently capped by the tool's own file-size limit.</>),
          P(<>None of these are hypothetical objections. They are the reason client-side processing is worth a dedicated page.</>),
        ],
      },
      {
        id: "how-client-side-works",
        heading: "How client-side compression actually works",
        body: [
          P(<>For roughly a decade it was not practical to run real image codecs in a browser. That changed with <strong>WebAssembly</strong>: mature C and C++ codecs can now be compiled to a binary format that runs in the browser at close to native speed.</>),
          P(<>ImageAlchemy ships those codecs as WebAssembly modules — MozJPEG for JPEG, libwebp for WebP, OxiPNG for PNG and the AV1 encoder for AVIF. When you drop a file:</>),
          P(<><strong>1.</strong> The browser reads the file from your disk into memory. No network request is involved.</>),
          P(<><strong>2.</strong> The file is decoded, then re-encoded by the WebAssembly codec running in a Web Worker on your own CPU.</>),
          P(<><strong>3.</strong> You get a new file back as a downloadable object. It never left the machine.</>),
          P(<>The only network traffic involved is the initial page load — the HTML, CSS, JavaScript and the codec binaries themselves. Once loaded, the tool works with your network connection disabled. That is the definitive test of whether processing is genuinely local, and it takes ten seconds to run.</>),
        ],
      },
      {
        id: "how-to-verify",
        heading: "How to verify a tool really is local",
        body: [
          P(<>"Private" and "secure" are used loosely in this category, so it is worth knowing how to check a claim rather than trusting it. Three tests, in increasing order of rigour:</>),
          P(<><strong>Test 1 — disconnect and use it.</strong> Load the tool, then turn off your Wi-Fi and drop an image in. If it compresses, the processing is local. If it spins, errors or hangs, it was uploading. This is definitive and requires no technical knowledge.</>),
          P(<><strong>Test 2 — watch the network tab.</strong> Open developer tools, switch to the Network tab, and compress an image while watching. A local tool shows no request carrying your file — no large POST or PUT. A cloud tool shows an obvious upload of roughly the file's size.</>),
          P(<><strong>Test 3 — check what the page claims it needs.</strong> A tool that advertises file-size limits ("up to 5 MB") or a per-day quota is server-backed, because a client-side tool's only real limits are your device's memory. Genuine local processing has no reason to cap you at 5 MB.</>),
          P(<>One honest caveat about this site: ImageAlchemy does record anonymous performance analytics — page paths and Core Web Vitals — under its privacy policy. It does not receive your images, your file names, or their contents. Those are separate claims and the policy states both precisely.</>),
        ],
      },
      {
        id: "trade-offs",
        heading: "The honest trade-offs of client-side processing",
        body: [
          P(<>Client-side is not free of cost, and a page that pretends otherwise is not worth reading. The real trade-offs:</>),
          P(<><strong>First load is heavier.</strong> The WebAssembly codecs are several hundred kilobytes to a few megabytes, depending on format. Once cached, this is a non-issue; on a very slow first visit, a server-based tool may feel faster to start. ImageAlchemy loads codecs on demand rather than all upfront for exactly this reason.</>),
          P(<><strong>Your CPU does the work.</strong> Encoding is compute-intensive, especially AVIF. A very old or low-powered device will encode more slowly than a server with many cores. In practice this is a difference of seconds on a batch, and batch processing runs across multiple workers.</>),
          P(<><strong>No server-side pipeline features.</strong> A server can do things a browser cannot — crawl your website and find the images, for example. That is precisely why the Pro website audit needs a small proxy to fetch a page's HTML, and why ImageAlchemy is explicit that this one feature makes a network request (described in the privacy policy).</>),
          P(<>Weighed against those, the guarantee that your files are never transmitted is worth a few hundred kilobytes of cached JavaScript.</>),
        ],
      },
      {
        id: "why-it-matters-for-speed",
        heading: "Why this also makes you faster",
        body: [
          P(<>The privacy benefit is the headline, but there is a practical performance benefit that is easy to miss: <strong>local processing is not limited by upload bandwidth.</strong></>),
          P(<>Compressing 200 images on a cloud tool means uploading hundreds of megabytes before the work even begins. On a typical domestic connection with a modest upstream, that upload phase dominates the whole task. Locally, the encode starts immediately and finishes at whatever speed your CPU manages — usually far sooner than the equivalent round trip.</>),
          P(<>There is also no per-file round-trip latency, no queue behind other users, and no session timeout. A batch of 200 images is one continuous local operation rather than 200 network transactions.</>),
        ],
      },
      {
        id: "who-this-is-for",
        heading: "Who this is specifically for",
        body: [
          P(<><strong>Agencies and freelancers.</strong> Client work often arrives under confidentiality terms. Processing it locally means the imagery never becomes a third-party data-processing question at all.</>),
          P(<><strong>Healthcare and legal.</strong> Where uploading imagery to an arbitrary processor would require an assessment, removing the upload removes the assessment.</>),
          P(<><strong>Product teams pre-launch.</strong> Unreleased product photography and design assets are among the most sensitive material a company holds, and among the most likely to be compressed casually.</>),
          P(<><strong>Anyone on a constrained connection.</strong> Where upstream bandwidth or a data cap makes uploading hundreds of megabytes impractical, local processing is straightforwardly faster.</>),
          P(<><strong>Privacy-conscious users generally.</strong> If the file is personal, there is no reason for it to be someone else's log entry.</>),
        ],
      },
      {
        id: "do-it",
        heading: "Doing it now",
        body: [
          P(<>Drop your images onto the ImageAlchemy tool at the top of this page — or use <strong>Auto-Pick</strong>, which encodes each image in several formats and keeps the smallest result. Choose a format and quality (75–85 is the range that works for almost everything), process the batch, and download individually or as a single ZIP.</>),
          P(<>If you want to confirm the claim rather than take our word for it, load the page, disable your network connection, and compress something. If it works — and it will — nothing was uploaded.</>),
        ],
      },
    ],
    faqs: [
      {
        question: "Can I compress images without uploading them?",
        answer: "Yes. ImageAlchemy runs professional image codecs (MozJPEG, libwebp, OxiPNG and AV1) as WebAssembly modules inside your browser, so decoding and re-encoding happen on your own device. Your image data is never transmitted to a server. The only network traffic is the initial page load.",
      },
      {
        question: "How can I tell if an image compressor is uploading my files?",
        answer: "Three tests. Load the tool, then disable your internet connection and try to compress an image — local tools keep working, cloud tools fail. Alternatively open your browser's Network tab and watch for a large upload request carrying your file. As a rule of thumb, any tool advertising a small file-size limit or a daily quota is server-backed.",
      },
      {
        question: "Is client-side image compression as good as server-based?",
        answer: "Yes, when the same codecs are used. ImageAlchemy runs MozJPEG, libwebp, OxiPNG and the AV1 encoder — the same libraries professional server pipelines use — compiled to WebAssembly. Output quality is equivalent. The genuine trade-offs are a heavier first page load and using your own CPU rather than a server's.",
      },
      {
        question: "Do I need an internet connection to compress images with ImageAlchemy?",
        answer: "Not after the page has loaded once. The codecs are cached, and processing is entirely local. You can disconnect your network and compress, convert or resize images normally. This is also the simplest way to verify the privacy claim for yourself.",
      },
      {
        question: "Is it safe to compress confidential or client images online?",
        answer: "It is safe when the tool processes locally. With ImageAlchemy there is no upload step, so confidential imagery never exists on third-party infrastructure — which avoids the retention, breach and data-transfer questions that uploading creates. If a tool cannot be used with your connection disabled, it is not a safe choice for confidential material.",
      },
      {
        question: "Why is compressing locally faster than using a cloud tool?",
        answer: "Because it is not limited by upload bandwidth. A cloud tool has to receive hundreds of megabytes before it can begin, which on a typical domestic connection is the slowest part of the whole task. Local processing starts immediately, has no round-trip latency per file, and does not queue behind other users.",
      },
    ],
    related: [
      { path: "/learn/image-optimization-guide", label: "Image optimization: the complete guide" },
      { path: "/privacy", label: "Privacy policy — what we do and do not collect" },
      { path: "/learn/best-free-image-compression-tools", label: "Best free image compression tools compared" },
      { path: "/tools/image-converter", label: "Free image converter" },
      { path: "/about", label: "About ImageAlchemy" },
    ],
  },
};
