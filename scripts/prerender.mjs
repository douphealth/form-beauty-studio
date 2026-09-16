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
const htmlMod = await loadTs("src/seo/html.ts");

// 3. Grab the built asset paths from the generated index.html.
const indexHtml = fs.readFileSync(path.join(outDir, "index.html"), "utf8");
const scriptMatch = indexHtml.match(/<script type="module" crossorigin src="(\/assets\/[^"]+)">/);
const styleMatch = indexHtml.match(/<link rel="stylesheet" crossorigin href="(\/assets\/[^"]+)">/);
const scripts = scriptMatch ? [scriptMatch[1]] : [];
const stylesheets = styleMatch ? [styleMatch[1]] : [];

let ok = 0;

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
    '<h1>ImageForge — Free Private Image Compression for WebP, AVIF, JPEG &amp; PNG</h1>',
    '<p>ImageForge is a <strong>free online image compressor and converter</strong> that runs entirely in your browser. Compress, convert and resize images in bulk — no uploads, no accounts, no tracking. Everything is processed locally with WebAssembly, so an entire batch of up to 200 images never leaves your device.</p>',
    '<h2>Why compress images?</h2>',
    '<p>Unoptimized images are the largest content type on most pages and the most common cause of slow <a href="/learn/core-web-vitals-images">Core Web Vitals</a>. Converting a 2&nbsp;MB JPEG to WebP at quality 80 typically yields a 400–600&nbsp;KB file — a <strong>70%+ reduction</strong> in bytes with no visible quality loss. Smaller files mean faster LCP, better crawl coverage, higher mobile rankings and less bandwidth cost.</p>',
    '<h2>What ImageForge does</h2>',
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
    '<p><a href="#root">Open the compression studio above, or drop your images to begin.</a></p>',
  ].join("\n");
}

for (const route of manifest.ALL_ROUTES) {
  const entry = content.getContent(route.path);
  const isHome = route.path === "/";
  let body = "";
  if (isHome) {
    body = renderHomeStatic();
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
    jsonLd: jsonLd.buildSeoJsonLd({
      path: route.path,
      title: route.title,
      description: route.description,
      kind: route.kind,
      // Flatten React nodes to plain text so FAQPage schema is valid and
      // self-contained for rich results.
      faqs: entry ? entry.faqs.map((f) => ({ question: f.question, answer: nodeToText(f.answer) })) : undefined,
      keywords: entry ? entry.keywords : undefined,
    }),
  });
  const filePath = path.join(outDir, route.path === "/" ? "index.html" : route.path + ".html");
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, doc);
  ok++;
}

console.log(`[seo] pre-rendered ${ok} routes -> dist/`);
