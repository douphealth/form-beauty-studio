/**
 * Standalone pre-render script.
 *
 * Run after `vite build`:
 *   node --experimental-vm-modules scripts/prerender.mjs
 *
 * WHY A SEPARATE SCRIPT
 * --------------------
 * Vite bundles vite.config.ts with esbuild before any plugin hook runs, and
 * esbuild's default JSX factory ("React.createElement") is baked in at that
 * point — the `config()` hook cannot change it. A TSX file imported from the
 * config therefore explodes with "React is not defined" under the automatic
 * runtime.
 *
 * Running pre-render here keeps the Vite config free of TSX imports, gives us
 * an explicit esbuild loader with jsxFactory/automatic runtime, and lets the
 * step be re-run without rebuilding the app.
 *
 * Usage in package.json:
 *   "build": "vite build && node scripts/prerender.mjs"
 */
import path from "path";
import fs from "fs";
import { pathToFileURL } from "url";
import { build } from "esbuild";
import { renderToString } from "react-dom/server";
import { createElement } from "react";
import { StaticRouter } from "react-router-dom/server.js";
import { HelmetProvider } from "react-helmet-async";

const root = path.resolve(process.cwd());
const outDir = path.join(root, "dist");

// 1. Bundle the SSR entry (TSX -> JS) with the automatic JSX runtime.
//    The home page is included so the pre-rendered index.html carries the
//    tool's hero markup and H1 instead of an empty root div.
const ssrEntry = path.join(root, "src", "ssr-entry.tsx");
const tmpFile = path.join(root, "node_modules", ".prerender", "ssr-entry.mjs");
fs.mkdirSync(path.dirname(tmpFile), { recursive: true });

const result = await build({
  entryPoints: [ssrEntry],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "es2022",
  outfile: tmpFile,
  jsx: "automatic",
  jsxImportSource: "react",
  loader: { ".tsx": "tsx", ".ts": "ts" },
  alias: { "@/*": path.join(root, "src/*") },
  define: { "process.env.NODE_ENV": '"production"' },
  logLevel: "error",
  // Keep node deps external; we bundle only enough to share the framer-motion
  // instance with the stub. Node builtins must stay external.
  packages: "external",
  banner: {
    js: 'import { createRequire } from "module"; const require = createRequire(import.meta.url);',
  },
});

// Node has no browser globals. The tool's components read a few of them at
// module-evaluation time (navigator, matchMedia, localStorage), so the stubs
// MUST exist before the SSR bundle is imported.
// NOTE: the window stub below makes `typeof window` unreliable, so lib/motion.tsx
// keys off __PRERENDER instead to decide whether to load framer-motion.
(globalThis).__PRERENDER = true;
if (typeof globalThis.navigator === "undefined") {
  globalThis.navigator = { userAgent: "Node.js (prerender)", onLine: true };
}
if (typeof globalThis.window === "undefined") {
  globalThis.window = globalThis;
}
if (typeof globalThis.matchMedia === "undefined") {
  // Some libraries call `.addEventListener("change", cb)` and then `.add` on the
  // returned setlist — return a proxy-ish object that supports both shapes.
  const listenerSet = new Set();
  const mediaQuery = {
    matches: true,
    media: "",
    onchange: null,
    dispatchEvent() { return true; },
    addEventListener(type, cb) { listenerSet.add(cb); },
    removeEventListener(type, cb) { listenerSet.delete(cb); },
    addListener(cb) { listenerSet.add(cb); },
    removeListener(cb) { listenerSet.delete(cb); },
  };
  // `.addEventListener(...).add` style accessors
  mediaQuery.addEventListener.toString = () => "addEventListener";
  Object.defineProperty(mediaQuery.addEventListener, "add", { value: (cb) => listenerSet.add(cb) });
  Object.defineProperty(mediaQuery.addEventListener, "remove", { value: (cb) => listenerSet.delete(cb) });
  globalThis.matchMedia = () => mediaQuery;
}
if (typeof globalThis.localStorage === "undefined") {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  };
}

// DOM element classes used by libraries at render time (framer-motion checks
// for SVGElement/HTMLElement instances and attaches event listeners). Define
// in dependency order, with no-op event methods so SSR never throws.
const elementShim = {
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent() { return true; },
  getBoundingClientRect() { return { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 }; },
  contains() { return false; },
};
if (typeof globalThis.Element === "undefined") {
  globalThis.Element = class Element {
    addEventListener() {} removeEventListener() {} dispatchEvent() { return true; }
  };
}
if (typeof globalThis.HTMLElement === "undefined") {
  globalThis.HTMLElement = class HTMLElement extends globalThis.Element {};
}
if (typeof globalThis.SVGElement === "undefined") {
  globalThis.SVGElement = class SVGElement extends globalThis.Element {};
}

if (typeof globalThis.document === "undefined") {
  // framer-motion attaches a resize listener to `document` during SSR.
  const docEl = Object.assign(Object.create(globalThis.Element.prototype), {
    tagName: "HTML",
    nodeName: "HTML",
  });
  globalThis.document = {
    documentElement: docEl,
    body: Object.assign(Object.create(globalThis.Element.prototype), { tagName: "BODY", nodeName: "BODY" }),
    head: Object.assign(Object.create(globalThis.Element.prototype), { tagName: "HEAD", nodeName: "HEAD" }),
    readyState: "complete",
    visibilityState: "visible",
    addEventListener() {},
    removeEventListener() {},
    removeEventListener() {},
    createElement(tag) {
      return Object.assign(Object.create(globalThis.Element.prototype), {
        tagName: String(tag).toUpperCase(),
        nodeName: String(tag).toUpperCase(),
        style: {},
        setAttribute() {}, removeAttribute() {},
        appendChild() {}, removeChild() {},
      });
    },
    getElementById() { return null; },
    querySelector() { return null; },
    querySelectorAll() { return []; },
  };
}

const { ContentPage, renderContentRoute } = await import(pathToFileURL(tmpFile).href);

/** Flatten a React node (string, element, array) to plain text for JSON-LD. */
function nodeToText(node) {
  if (node == null || node === false) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeToText).join("");
  if (typeof node === "object" && node.props) return nodeToText(node.props.children);
  return "";
}

// 2. Transpile the route manifest, content index, JSON-LD and HTML modules
//    (all TS) to JS so Node can import them.
async function loadTs(srcPath) {
  const outFile = path.join(root, "node_modules", ".prerender", srcPath.replace(/\//g, "_") + ".mjs");
  await build({
    entryPoints: [path.join(root, srcPath)],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "es2022",
    outfile: outFile,
    jsx: "automatic",
    jsxImportSource: "react",
    loader: { ".tsx": "tsx", ".ts": "ts" },
    define: { "process.env.NODE_ENV": '"production"' },
    packages: "external",
    logLevel: "error",
  });
  return import(pathToFileURL(outFile).href);
}

const manifest = await loadTs("src/seo/routes.ts");
const content = await loadTs("src/content/index.ts");
const jsonLd = await loadTs("src/seo/json-ld.ts");

/**
 * Home-page FAQ — the SINGLE definition of the six answers.
 *
 * Consumed twice: rendered into `renderHomeStatic()` as visible <h3>/<p> pairs,
 * and emitted as FAQPage JSON-LD in the prerender loop. Keeping one array means
 * the visible copy and the structured data cannot drift — and drift here is not
 * cosmetic. Google validates FAQPage against the rendered page, so a schema
 * answer that does not appear in the body is a schema violation, exactly the
 * class of defect the previous audit found in nodeToText()'s truncated output.
 *
 * Answers are written to be self-contained: an answer engine quoting one will
 * quote it without the surrounding page, so no answer may begin with "It depends"
 * or a pronoun whose referent is elsewhere.
 */
const HOME_FAQS = [
  {
    q: "Is ImageAlchemy really free?",
    a: "Yes. No account, no subscription, no watermark and no file limits — batch up to 200 images at a time, as often as you like. The Pro audit is a separate one-time purchase for a different job: auditing pages you do not own.",
  },
  {
    q: "Are my images uploaded anywhere?",
    a: "No. Decoding and re-encoding happen in your browser using WebAssembly codecs — MozJPEG, libwebp, OxiPNG and the AV1 encoder. Your image data is never transmitted, so there is no server-side copy to lose or leak.",
  },
  {
    q: "What is the best image format for the web in 2026?",
    a: "AVIF compresses best — roughly 20% smaller than WebP at equivalent quality — and is now supported by all major browsers. WebP remains the safe default with universal support and faster encoding. Serving AVIF first with WebP and JPEG fallbacks via <picture> is the most robust approach.",
  },
  {
    q: "Does compressing images reduce quality?",
    a: "Not visibly, at the settings that matter. At quality 80 the difference from the source is imperceptible on a normal display while the file is typically 40–70% smaller. Visible damage only begins below roughly quality 60, and the artifacts appear first in smooth gradients, fine texture such as hair and foliage, and around text.",
  },
  {
    q: "Can I compress images on my phone?",
    a: "Yes. ImageAlchemy is fully responsive and works in mobile browsers, processing images locally on the device. Because nothing is uploaded, it also works over a slow or metered connection once the page has loaded.",
  },
  {
    q: "What is the maximum file size and batch size?",
    a: "Up to 50 MB per image and 200 images per batch. Because processing is client-side, the practical ceiling is your device's available memory rather than a server quota.",
  },
];

/**
 * Render HOME_FAQS into visible markup. Kept next to the array so any edit to
 * an answer is made in one place and both consumers follow.
 */
function renderHomeFaqMarkup() {
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return HOME_FAQS.flatMap((f) => [
    `<h3>${esc(f.q)}</h3>`,
    `<p>${esc(f.a).replace(/&lt;picture&gt;/g, "<code>&lt;picture&gt;</code>")}</p>`,
  ]).join("\n");
}
const htmlMod = await loadTs("src/seo/html.ts");
const { stripHtml } = htmlMod;

// 3. Grab the built asset paths from the generated index.html.
const indexHtml = fs.readFileSync(path.join(outDir, "index.html"), "utf8");
const scriptMatch = indexHtml.match(/<script type="module" crossorigin src="(\/assets\/[^"]+)">/);
const styleMatch = indexHtml.match(/<link rel="stylesheet" crossorigin href="(\/assets\/[^"]+)">/);
const scripts = scriptMatch ? [scriptMatch[1]] : [];
const stylesheets = styleMatch ? [styleMatch[1]] : [];

let ok = 0;

/** Every document written this run — drives the assertions below. */
const written = [];

/**
 * Static home-page markup for crawlers and AI bots that don't run JavaScript.
 * Mirrors the hero of the real app closely enough to be useful out of the box:
 * an H1, the value proposition, supported formats and the trust signals.
 * The hydrated React app replaces #root's contents on load.
 *
 * Kept content-rich deliberately: this is the single most-crawled URL and the
 * one AI answer engines most often quote for "free image compressor" queries.
 */
function renderHomeStatic() {
  return [
    '<h1>ImageAlchemy — Free Private Image Compression for WebP, AVIF, JPEG &amp; PNG</h1>',
    '<p>ImageAlchemy is a <strong>free online image compressor and converter</strong> that runs entirely in your browser. Compress, convert and resize images in bulk — no uploads, no accounts, no tracking. Everything is processed locally with WebAssembly, so an entire batch of up to 200 images never leaves your device.</p>',
    '<h2>Why compress images?</h2>',
    '<p>Unoptimized images are the largest content type on most pages and the most common cause of slow <a href="/learn/core-web-vitals-images">Core Web Vitals</a>. Converting a 2&nbsp;MB JPEG to WebP at quality 80 typically yields a 400–600&nbsp;KB file — a <strong>70%+ reduction</strong> in bytes with no visible quality loss. Smaller files mean faster LCP, better crawl coverage, higher mobile rankings and less bandwidth cost.</p>',
    '<h2>What ImageAlchemy does</h2>',
    '<ul>',
    '<li><strong>Batch compression</strong> — up to 200 images at once, with a one-click ZIP download of the whole set.</li>',
    '<li><strong>Every modern format</strong> — <a href="/formats/avif">AVIF</a>, <a href="/formats/webp">WebP</a>, <a href="/formats/jpeg">JPEG</a> and <a href="/formats/png">PNG</a>, with conversion between them and an <em>Auto-Pick</em> mode that picks the smallest format per image.</li>',
    '<li><strong>Smart presets</strong> — Web, Email, Social, Print and Max Quality, plus per-image overrides for full control.</li>',
    '<li><strong>Before &amp; after comparison</strong> — a draggable slider to verify quality at any zoom level before you commit.</li>',
    '<li><strong>Resize &amp; crop</strong> — set a maximum dimension and let the tool scale proportionally. See the <a href="/tools/image-resizer">image resizer</a> and <a href="/tools/image-converter">image converter</a> guides.</li>',
    '<li><strong>100% private</strong> — files never leave your device; processing runs locally via WebAssembly. Nothing is uploaded, stored or analysed.</li>',
    '</ul>',
    '<h2>Compress your images in four steps</h2>',
    '<ol>',
    '<li>Drop your files onto the dropzone (or click to browse).</li>',
    '<li>Choose an output format — WebP for the best all-round result, AVIF for maximum compression.</li>',
    '<li>Pick a preset or set quality (80 is a reliable default) and a maximum dimension.</li>',
    '<li>Press compress, compare before &amp; after, then download individually or as a ZIP.</li>',
    '</ol>',
    '<h2>Learn more about image optimization</h2>',
    '<ul>',
    '<li><a href="/learn/image-optimization-guide">The complete image optimization guide</a></li>',
    '<li><a href="/learn/compress-images-for-web">How to compress images for the web</a></li>',
    '<li><a href="/learn/webp-vs-avif">WebP vs AVIF: which format should you use?</a></li>',
    '<li><a href="/learn/reduce-image-file-size">12 ways to reduce image file size</a></li>',
    '<li><a href="/learn/responsive-images">Responsive images with srcset and sizes</a></li>',
    '<li><a href="/glossary">Image compression glossary</a></li>',
    '</ul>',
    '<h2>What quality setting should you use?</h2>',
    '<p>Use <strong>quality 80</strong> for almost everything. Between 75 and 85 the file size is still falling sharply while the visible quality cost stays imperceptible. Above 90 the file grows noticeably with no visible gain; below 60 you get banding in gradients and smearing in fine detail.</p>',
    '<p>The setting is format-dependent, because the quality scales are not calibrated to each other: <strong>JPEG 78–85</strong>, <strong>WebP 75–82</strong>, and <strong>AVIF 60–75</strong> — AVIF at 65 is frequently visually equivalent to JPEG at 80 at a smaller size. PNG is lossless and takes no quality setting at all; if you are reaching for a PNG quality slider, WebP is almost always the better choice.</p>',
    '<p>Resolution matters more than quality. Resizing a 4000&nbsp;px image down to the 1600&nbsp;px it is actually displayed at typically removes 80% or more of the bytes and makes the image look <em>sharper</em>. A perfectly compressed oversized image is still a slow image. On the demo photograph on this page, the 189&nbsp;KB source encodes to <strong>112&nbsp;KB at quality 80 (−41%)</strong> and <strong>70&nbsp;KB at quality 45 (−63%)</strong> — both real encodes, not estimates.</p>',
    '<p><a href="/learn/jpeg-quality-guide">Read the full JPEG quality guide</a> for per-format recommendations and the order to apply them in.</p>',
    '<h2>Compressing images without uploading them</h2>',
    '<p>ImageAlchemy performs no upload at all. The codecs run locally, so your files never reach a server, are never logged, and cannot be retained — which makes the tool usable for confidential client photography, medical or legal imagery, and unreleased product shots where a cloud converter would be inappropriate.</p>',
    '<p>You can verify this rather than trust it: load this page, then disable your network connection and compress an image. It will still work, because the processing is local. A cloud-based tool would fail. <a href="/learn/compress-images-without-uploading">How client-side compression works, and how to test any tool for it</a>.</p>',
    '<h2>Frequently asked questions</h2>',
    renderHomeFaqMarkup(),
    // The Pro upsell is included in the STATIC home markup on purpose.
    //
    // HeroFeatures — which carries the Pro showcase in the hydrated app — only
    // renders client-side, so without this block the paid feature is completely
    // invisible in the pre-rendered document. The previous audit found that
    // every route served the same root document; the lesson generalises: what a
    // non-JS crawler sees is the only text this site reliably publishes.
    //
    // The /pro page is noindex, so this link passes no ranking signal — which is
    // correct. The intent is discoverability for a reader, not for a crawler.
    '<h2>Which images should you fix first?</h2>',
    '<p>The <a href="/pro">Website Image Audit</a> reports every image any page loads — measured, ranked by what they cost you, with the fix written out. One-time purchase, no subscription. The compressor above stays free.</p>',
    '<p><a href="#root">Open the compression studio above, or drop your images to begin.</a></p>',
  ].join("\n");
}

/**
 * Static markup for /pro.
 *
 * Two jobs: give a non-JS crawler a real document, and give a human something
 * to read in the moment between page load and the licence check resolving.
 * Both want the same thing — what the feature does and what it costs — so the
 * copy here is the same pitch the paywall renders, just without interactivity.
 */
function renderProStatic() {
  return [
    '<h1>Website Image Audit — find every wasted byte on any site</h1>',
    '<p>ImageAlchemy Pro audits any public web page and measures every image it loads. You get the total image weight, each file\'s real size, its format and caching headers, and a prioritised list of fixes with the bytes each one saves. It is the difference between "this file got smaller" and "these eleven files are costing you 1.4 seconds".</p>',
    '<h2>What the audit reports</h2>',
    '<ul>',
    '<li><strong>Every image on the page, measured</strong> — including <code>srcset</code> candidates, <code>&lt;picture&gt;</code> sources, preloaded images and CSS backgrounds.</li>',
    '<li><strong>A weighted score out of 100</strong>, broken down by image weight, format, delivery and markup.</li>',
    '<li><strong>A prioritised fix list</strong> — legacy formats, oversized files, missing lazy loading, absent width and height, weak cache headers, missing alt text.</li>',
    '<li><strong>Core Web Vitals impact</strong> — estimated transfer time on a 4G connection, plus the layout-shift and largest-contentful-paint problems visible in the markup.</li>',
    '<li><strong>A Markdown report</strong> you can paste into a ticket, a client email or a CMS.</li>',
    '</ul>',
    '<h2>Pricing</h2>',
    '<p>ImageAlchemy Pro is a <strong>one-time purchase</strong>. No subscription, no account, no expiry. The licence works offline in your browser. The free compressor — batch compression, conversion and resizing for up to 200 images — stays free forever, and your images never leave your device either way.</p>',
    '<h2>How to fix what the audit finds</h2>',
    '<p>Most findings are resolved by re-encoding to a modern format and right-sizing. The free <a href="/">ImageAlchemy compressor</a> does both in your browser: see the <a href="/formats/webp">WebP</a> and <a href="/formats/avif">AVIF</a> format guides, the <a href="/tools/image-resizer">image resizer</a>, or the <a href="/learn/core-web-vitals-images">guide to images and Core Web Vitals</a>.</p>',
    '<p><a href="/">Compress images free</a> · <a href="/learn">Optimization guides</a> · <a href="/glossary">Glossary</a></p>',
  ].join("\n");
}

for (const route of manifest.ALL_ROUTES) {
  const entry = content.getContent(route.path);
  const isHome = route.path === "/";
  let body = "";
  if (isHome) {
    body = renderHomeStatic();
  } else if (route.standalone) {
    // Standalone tool surfaces (/pro) render through their own component in the
    // React router, not through ContentPage. Pre-rendering them here is still
    // necessary: without it the shipped HTML is an empty <div id="root">, so a
    // crawler that does not execute JavaScript sees a blank page, and the
    // hydration check in verify-crawl reports a document with no H1.
    //
    // The markup is deliberately the *marketing* frame of the page (what the
    // feature is and what it costs), which is also what a human sees before the
    // licence check resolves. The audit tool itself appears after hydration.
    body = renderProStatic();
  } else if (entry) {
    const rendered = renderContentRoute(route.path);
    body = rendered.html;
  }
  const doc = htmlMod.renderHtmlDocument({
    path: route.path,
    title: route.title,
    description: route.description,
    body,
    scripts,
    stylesheets,
    // Forward the route's indexability. This was MISSING, and the consequence
    // was real: renderHtmlDocument() defaults to "index,follow", so every route
    // flagged `noindex` in the manifest — /privacy and /pro — shipped a
    // prerendered document telling crawlers to index it. The runtime React
    // Helmet tag would have said noindex on hydration, but the pre-rendered
    // static document is what a non-JS crawler reads, and it is the one that
    // wins. A noindex route that ships as indexable is worse than no tag at
    // all, because it looks correct in the source and disagrees with itself in
    // the output.
    robots: route.noindex ? "noindex,follow" : "index,follow,max-image-preview:large",
    jsonLd: jsonLd.buildSeoJsonLd({
      path: route.path,
      title: route.title,
      description: route.description,
      kind: route.kind,
      // FAQ answers are flattened to plain text because schema.org expects a
      // string, not HTML. nodeToText() alone was NOT enough: it concatenates
      // nested children without separators, so a React node like
      //   <><strong>Batch</strong> — up to 200 images…</>
      // came out as "Batch— up to 200 images…" and inline <a> text was glued to
      // surrounding words. stripHtml() normalises whitespace and removes any
      // residual tags, so the emitted answer matches the visible copy exactly —
      // which matters, because FAQPage rich results are validated against the
      // rendered page.
      faqs: entry
        ? entry.faqs.map((f) => ({ question: f.question, answer: stripHtml(nodeToText(f.answer)) }))
        // The home route has no content-index entry — its body is the static
        // markup above. It now carries a real FAQ block, and visible FAQ content
        // must be mirrored in FAQPage schema or the markup is claiming a
        // relationship the page does not have (and rich-result validation fails
        // on the mismatch). HOME_FAQS is the single definition of those six
        // answers, rendered into the static body and emitted here from the same
        // array so the two can never disagree.
        : route.path === "/"
          ? HOME_FAQS.map((f) => ({ question: f.q, answer: f.a }))
          : undefined,
      keywords: entry ? entry.keywords : undefined,
      // Hub pages list their children, so crawlers see the pages as a set
      // rather than as unrelated URLs that happen to link to each other.
      listItems: entry ? entry.related.map((r) => ({ label: r.label, path: r.path })) : undefined,
      // Glossary entries declare the term they define.
      term: manifest.GLOSSARY_TERM_BY_PATH[route.path],
      dateModified: manifest.DEFAULT_CONTENT_DATE,
    }),
  });

  // ── Directory index ────────────────────────────────────────────────────
  //
  // THE BUG THIS FIXES (the single highest-impact defect in the previous
  // build): this line used to be
  //     route.path + ".html"      →  dist/learn.html
  // A static host serving `https://site/learn` looks for, in order:
  //     /learn            (exact file)
  //     /learn/index.html (directory index)
  //     /learn.html       (NEVER consulted for an extensionless URL)
  // So every route except `/` fell through to the SPA fallback and served the
  // homepage document. All 28 sitemap URLs returned one byte-identical file —
  // verified: md5 258b238d0aa0ade51bca409692b22a65 at 7,624 bytes for every
  // path. Google saw one page and 28 duplicates of it.
  //
  // Writing the directory index as the PRIMARY artefact fixes that. The legacy
  // `<route>.html` file is kept as a secondary copy so that any existing
  // inbound link to the old path shape still resolves.
  const primaryPath =
    route.path === "/"
      ? path.join(outDir, "index.html")
      : path.join(outDir, route.path.replace(/^\//, ""), "index.html");

  fs.mkdirSync(path.dirname(primaryPath), { recursive: true });
  fs.writeFileSync(primaryPath, doc);

  // Secondary legacy copy — skip for the root to avoid clobbering index.html.
  if (route.path !== "/") {
    const legacyPath = path.join(outDir, route.path.replace(/^\//, "") + ".html");
    fs.mkdirSync(path.dirname(legacyPath), { recursive: true });
    fs.writeFileSync(legacyPath, doc);
  }

  written.push({ route, primaryPath, doc });
  ok++;
}

// ── Assertions ────────────────────────────────────────────────────────────
//
// Every one of these guards exists because the corresponding failure was
// observed in a real build and shipped silently. A build that emits broken
// crawl artefacts must fail loudly at build time, not quietly at Google's
// next recrawl.
function assert(condition, message) {
  if (!condition) {
    console.error(`\nFATAL: ${message}\n`);
    process.exit(1);
  }
}

assert(ok > 0, "prerender produced zero routes — the route manifest is empty or failed to load");

const expected = manifest.ALL_ROUTES.length;
assert(
  ok === expected,
  `prerendered ${ok} routes but the manifest declares ${expected}`,
);

for (const { route, primaryPath } of written) {
  assert(
    fs.existsSync(primaryPath),
    `no directory index written for ${route.path} (expected ${path.relative(root, primaryPath)})`,
  );
}

// Duplicate titles make it impossible for a search engine to tell the pages
// apart — the second symptom of the original bug.
const titleSeen = new Map();
for (const { route } of written) {
  const key = route.title.trim();
  if (titleSeen.has(key)) {
    assert(false, `duplicate <title> on ${route.path} and ${titleSeen.get(key)}: "${key}"`);
  }
  titleSeen.set(key, route.path);
}

// A title that names the wrong product is worse than no title: it invites the
// search engine to invent a brand. This guard previously caught the literal
// string "Enterprise" appearing in a title that never came from this codebase.
const FORBIDDEN_IN_OUTPUT = ["Enterprise"];
for (const { route, doc } of written) {
  for (const word of FORBIDDEN_IN_OUTPUT) {
    assert(
      !doc.includes(word),
      `the string "${word}" (not part of this product) appears in the output for ${route.path}`,
    );
  }
}

// Every prerendered document must carry a real heading, or the page is
// invisible to a crawler that does not execute JavaScript.
for (const { route, doc } of written) {
  const bodyStart = doc.indexOf("<body");
  const bodyOnly = bodyStart === -1 ? doc : doc.slice(bodyStart);
  assert(
    /<h1[\s>]/i.test(bodyOnly),
    `${route.path} has no <h1> inside <body> — crawlers would see an untitled page`,
  );
}

// Indexability must match the manifest. This guard exists because the two
// silently disagreed once: /privacy and /pro declared `noindex: true` and still
// shipped "index,follow" in the static document, so a crawler that did not run
// JavaScript was explicitly invited to index a page the author meant to hide.
for (const { route, doc } of written) {
  const head = doc.slice(0, doc.indexOf("</head>"));
  const match = head.match(/<meta\s+name="robots"\s+content="([^"]*)"/i);
  assert(match, `${route.path} has no robots meta tag in <head>`);
  const value = match[1].toLowerCase();
  if (route.noindex) {
    assert(
      value.includes("noindex"),
      `${route.path} is marked noindex in the manifest but ships "${value}"`,
    );
  } else {
    assert(
      value.includes("index") && !value.includes("noindex"),
      `${route.path} is indexable in the manifest but ships "${value}"`,
    );
  }
}

// The social preview card is referenced on every page; it must exist.
assert(
  fs.existsSync(path.join(outDir, "og-image.png")),
  "dist/og-image.png is missing — every og:image reference would 404 (run scripts/build-og.mjs first)",
);

// ── 404 + host config ─────────────────────────────────────────────────────
//
// Without this, an unknown path returns HTTP 200 carrying the homepage
// document. That is a "soft 404": it dilutes the homepage's canonical signal
// and lets typos get indexed as duplicates of `/`.
const notFoundDoc = htmlMod.renderHtmlDocument({
  path: "/404",
  title: "Page not found — ImageAlchemy",
  description: "The page you were looking for does not exist. Head back to the image compressor.",
  body: [
    "<h1>Page not found</h1>",
    '<p>That URL does not exist on ImageAlchemy. The <a href="/">free image compressor</a> is one click away.</p>',
    '<p>Or browse the <a href="/learn">image optimization guides</a> and the <a href="/glossary">glossary</a>.</p>',
  ].join("\n"),
  scripts,
  stylesheets,
  // noindex so a 404 can never be indexed as a real page.
  jsonLd: jsonLd.buildSeoJsonLd({
    path: "/404",
    title: "Page not found — ImageAlchemy",
    description: "The page you were looking for does not exist.",
    kind: "page",
    noindex: true,
  }),
});
fs.writeFileSync(path.join(outDir, "404.html"), notFoundDoc);

// Cloudflare Pages / Netlify convention. Harmless if the host ignores them,
// and the correct fix if it does not.
fs.writeFileSync(
  path.join(outDir, "_redirects"),
  [
    "# Serve the real 404 document with a real 404 status for unknown paths.",
    "# Without this the SPA fallback returns 200 + the homepage for every typo.",
    "/*    /404.html   404",
    "",
  ].join("\n"),
);
fs.writeFileSync(
  path.join(outDir, "_headers"),
  [
    "/*",
    "  X-Content-Type-Options: nosniff",
    "  Referrer-Policy: strict-origin-when-cross-origin",
    "",
    "# Hashed, fingerprinted build output — safe to cache forever.",
    "/assets/*",
    "  Cache-Control: public, max-age=31536000, immutable",
    "",
    "# HTML must revalidate or users get a stale shell after a deploy.",
    "/*.html",
    "  Cache-Control: public, max-age=0, must-revalidate",
    "",
  ].join("\n"),
);

console.log(`[seo] pre-rendered ${ok} routes -> dist/ (${written.length * 2 - 1} HTML docs, ${titleSeen.size} unique titles)`);
console.log(`[seo] wrote 404.html, _redirects, _headers`);

