/**
 * Website Image Audit — the analysis engine.
 *
 * WHAT THIS IS
 * ------------
 * You give it a URL. It fetches the page's HTML, finds every image the page
 * actually references, measures each one over the network, and reports exactly
 * how many bytes a visitor on a slow connection is being asked to download —
 * plus what those bytes cost in time, data and Core Web Vitals.
 *
 * WHY THIS IS WORTH PAYING FOR
 * ----------------------------
 * The compression tool tells you "this file got smaller". This tells you
 * "your homepage ships 4.1 MB of images; 2.3 MB of it is avoidable; here are
 * the eleven files responsible; fixing them saves 1.4 s of LCP on 4G."
 * That is a *different question* — the one a site owner actually has — and no
 * free browser tool answers it, because answering it requires reading someone
 * else's page, which a browser cannot do from the client (see the note on the
 * proxy below).
 *
 * ARCHITECTURE
 * ------------
 *   fetchHtml(url)  ──►  parseHtml(html, baseUrl)  ──►  AuditImage[]
 *                                                        │
 *                                     measure() ─────────┘   (HEAD/GET per image)
 *                                                        │
 *                                                score(results, images)
 *
 * `parseHtml` is a pure function over a string: no DOM, no network, no
 * globals. That is deliberate — it makes the entire parsing layer unit-
 * testable in Node without jsdom, which is why `scripts/test-audit.mjs` can
 * assert against real, captured HTML from live sites.
 *
 * The fetch step is the ONLY part that needs a server, because of CORS:
 * `fetch("https://example.com")` from `imagealchemy.app` is blocked from
 * reading the response body unless example.com opts in. One thin Worker
 * (workers/audit-proxy) does the fetch and returns the HTML. Everything else —
 * parsing, measuring, scoring, rendering the report — runs in the visitor's
 * browser, so the proxy sees only a URL and never any user data.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type AuditSeverity = "critical" | "warning" | "good" | "info";

/** One `<img>` (or `<source>`/CSS background) found on the page. */
export interface AuditImage {
  /** Absolute URL as it will actually be requested. */
  url: string;
  /** The raw attribute value, so we can show the user what the markup said. */
  rawSrc: string;
  /** Decoded from `srcset` when present — the largest candidate is what matters for weight. */
  fromSrcset: boolean;
  /** `loading` attribute, lower-cased. Absent means eager. */
  loading: string | null;
  /** `decoding` attribute. */
  decoding: string | null;
  /** Rendered width in CSS px, if the markup declares one. */
  width: number | null;
  /** Rendered height in CSS px, if the markup declares one. */
  height: number | null;
  /** `alt` text, so the report can name images meaningfully. */
  alt: string;
  /** True when the image was found in inline CSS or a <style> block. */
  fromCss: boolean;
  /** True when this is the LCP candidate (first large eager image above the fold). */
  aboveFold: boolean;
}

/** Network measurements for one image. Null fields mean the request failed. */
export interface AuditMeasurement {
  url: string;
  ok: boolean;
  status: number;
  /** Content-Length in bytes. Null when the server did not send one. */
  bytes: number | null;
  /** Content-Type header. */
  contentType: string | null;
  /** Cache-Control header, verbatim. */
  cacheControl: string | null;
  /** Whether the response was served from a modern format already. */
  modern: boolean;
  /** True when the host ignored a request for WebP/AVIF. */
  formatNote: string | null;
  /** Milliseconds the request took — a rough latency signal. */
  ms: number;
  /** Populated when `ok` is false. */
  error?: string;
}

/** A single finding, with the numbers that justify it. */
export interface AuditFinding {
  id: string;
  severity: AuditSeverity;
  title: string;
  /** What is wrong, stated with the measured numbers. */
  detail: string;
  /** What to do about it. Concrete, actionable, no hedging. */
  fix: string;
  /** The images this finding points at. */
  images: string[];
  /** Bytes this finding would save if acted on, when quantifiable. */
  potentialSavingBytes: number | null;
}

export interface AuditScore {
  /** 0–100, higher is better. */
  total: number;
  /** Per-dimension subscores, each 0–100. */
  weight: number;
  format: number;
  delivery: number;
  markup: number;
  /** Letter grade derived from `total`. */
  grade: string;
}

export interface AuditResult {
  url: string;
  /** Final URL after redirects, as reported by the proxy. */
  finalUrl: string;
  fetchedAt: string;
  /** Total bytes of every image on the page. */
  totalBytes: number;
  /** Bytes that a modern-format + right-sizing pass could realistically remove. */
  avoidableBytes: number;
  images: AuditImage[];
  measurements: AuditMeasurement[];
  findings: AuditFinding[];
  score: AuditScore;
  /** Timings for the transfer, so the report can state an LCP estimate. */
  transferMs: number;
  /** Anything that went wrong at the page level (fetch failed, no images, …). */
  pageError: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants — every number here is a real threshold, with the reason attached
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Byte budgets for a single image, by role.
 *
 * These are not invented. They come from the widely-used performance budget
 * convention that a page's *total* image weight should stay under ~1 MB for a
 * fast mobile load, split across a hero plus a handful of content images. A
 * hero gets the largest share because it is usually the LCP element.
 */
export const BUDGET_HERO_BYTES = 200 * 1024;
export const BUDGET_IMAGE_BYTES = 100 * 1024;
export const BUDGET_HEAVY_BYTES = 500 * 1024;
/** A page whose images exceed this is functionally broken on mobile data. */
export const BUDGET_PAGE_BYTES = 1_800 * 1024;

/** IntersectionObserver is universal, but `loading="lazy"` still needs the attribute. */
export const MODERN_FORMATS = ["image/avif", "image/webp"];

/** Formats that are worth re-encoding; SVG and GIF are left alone. */
export const RECOMPRESSIBLE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif",
];

/**
 * Typical achievable saving when re-encoding a legacy JPEG/PNG to WebP at a
 * quality that is visually indistinguishable (q78–82), and to AVIF.
 *
 * These are conservative mid-points measured across the sample set in
 * `scripts/test-audit.mjs`, not best-case marketing figures. When a page
 * already serves WebP we claim a smaller additional saving from AVIF, because
 * that is what the measurements actually show.
 */
export const SAVING_JPEG_TO_WEBP = 0.45;
export const SAVING_PNG_TO_WEBP = 0.55;
export const SAVING_WEBP_TO_AVIF = 0.25;
export const SAVING_OVERSIZE_RESCALE = 0.6;

/**
 * Estimated effective throughput in bytes per second for the connection we
 * model. 1.6 Mbps is the 75th-percentile *effective* 4G downlink — the
 * figure Chrome's own UX guidance uses for a "fast" mobile connection.
 */
export const FOUR_G_BYTES_PER_SEC = 200_000;

// ─────────────────────────────────────────────────────────────────────────────
// URL helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Resolve a possibly-relative URL against a base, returning null when it cannot be. */
export function resolveUrl(raw: string, base: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  // data: URIs are inline bytes, not a network request — they have no
  // Content-Length and counting them as "images to optimise" would be wrong.
  if (/^data:/i.test(trimmed)) return null;
  if (/^(blob|about|javascript):/i.test(trimmed)) return null;
  try {
    return new URL(trimmed, base).toString();
  } catch {
    return null;
  }
}

/** Human-readable byte size. Kept local so the audit has no UI dependency. */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// ─────────────────────────────────────────────────────────────────────────────
// HTML parsing
// ─────────────────────────────────────────────────────────────────────────────

/** Read one attribute out of a tag's raw text, tolerating single/double/no quotes. */
function attr(tag: string, name: string): string | null {
  // Matches name="v", name='v', name=v — and is case-insensitive on the name.
  const re = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+))`, "i");
  const m = tag.match(re);
  if (!m) return null;
  return (m[1] ?? m[2] ?? m[3] ?? "").trim();
}

function boolAttr(tag: string, name: string): boolean {
  return new RegExp(`\\b${name}\\b`, "i").test(tag);
}

/**
 * Pick the largest candidate from a `srcset` attribute.
 *
 * Why largest: `srcset` exists so the browser can pick a *smaller* file for a
 * smaller viewport. An audit has no viewport, so the honest thing to report is
 * the worst case — what a 1× DPR desktop or a retina phone will actually
 * download. Reporting the smallest candidate would flatter the page.
 */
export function largestFromSrcset(srcset: string, base: string): string | null {
  const candidates = srcset
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [url, descriptor = ""] = part.split(/\s+/);
      const w = descriptor.endsWith("w") ? parseFloat(descriptor) : 0;
      const x = descriptor.endsWith("x") ? parseFloat(descriptor) * 1000 : 0;
      return { url, weight: w || x || 1 };
    });
  if (!candidates.length) return null;
  candidates.sort((a, b) => b.weight - a.weight);
  return resolveUrl(candidates[0].url, base);
}

/**
 * Extract every image reference from an HTML document.
 *
 * Handles `<img src>`, `<img srcset>` (largest candidate), `<source srcset>`
 * inside `<picture>`, `<link rel=preload as=image>`, and inline
 * `background-image: url(...)` in `<style>` blocks and `style` attributes.
 *
 * PURE — no DOM, no network. That is what makes it testable against captured
 * HTML in Node.
 */
export function parseHtml(html: string, baseUrl: string): AuditImage[] {
  const found = new Map<string, AuditImage>();

  const push = (img: AuditImage) => {
    const existing = found.get(img.url);
    // First write wins for markup metadata, but any later hit upgrades
    // `aboveFold`/`fromCss` rather than being dropped.
    if (!existing) {
      found.set(img.url, img);
      return;
    }
    if (img.aboveFold) existing.aboveFold = true;
    if (img.fromCss) existing.fromCss = true;
  };

  // ── <img> ────────────────────────────────────────────────────────────────
  const imgTags = html.match(/<img\b[^>]*>/gi) ?? [];
  for (const tag of imgTags) {
    const rawSrc = attr(tag, "src") ?? "";
    const srcset = attr(tag, "srcset");
    let url: string | null = null;
    let fromSrcset = false;

    if (srcset) {
      const best = largestFromSrcset(srcset, baseUrl);
      if (best) {
        url = best;
        fromSrcset = true;
      }
    }
    if (!url) url = resolveUrl(rawSrc, baseUrl);
    if (!url) continue;

    const width = attr(tag, "width");
    const height = attr(tag, "height");
    push({
      url,
      rawSrc: rawSrc || (srcset ? "[srcset]" : ""),
      fromSrcset,
      loading: (attr(tag, "loading") ?? "").toLowerCase() || null,
      decoding: (attr(tag, "decoding") ?? "").toLowerCase() || null,
      width: width && /^\d+$/.test(width) ? parseInt(width, 10) : null,
      height: height && /^\d+$/.test(height) ? parseInt(height, 10) : null,
      alt: attr(tag, "alt") ?? "",
      fromCss: false,
      aboveFold: false,
    });
  }

  // ── <source srcset> (inside <picture>) ──────────────────────────────────
  const sourceTags = html.match(/<source\b[^>]*>/gi) ?? [];
  for (const tag of sourceTags) {
    const type = (attr(tag, "type") ?? "").toLowerCase();
    // A <video>/<audio> source has a `src`, not a `srcset`, and is not an
    // image — requiring srcset here is what separates the two.
    const srcset = attr(tag, "srcset");
    if (!srcset) continue;
    if (type && !type.startsWith("image/")) continue;
    const best = largestFromSrcset(srcset, baseUrl);
    if (!best) continue;
    push({
      url: best,
      rawSrc: "[picture/source]",
      fromSrcset: true,
      loading: null,
      decoding: null,
      width: null,
      height: null,
      alt: "",
      fromCss: false,
      aboveFold: false,
    });
  }

  // ── <link rel="preload" as="image"> ─────────────────────────────────────
  const linkTags = html.match(/<link\b[^>]*>/gi) ?? [];
  for (const tag of linkTags) {
    const rel = (attr(tag, "rel") ?? "").toLowerCase();
    const as = (attr(tag, "as") ?? "").toLowerCase();
    if (!rel.includes("preload") || as !== "image") continue;
    const href = attr(tag, "href");
    const url = href ? resolveUrl(href, baseUrl) : null;
    if (!url) continue;
    push({
      url,
      rawSrc: "[link rel=preload]",
      fromSrcset: false,
      loading: null,
      decoding: null,
      width: null,
      height: null,
      alt: "",
      fromCss: false,
      // A preloaded image is by definition above the fold and eager.
      aboveFold: true,
    });
  }

  // ── background-image in <style> blocks and style="" attributes ──────────
  const cssScopes: string[] = [];
  for (const m of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) cssScopes.push(m[1]);
  for (const m of html.matchAll(/\bstyle\s*=\s*"([^"]*)"/gi)) cssScopes.push(m[1]);
  for (const m of html.matchAll(/\bstyle\s*=\s*'([^']*)'/gi)) cssScopes.push(m[1]);

  for (const css of cssScopes) {
    for (const m of css.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/gi)) {
      const url = resolveUrl(m[1], baseUrl);
      if (!url) continue;
      // Only count actual image files. `url(#filter-id)` in an SVG filter is a
      // fragment reference, not a request, and already excluded by resolveUrl
      // returning the page URL — filter it out explicitly.
      if (url.split("#")[0] === baseUrl.split("#")[0]) continue;
      if (!/\.(jpe?g|png|webp|avif|gif|bmp|tiff?)(\?|#|$)/i.test(url)) continue;
      push({
        url,
        rawSrc: m[1],
        fromSrcset: false,
        loading: null,
        decoding: null,
        width: null,
        height: null,
        alt: "",
        fromCss: true,
        aboveFold: false,
      });
    }
  }

  // ── Above-the-fold heuristic ────────────────────────────────────────────
  //
  // Without a layout engine we cannot know true positions. What we CAN know:
  // an image that is neither `loading="lazy"` nor `decoding="async"` and
  // appears early in the document is being downloaded in the critical path.
  // Marking those as LCP candidates is correct far more often than not, and
  // when it is wrong it costs the user only a slightly conservative estimate.
  const images = [...found.values()];
  let earlyBudget = 8;
  for (const img of images) {
    if (earlyBudget <= 0) break;
    if (img.aboveFold) continue;
    if (img.loading === "lazy" || img.fromCss) continue;
    img.aboveFold = true;
    earlyBudget -= 1;
  }

  return images;
}

// ─────────────────────────────────────────────────────────────────────────────
// Scoring
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Turn images + measurements into findings and a score.
 *
 * The subscores are independent so the report can say *what kind* of problem
 * a site has, not merely how bad it is. A site that serves 40 KB of WebP with
 * no `width`/`height` scores badly on `markup` and well on `weight` — which is
 * exactly the diagnosis its owner needs.
 */
export function score(
  images: AuditImage[],
  measurements: AuditMeasurement[],
  transferMs: number,
): { findings: AuditFinding[]; score: AuditScore; totalBytes: number; avoidableBytes: number } {
  const byUrl = new Map(measurements.map((m) => [m.url, m]));
  const findings: AuditFinding[] = [];

  const measured = images
    .map((img) => ({ img, m: byUrl.get(img.url) }))
    .filter((row): row is { img: AuditImage; m: AuditMeasurement } => Boolean(row.m?.ok && row.m.bytes));

  const totalBytes = measured.reduce((sum, r) => sum + (r.m.bytes ?? 0), 0);

  // ── 1. Format: is anything still being served as legacy JPEG/PNG? ───────
  const legacy = measured.filter((r) => !r.m.modern && RECOMPRESSIBLE_TYPES.includes(r.m.contentType ?? ""));
  let formatSaving = 0;
  for (const r of legacy) {
    const isPng = (r.m.contentType ?? "").includes("png");
    const rate = isPng ? SAVING_PNG_TO_WEBP : SAVING_JPEG_TO_WEBP;
    formatSaving += (r.m.bytes ?? 0) * rate;
  }
  if (legacy.length) {
    findings.push({
      id: "legacy-format",
      severity: legacy.length >= 3 ? "critical" : "warning",
      title: `${legacy.length} image${legacy.length === 1 ? "" : "s"} served in a legacy format`,
      detail:
        `${legacy.length} of ${measured.length} measured images are served as JPEG or PNG. ` +
        `Together they account for ${formatBytes(legacy.reduce((s, r) => s + (r.m.bytes ?? 0), 0))} of the page's ` +
        `${formatBytes(totalBytes)} image weight. WebP and AVIF decode natively in every current browser ` +
        `(97%+ of traffic) and typically halve these bytes at a quality viewers cannot distinguish.`,
      fix: "Re-encode the listed images to WebP at quality 78–82, or AVIF at 50–60 for a further 20–30% reduction. Serve the modern file via <picture> with a JPEG/PNG fallback if you must support very old browsers.",
      images: legacy.map((r) => r.img.url),
      potentialSavingBytes: Math.round(formatSaving),
    });
  } else if (measured.length) {
    findings.push({
      id: "legacy-format",
      severity: "good",
      title: "Every measured image is already in a modern format",
      detail: `${measured.length} images measured, all WebP or AVIF. No bytes are being wasted on legacy encoding.`,
      fix: "Nothing to do here. If you want to go further, AVIF at high effort can shave another 20% off WebP for photographic content.",
      images: [],
      potentialSavingBytes: null,
    });
  }

  // ── 2. WebP that could be AVIF ──────────────────────────────────────────
  const webpOnly = measured.filter((r) => (r.m.contentType ?? "").includes("webp"));
  const avifSaving = webpOnly.reduce((s, r) => s + (r.m.bytes ?? 0) * SAVING_WEBP_TO_AVIF, 0);
  if (webpOnly.length >= 3 && avifSaving > 20 * 1024) {
    findings.push({
      id: "avif-opportunity",
      severity: "info",
      title: `${formatBytes(avifSaving)} more available by moving WebP to AVIF`,
      detail:
        `${webpOnly.length} images are already WebP — good. Measured across the same set, AVIF at quality 55 ` +
        `lands about ${Math.round(SAVING_WEBP_TO_AVIF * 100)}% below WebP, which is ${formatBytes(avifSaving)} on this page. ` +
        `AVIF takes noticeably longer to encode and is not worth it for small icons, so this is a nice-to-have rather than a defect.`,
      fix: "Encode photographic images as AVIF alongside WebP, and let <picture> choose. Skip it for images under 20 KB, where the gain is measured in single-digit KB.",
      images: webpOnly.map((r) => r.img.url),
      potentialSavingBytes: Math.round(avifSaving),
    });
  }

  // ── 3. Individual offenders vs. budget ──────────────────────────────────
  const heavy = measured.filter((r) => (r.m.bytes ?? 0) > BUDGET_HEAVY_BYTES);
  const overBudget = measured.filter((r) => {
    const limit = r.img.aboveFold ? BUDGET_HERO_BYTES : BUDGET_IMAGE_BYTES;
    return (r.m.bytes ?? 0) > limit;
  });
  let budgetSaving = 0;
  for (const r of overBudget) {
    const legacyRate = (r.m.contentType ?? "").includes("png") ? SAVING_PNG_TO_WEBP : SAVING_JPEG_TO_WEBP;
    // A legacy JPEG/PNG has TWO independent problems: wrong encoding, and
    // wrong dimensions. The format finding already claims the encoding saving,
    // so this loop may only claim what is LEFT OVER — the bytes that a correct
    // re-encode would still leave above budget. Multiplying the full byte count
    // by a re-encode factor here, as an earlier version did, made the two
    // findings overlap and total "avoidable bytes" exceed the page's actual
    // weight, which is self-evidently wrong and destroys trust in the report.
    const afterFormat = r.m.modern ? (r.m.bytes ?? 0) : (r.m.bytes ?? 0) * (1 - legacyRate);
    const limit = r.img.aboveFold ? BUDGET_HERO_BYTES : BUDGET_IMAGE_BYTES;
    budgetSaving += Math.max(0, afterFormat - limit);
  }
  if (heavy.length) {
    findings.push({
      id: "heavy-images",
      severity: "critical",
      title: `${heavy.length} image${heavy.length === 1 ? " exceeds" : "s exceed"} 500 KB`,
      detail: heavy
        .sort((a, b) => (b.m.bytes ?? 0) - (a.m.bytes ?? 0))
        .slice(0, 5)
        .map((r) => `${r.img.url.split("/").pop()?.slice(0, 48) ?? r.img.url} — ${formatBytes(r.m.bytes ?? 0)}`)
        .join("\n"),
      fix: "Anything over 500 KB is nearly always a full-resolution camera file served at thumbnail size. Resize to the largest size it is actually displayed at (usually ≤1600 px wide), then re-encode.",
      images: heavy.map((r) => r.img.url),
      // These are the bytes left on the table AFTER the format pass has already
      // claimed its share of the same files. Reporting a full re-encode saving
      // here would count the format fix twice — see the note on `avoidableOf`.
      potentialSavingBytes: Math.round(budgetSaving),
    });
  } else if (overBudget.length) {
    findings.push({
      id: "over-budget",
      severity: "warning",
      title: `${overBudget.length} image${overBudget.length === 1 ? "" : "s"} over the per-image budget`,
      detail:
        `Guidelines used here: ≤${formatBytes(BUDGET_HERO_BYTES)} for an above-the-fold hero, ` +
        `≤${formatBytes(BUDGET_IMAGE_BYTES)} for a content image. ${overBudget.length} images exceed their budget, ` +
        `totalling ${formatBytes(overBudget.reduce((s, r) => s + (r.m.bytes ?? 0), 0))}.`,
      fix: "Downscale to the rendered size and re-encode. If the image is a hero, consider serving a smaller crop on mobile via srcset.",
      images: overBudget.map((r) => r.img.url),
      potentialSavingBytes: Math.round(budgetSaving),
    });
  }

  // ── 4. Page-level weight ────────────────────────────────────────────────
  if (totalBytes > BUDGET_PAGE_BYTES) {
    findings.push({
      id: "page-weight",
      severity: "critical",
      title: `Page ships ${formatBytes(totalBytes)} of images`,
      detail:
        `At a 1.6 Mbps effective 4G downlink — ${formatBytes(FOUR_G_BYTES_PER_SEC)}/s — downloading these images alone takes ` +
        `${(totalBytes / FOUR_G_BYTES_PER_SEC).toFixed(1)} seconds of pure transfer time, before any JavaScript, CSS or fonts. ` +
        `Images are the largest content type on most pages and the most common single cause of a failing LCP.`,
      fix: "Work through the findings above in severity order. Fixing the legacy-format and oversize issues typically brings a page like this under 800 KB.",
      images: [],
      potentialSavingBytes: null,
    });
  }

  // ── 5. Markup: lazy loading ─────────────────────────────────────────────
  const eagerBelowFold = images.filter((i) => i.loading !== "lazy" && !i.aboveFold);
  if (eagerBelowFold.length >= 2) {
    findings.push({
      id: "no-lazy",
      severity: "warning",
      title: `${eagerBelowFold.length} below-the-fold images load eagerly`,
      detail:
        `${eagerBelowFold.length} images have no loading="lazy" and are not in the above-the-fold set, so the browser ` +
        `downloads them during initial page load and they compete with the LCP element for bandwidth. ` +
        `Lazy loading them removes them from the critical path entirely.`,
      fix: 'Add loading="lazy" and decoding="async" to every image below the fold. Never add it to your hero — that delays LCP.',
      images: eagerBelowFold.map((i) => i.url),
      potentialSavingBytes: null,
    });
  }

  // ── 6. Markup: explicit dimensions (CLS) ────────────────────────────────
  const noDimensions = images.filter((i) => !i.fromCss && (i.width == null || i.height == null));
  if (noDimensions.length >= 2) {
    findings.push({
      id: "no-dimensions",
      severity: "warning",
      title: `${noDimensions.length} images have no width/height attributes`,
      detail:
        `Without intrinsic dimensions the browser reserves zero space, then reflows the page when each image arrives. ` +
        `That reflow is Cumulative Layout Shift — a Core Web Vital that Google measures in the field and that users ` +
        `experience as the page jumping under their thumb.`,
      fix: 'Add width="…" height="…" matching the file\'s intrinsic size, and in CSS set `img { max-width: 100%; height: auto; }`. The attributes then supply the aspect ratio without breaking responsiveness.',
      images: noDimensions.map((i) => i.url),
      potentialSavingBytes: null,
    });
  }

  // ── 7. Caching ──────────────────────────────────────────────────────────
  const badlyCached = measured.filter((r) => {
    const cc = (r.m.cacheControl ?? "").toLowerCase();
    if (!cc) return true; // no Cache-Control at all
    // Immutable hashed assets are the only correct answer for images.
    return !/max-age\s*=\s*(\d{6,})/.test(cc) && !cc.includes("immutable");
  });
  if (badlyCached.length >= Math.max(2, Math.ceil(measured.length * 0.5))) {
    findings.push({
      id: "caching",
      severity: "info",
      title: `${badlyCached.length} images lack long-lived cache headers`,
      detail:
        `${badlyCached.length} of ${measured.length} images return no Cache-Control, a short max-age, or no immutable ` +
        `directive. Returning visitors re-download them on every page view, even though nothing changed.`,
      fix: "Serve images from content-hashed filenames and set `Cache-Control: public, max-age=31536000, immutable`. Any CDN or static host can do this; it is a one-line config change and it removes the images from repeat-visit cost entirely.",
      images: badlyCached.map((r) => r.img.url),
      potentialSavingBytes: null,
    });
  }

  // ── 8. srcset / responsive ──────────────────────────────────────────────
  const withoutSrcset = measured.filter((r) => !r.img.fromSrcset && !r.img.fromCss);
  if (withoutSrcset.length >= 4 && withoutSrcset.length > measured.length * 0.5) {
    findings.push({
      id: "no-srcset",
      severity: "info",
      title: "Images are not served responsively",
      detail:
        `${withoutSrcset.length} of ${measured.length} images have no srcset, so every visitor gets the same file ` +
        `regardless of screen size. A 1600 px image on a 390 px phone wastes roughly 85% of its pixels — pixels the ` +
        `user pays for in time and data.`,
      fix: 'Add srcset with 2–3 widths (e.g. 480w, 960w, 1600w) plus a sizes attribute describing the rendered width. On a typical site this cuts mobile image bytes by 40–60%.',
      images: withoutSrcset.map((r) => r.img.url),
      potentialSavingBytes: null,
    });
  }

  // ── 9. Alt text (not a performance issue, but a real defect) ────────────
  const noAlt = images.filter((i) => !i.fromCss && i.alt.trim() === "");
  if (noAlt.length) {
    findings.push({
      id: "no-alt",
      severity: "warning",
      title: `${noAlt.length} image${noAlt.length === 1 ? "" : "s"} missing alt text`,
      detail:
        `${noAlt.length} images have no alt attribute. Alt text is what screen readers announce, what search engines ` +
        `read when they cannot interpret an image, and what the browser displays when the image fails to load. ` +
        `It is also an accessibility compliance requirement under WCAG 1.1.1.`,
      fix: 'Add a descriptive alt to every meaningful image. For purely decorative images use alt="" — an explicitly empty alt is correct and tells assistive tech to skip it.',
      images: noAlt.map((i) => i.url),
      potentialSavingBytes: null,
    });
  }

  // ── Subscores ───────────────────────────────────────────────────────────
  const legacyBytes = legacy.reduce((s, r) => s + (r.m.bytes ?? 0), 0);
  const formatSub =
    totalBytes === 0 ? 100 : Math.round(100 - Math.min(100, (legacyBytes / totalBytes) * 100));
  const weightSub =
    totalBytes === 0 ? 100 : Math.round(100 - Math.min(100, (avoidableOf(findings) / totalBytes) * 100));

  const markupProblems =
    (eagerBelowFold.length >= 2 ? 1 : 0) +
    (noDimensions.length >= 2 ? 1 : 0) +
    (withoutSrcset.length >= 4 && withoutSrcset.length > measured.length * 0.5 ? 1 : 0) +
    (noAlt.length ? 1 : 0);
  const deliveryProblems = (badlyCached.length >= Math.max(2, Math.ceil(measured.length * 0.5)) ? 1 : 0) + (heavy.length ? 1 : 0);
  const markupSub = Math.max(0, 100 - markupProblems * 22);
  const deliverySub = Math.max(0, 100 - deliveryProblems * 30);

  const total = Math.round(
    formatSub * 0.3 + weightSub * 0.35 + deliverySub * 0.2 + markupSub * 0.15,
  );

  return {
    findings,
    score: {
      total,
      format: formatSub,
      weight: weightSub,
      delivery: deliverySub,
      markup: markupSub,
      grade: gradeFor(total),
    },
    totalBytes,
    avoidableBytes: clampAvoidable(findings, totalBytes),
  };
}

function avoidableOf(findings: AuditFinding[]): number {
  // Only count computable savings; the page-weight and markup findings are
  // consequences of the same bytes, and adding them would double-count.
  return findings
    .filter((f) => ["legacy-format", "avif-opportunity", "heavy-images", "over-budget"].includes(f.id))
    .reduce((s, f) => s + (f.potentialSavingBytes ?? 0), 0);
}

/**
 * Clamp the reported saving so it can never exceed what is actually on the page.
 *
 * The per-finding estimates are each individually defensible, but they are
 * independent models and their sum can drift past 100% on pathological inputs
 * (a page where every image is both legacy AND huge AND far above budget). The
 * one thing a paying customer will check first is whether the headline number
 * is believable — "you can save 115% of your page weight" is not. Clamping at
 * the total keeps the claim honest even when the models disagree.
 *
 * Applied to the headline AND to the finding that carries the largest
 * contribution, so the two never contradict each other in the report.
 */
function clampAvoidable(findings: AuditFinding[], totalBytes: number): number {
  const raw = avoidableOf(findings);
  if (totalBytes <= 0) return 0;
  if (raw <= totalBytes) return raw;

  const scale = totalBytes / raw;
  for (const f of findings) {
    if (f.potentialSavingBytes) f.potentialSavingBytes = Math.round(f.potentialSavingBytes * scale);
  }
  return totalBytes;
}

function gradeFor(total: number): string {
  if (total >= 90) return "A";
  if (total >= 80) return "B";
  if (total >= 70) return "C";
  if (total >= 55) return "D";
  if (total >= 40) return "E";
  return "F";
}

// ─────────────────────────────────────────────────────────────────────────────
// Orchestration
// ─────────────────────────────────────────────────────────────────────────────

/** Progress events so the UI can narrate what is happening. */
export type AuditProgress =
  | { stage: "fetching"; message: string }
  | { stage: "parsing"; message: string; imageCount: number }
  | { stage: "measuring"; message: string; done: number; total: number }
  | { stage: "scoring"; message: string }
  | { stage: "done"; message: string };

export interface AuditOptions {
  /** Base URL of the audit proxy Worker (see workers/audit-proxy). */
  proxyBase: string;
  /** Called as each phase completes. */
  onProgress?: (p: AuditProgress) => void;
  /** Cap on how many images we measure, so a 400-image page cannot hang the run. */
  maxImages?: number;
  /** Abort signal, wired to a Cancel button. */
  signal?: AbortSignal;
}

/** Normalise whatever the user typed into a URL we can fetch. */
export function normaliseTargetUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const u = new URL(withScheme);
    // A bare hostname with no dot is almost certainly a typo ("test"), and a
    // localhost/private address is not something a hosted proxy can reach.
    if (!u.hostname.includes(".")) return null;
    if (/^(localhost|127\.|0\.0\.0\.0|10\.|192\.168\.)/.test(u.hostname)) return null;
    return u.toString();
  } catch {
    return null;
  }
}

/**
 * Run a full audit.
 *
 * The proxy is expected to answer `GET {proxyBase}?url=<encoded>` with JSON:
 *   { ok: true, html: string, finalUrl: string, ms: number }
 *   { ok: false, error: string }
 * and `POST {proxyBase}` with `{ urls: string[] }` returning
 *   { results: [{ url, ok, status, bytes, contentType, cacheControl, ms }] }
 *
 * Batching the measurements is deliberate: one request for 40 images instead
 * of 40 parallel connections, which keeps the browser's connection pool free
 * and means a single CORS preflight instead of forty.
 */
export async function runAudit(rawUrl: string, opts: AuditOptions): Promise<AuditResult> {
  const progress = (p: AuditProgress) => opts.onProgress?.(p);
  const maxImages = opts.maxImages ?? 120;

  const target = normaliseTargetUrl(rawUrl);
  if (!target) {
    return emptyResult(rawUrl, "That does not look like a web address. Try something like example.com or https://example.com/page.");
  }

  const proxy = opts.proxyBase.replace(/\/$/, "");

  // ── 1. Fetch the page HTML ──────────────────────────────────────────────
  progress({ stage: "fetching", message: `Fetching ${target}…` });
  let html = "";
  let finalUrl = target;
  let transferMs = 0;
  try {
    const res = await fetch(`${proxy}?url=${encodeURIComponent(target)}`, {
      signal: opts.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      return emptyResult(
        target,
        res.status === 429
          ? "The audit service is rate-limiting requests right now. Wait a minute and try again."
          : `The audit service returned HTTP ${res.status}. Try again shortly.`,
      );
    }
    const payload = (await res.json()) as {
      ok: boolean;
      html?: string;
      finalUrl?: string;
      ms?: number;
      error?: string;
    };
    if (!payload.ok || typeof payload.html !== "string") {
      return emptyResult(target, payload.error || "That page could not be fetched. Check the URL and that the site is publicly reachable.");
    }
    html = payload.html;
    finalUrl = payload.finalUrl ?? target;
    transferMs = payload.ms ?? 0;
  } catch (err) {
    if ((err as Error)?.name === "AbortError") throw err;
    return emptyResult(target, "Could not reach the audit service. Check your connection and try again.");
  }

  // ── 2. Parse ────────────────────────────────────────────────────────────
  progress({ stage: "parsing", message: "Reading the page markup…", imageCount: 0 });
  const parsed = parseHtml(html, finalUrl);
  if (!parsed.length) {
    return {
      ...emptyResult(target, null),
      finalUrl,
      transferMs,
      pageError:
        "No images found on that page. If the images are loaded by JavaScript after render, they are invisible to this audit — and to most crawlers, which is worth knowing in itself.",
    };
  }
  const images = parsed.slice(0, maxImages);
  progress({ stage: "parsing", message: `Found ${images.length} image${images.length === 1 ? "" : "s"}.`, imageCount: images.length });

  // ── 3. Measure ──────────────────────────────────────────────────────────
  progress({ stage: "measuring", message: "Measuring image sizes…", done: 0, total: images.length });
  let measurements: AuditMeasurement[] = [];
  try {
    const res = await fetch(proxy, {
      method: "POST",
      signal: opts.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls: images.map((i) => i.url) }),
    });
    if (res.ok) {
      const payload = (await res.json()) as { results?: AuditMeasurement[] };
      if (Array.isArray(payload.results)) measurements = payload.results;
    }
  } catch (err) {
    if ((err as Error)?.name === "AbortError") throw err;
  }

  // Anything the proxy could not measure is reported as a failed row rather
  // than silently dropped — a missing measurement is itself a finding.
  const measuredUrls = new Set(measurements.map((m) => m.url));
  for (const img of images) {
    if (!measuredUrls.has(img.url)) {
      measurements.push({
        url: img.url,
        ok: false,
        status: 0,
        bytes: null,
        contentType: null,
        cacheControl: null,
        modern: false,
        formatNote: null,
        ms: 0,
        error: "not measured",
      });
    }
  }
  measurements = measurements.map((m) => ({
    ...m,
    modern: MODERN_FORMATS.includes((m.contentType ?? "").toLowerCase()),
  }));

  // ── 4. Score ────────────────────────────────────────────────────────────
  progress({ stage: "scoring", message: "Scoring…" });
  const { findings, score: s, totalBytes, avoidableBytes } = score(images, measurements, transferMs);

  progress({ stage: "done", message: "Audit complete." });

  return {
    url: target,
    finalUrl,
    fetchedAt: new Date().toISOString(),
    totalBytes,
    avoidableBytes,
    images,
    measurements,
    findings,
    score: s,
    transferMs,
    pageError: null,
  };
}

function emptyResult(url: string, error: string | null): AuditResult {
  return {
    url,
    finalUrl: url,
    fetchedAt: new Date().toISOString(),
    totalBytes: 0,
    avoidableBytes: 0,
    images: [],
    measurements: [],
    findings: [],
    score: { total: 0, format: 0, weight: 0, delivery: 0, markup: 0, grade: "—" },
    transferMs: 0,
    pageError: error,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Report serialisation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Render the result as Markdown.
 *
 * This exists because the highest-value thing a paying user does with an audit
 * is paste it into a ticket, a client email or a CMS. A PDF or an image would
 * look nicer and be far less useful. Markdown survives paste into Slack,
 * GitHub, Linear, Notion and email without losing structure.
 */
export function toMarkdown(r: AuditResult): string {
  const lines: string[] = [];
  lines.push(`# Website Image Audit — ${r.finalUrl}`);
  lines.push("");
  lines.push(`**Score: ${r.score.total}/100 (${r.score.grade})** · audited ${new Date(r.fetchedAt).toUTCString()}`);
  lines.push("");
  lines.push("| Dimension | Score |");
  lines.push("| --- | --- |");
  lines.push(`| Image weight | ${r.score.weight} |`);
  lines.push(`| Format | ${r.score.format} |`);
  lines.push(`| Delivery & caching | ${r.score.delivery} |`);
  lines.push(`| Markup | ${r.score.markup} |`);
  lines.push("");
  lines.push(`- Images found: **${r.images.length}**`);
  lines.push(`- Total image bytes: **${formatBytes(r.totalBytes)}**`);
  lines.push(`- Avoidable bytes: **${formatBytes(r.avoidableBytes)}** (${pct(r.avoidableBytes, r.totalBytes)})`);
  lines.push(
    `- Estimated transfer time on 4G: **${(r.totalBytes / FOUR_G_BYTES_PER_SEC).toFixed(1)} s**`,
  );
  lines.push("");

  if (r.findings.length) {
    lines.push("## Findings");
    lines.push("");
    const order: AuditSeverity[] = ["critical", "warning", "info", "good"];
    for (const severity of order) {
      for (const f of r.findings.filter((f) => f.severity === severity)) {
        const badge = severity === "critical" ? "🔴 CRITICAL" : severity === "warning" ? "🟠 WARNING" : severity === "info" ? "🔵 INFO" : "🟢 PASS";
        lines.push(`### ${badge} — ${f.title}`);
        lines.push("");
        lines.push(f.detail);
        lines.push("");
        lines.push(`**Fix:** ${f.fix}`);
        if (f.potentialSavingBytes) lines.push(`**Potential saving:** ${formatBytes(f.potentialSavingBytes)}`);
        lines.push("");
      }
    }
  }

  const measured = r.measurements.filter((m) => m.ok && m.bytes);
  if (measured.length) {
    lines.push("## Every image measured");
    lines.push("");
    lines.push("| Image | Bytes | Format | Cache | Bytes saved by fix |");
    lines.push("| --- | --- | --- | --- | --- |");
    for (const m of measured.sort((a, b) => (b.bytes ?? 0) - (a.bytes ?? 0))) {
      const name = m.url.split("/").pop()?.slice(0, 60) ?? m.url;
      const cache = m.cacheControl ? (m.cacheControl.includes("immutable") ? "immutable" : m.cacheControl.slice(0, 24)) : "none";
      const saving = m.modern ? "—" : formatBytes(Math.round((m.bytes ?? 0) * SAVING_JPEG_TO_WEBP));
      lines.push(`| ${name} | ${formatBytes(m.bytes ?? 0)} | ${m.contentType ?? "?"} | ${cache} | ${saving} |`);
    }
    lines.push("");
  }

  lines.push("---");
  lines.push("");
  lines.push("Generated by ImageAlchemy — https://imagealchemy.app/pro");
  return lines.join("\n");
}

function pct(part: number, whole: number): string {
  if (!whole) return "0%";
  return `${Math.round((part / whole) * 100)}%`;
}
