/**
 * Parser test harness for src/lib/audit.ts.
 *
 * Runs in plain Node with no test framework, for the same reason the module
 * itself has no DOM dependency: `parseHtml` is a pure string → data function,
 * so it can be exercised against real, captured markup without a browser.
 *
 * Run:  node scripts/test-audit.mjs
 * Wired into: package.json "test:audit", and into "build" — a parsing
 * regression here would silently misreport every customer's audit, which is
 * the kind of bug that should stop a deploy rather than ship.
 */
import path from "path";
import { pathToFileURL } from "url";
import { build } from "esbuild";
import fs from "fs";

const root = path.resolve(process.cwd());
const outFile = path.join(root, "node_modules", ".prerender", "audit-test.mjs");
fs.mkdirSync(path.dirname(outFile), { recursive: true });

await build({
  entryPoints: [path.join(root, "src", "lib", "audit.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "es2022",
  outfile: outFile,
  logLevel: "error",
});

const audit = await import(pathToFileURL(outFile).href);

let passed = 0;
const failures = [];

function check(name, condition, detail = "") {
  if (condition) {
    passed++;
    console.log(`  PASS  ${name}`);
  } else {
    failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

const BASE = "https://example.com/blog/post";

console.log("\nparseHtml — <img> extraction\n");

// ── 1. Plain src, relative and absolute ─────────────────────────────────────
{
  const html = `
    <img src="/images/hero.jpg" alt="Hero">
    <img src="https://cdn.example.com/a.png" width="800" height="600" alt="A">
    <img src="//protocol-relative.example.com/b.webp" alt="B">
    <img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt="inline pixel">
  `;
  const imgs = audit.parseHtml(html, BASE);
  check("relative src resolves against the page URL", imgs.some((i) => i.url === "https://example.com/images/hero.jpg"));
  check("absolute src is kept", imgs.some((i) => i.url === "https://cdn.example.com/a.png"));
  check("protocol-relative src inherits the page scheme", imgs.some((i) => i.url === "https://protocol-relative.example.com/b.webp"));
  check("data: URI is excluded (it is not a network request)", !imgs.some((i) => i.url.startsWith("data:")));
  check("exactly 3 network images found", imgs.length === 3, `got ${imgs.length}`);
  check("alt text captured", imgs.find((i) => i.url.endsWith("hero.jpg"))?.alt === "Hero");
  check("width/height parsed as numbers", imgs.find((i) => i.url.endsWith("a.png"))?.width === 800);
  check("missing width stays null", imgs.find((i) => i.url.endsWith("hero.jpg"))?.width === null);
}

console.log("\nparseHtml — srcset picks the LARGEST candidate\n");

// ── 2. srcset ───────────────────────────────────────────────────────────────
{
  const html = `
    <img src="small.jpg" srcset="small.jpg 480w, medium.jpg 960w, large.jpg 1600w" sizes="100vw" alt="Responsive">
    <img src="one.jpg" srcset="one.jpg 1x, two.jpg 2x" alt="DPR">
  `;
  const imgs = audit.parseHtml(html, BASE);
  check(
    "largest w-descriptor wins (1600w, not 480w)",
    imgs.some((i) => i.url.endsWith("large.jpg")),
    JSON.stringify(imgs.map((i) => i.url)),
  );
  check("smaller candidates are not counted separately", !imgs.some((i) => i.url.endsWith("small.jpg")));
  check("highest x-descriptor wins", imgs.some((i) => i.url.endsWith("two.jpg")));
  check("srcset hits are flagged fromSrcset", imgs.find((i) => i.url.endsWith("large.jpg"))?.fromSrcset === true);
}

console.log("\nparseHtml — <picture><source> handling\n");

// ── 3. picture/source, and NOT video sources ────────────────────────────────
{
  const html = `
    <picture>
      <source type="image/avif" srcset="hero.avif 1600w, hero-sm.avif 800w">
      <source type="image/webp" srcset="hero.webp">
      <img src="hero.jpg" alt="Hero">
    </picture>
    <video>
      <source src="movie.mp4" type="video/mp4">
      <source src="movie.webm" type="video/webm">
    </video>
  `;
  const imgs = audit.parseHtml(html, BASE);
  check("<source type=image/avif> is extracted", imgs.some((i) => i.url.endsWith("hero.avif")));
  check("<source type=image/webp> is extracted", imgs.some((i) => i.url.endsWith("hero.webp")));
  check("largest avif candidate chosen", imgs.some((i) => i.url.endsWith("hero.avif")) && !imgs.some((i) => i.url.endsWith("hero-sm.avif")));
  check("the <img> fallback is still counted once", imgs.filter((i) => i.url.endsWith("hero.jpg")).length === 1);
  check(
    "<video><source src> is NOT counted as an image",
    !imgs.some((i) => i.url.endsWith(".mp4") || i.url.endsWith(".webm")),
    JSON.stringify(imgs.map((i) => i.url)),
  );
}

console.log("\nparseHtml — preload, CSS backgrounds, dedupe\n");

// ── 4. preload + CSS + dedupe ───────────────────────────────────────────────
{
  const html = `
    <link rel="preload" as="image" href="/images/lcp.jpg" fetchpriority="high">
    <link rel="preload" as="font" href="/fonts/x.woff2" crossorigin>
    <link rel="stylesheet" href="/style.css">
    <style>
      .hero { background-image: url('/images/bg.webp'); }
      .other { background: url("/images/bg2.png") no-repeat; }
      .noise { background: url(#gradient-id); }
    </style>
    <div style="background-image:url(/images/inline-bg.jpg)"></div>
    <img src="/images/dup.jpg" alt="first">
    <img src="/images/dup.jpg" alt="second">
  `;
  const imgs = audit.parseHtml(html, BASE);
  const urls = imgs.map((i) => i.url);

  check("preloaded image is found", urls.some((u) => u.endsWith("lcp.jpg")));
  check("preloaded image is marked aboveFold", imgs.find((i) => i.url.endsWith("lcp.jpg"))?.aboveFold === true);
  check("preloaded font is NOT counted as an image", !urls.some((u) => u.includes("woff2")));
  check("stylesheet is NOT counted as an image", !urls.some((u) => u.endsWith("style.css")));
  check("CSS background-image in <style> is found", urls.some((u) => u.endsWith("bg.webp")));
  check("CSS background with double quotes is found", urls.some((u) => u.endsWith("bg2.png")));
  check("inline style attribute background is found", urls.some((u) => u.endsWith("inline-bg.jpg")));
  check("CSS url(#fragment) is NOT counted (it is an SVG filter ref)", !urls.some((u) => u.endsWith("#gradient-id")));
  check("duplicate src is deduplicated to one entry", urls.filter((u) => u.endsWith("dup.jpg")).length === 1);
  check("dedupe does not lose other images", urls.length === 5, `got ${urls.length}: ${urls.join(", ")}`);
  check("CSS images are flagged fromCss", imgs.find((i) => i.url.endsWith("bg.webp"))?.fromCss === true);
}

console.log("\nparseHtml — attribute quirks\n");

// ── 5. Unquoted attrs, casing, boolean attrs ────────────────────────────────
{
  const html = `
    <IMG SRC="/upper/case.jpg" ALT="Upper">
    <img src=/unquoted.jpg alt=Unquoted>
    <img src='/single-quoted.jpg' alt='Single' loading='lazy'>
    <img src="/lazy.jpg" loading="lazy" decoding="async" alt="L">
    <img src="/no-alt.jpg">
  `;
  const imgs = audit.parseHtml(html, BASE);
  check("uppercase <IMG> tag is matched", imgs.some((i) => i.url.endsWith("case.jpg")));
  check("unquoted src is parsed", imgs.some((i) => i.url.endsWith("unquoted.jpg")));
  check("single-quoted src is parsed", imgs.some((i) => i.url.endsWith("single-quoted.jpg")));
  check("single-quoted loading=lazy is parsed", imgs.find((i) => i.url.endsWith("single-quoted.jpg"))?.loading === "lazy");
  check("loading=lazy and decoding=async both captured", (() => {
    const i = imgs.find((i) => i.url.endsWith("lazy.jpg"));
    return i?.loading === "lazy" && i?.decoding === "async";
  })());
  check("absent alt reads as empty string, not null", imgs.find((i) => i.url.endsWith("no-alt.jpg"))?.alt === "");
  check("lazy images are not marked aboveFold", imgs.filter((i) => i.loading === "lazy").every((i) => !i.aboveFold));
}

console.log("\nresolveUrl — scheme safety\n");

// ── 6. URL safety ───────────────────────────────────────────────────────────
{
  check("javascript: rejected", audit.resolveUrl("javascript:alert(1)", BASE) === null);
  check("blob: rejected", audit.resolveUrl("blob:https://x/abc", BASE) === null);
  check("about:blank rejected", audit.resolveUrl("about:blank", BASE) === null);
  check("empty string rejected", audit.resolveUrl("   ", BASE) === null);
  check("relative resolves", audit.resolveUrl("a.jpg", BASE) === "https://example.com/blog/a.jpg");
  check("root-relative resolves", audit.resolveUrl("/a.jpg", BASE) === "https://example.com/a.jpg");
  check("parent traversal is normalised by URL()", audit.resolveUrl("../../a.jpg", BASE) === "https://example.com/a.jpg");
}

console.log("\nnormaliseTargetUrl — user input tolerance\n");

// ── 7. What users actually type ─────────────────────────────────────────────
{
  check("bare domain gets https", audit.normaliseTargetUrl("example.com") === "https://example.com/");
  check("full URL is preserved", audit.normaliseTargetUrl("https://example.com/a?b=1") === "https://example.com/a?b=1");
  check("http is preserved, not upgraded", audit.normaliseTargetUrl("http://example.com") === "http://example.com/");
  check("surrounding whitespace trimmed", audit.normaliseTargetUrl("  example.com  ") === "https://example.com/");
  check("single-label host rejected", audit.normaliseTargetUrl("test") === null);
  check("empty rejected", audit.normaliseTargetUrl("") === null);
  check("localhost rejected (proxy cannot reach it anyway)", audit.normaliseTargetUrl("localhost:3000") === null);
  check("127.0.0.1 rejected", audit.normaliseTargetUrl("127.0.0.1") === null);
  check("192.168.x rejected", audit.normaliseTargetUrl("192.168.1.1") === null);
  check("10.x rejected", audit.normaliseTargetUrl("10.0.0.5") === null);
}

console.log("\nscore — findings and thresholds\n");

// ── 8. Scoring ──────────────────────────────────────────────────────────────
{
  const mkImg = (url, over = {}) => ({
    url, rawSrc: url, fromSrcset: false, loading: null, decoding: null,
    width: null, height: null, alt: "x", fromCss: false, aboveFold: false, ...over,
  });
  const mkMeasure = (url, bytes, contentType, cacheControl = "public, max-age=31536000, immutable") => ({
    url, ok: true, status: 200, bytes, contentType, cacheControl, modern: ["image/webp", "image/avif"].includes(contentType), formatNote: null, ms: 50,
  });

  // A genuinely bad page: legacy formats, oversized, no lazy, no dims, no cache.
  const badImages = [
    mkImg("https://x.com/hero.jpg", { aboveFold: true, width: 2400, height: 1600 }),
    mkImg("https://x.com/a.jpg", { aboveFold: true }),
    mkImg("https://x.com/b.png", { aboveFold: true }),
    mkImg("https://x.com/c.jpg"),
    mkImg("https://x.com/d.png"),
  ];
  const badMeasures = [
    mkMeasure("https://x.com/hero.jpg", 900 * 1024, "image/jpeg", null),
    mkMeasure("https://x.com/a.jpg", 600 * 1024, "image/jpeg", ""),
    mkMeasure("https://x.com/b.png", 400 * 1024, "image/png", "max-age=60"),
    mkMeasure("https://x.com/c.jpg", 300 * 1024, "image/jpeg", null),
    mkMeasure("https://x.com/d.png", 250 * 1024, "image/png", null),
  ];
  const bad = audit.score(badImages, badMeasures, 200);

  check("bad page scores below 55", bad.score.total < 55, `got ${bad.score.total}`);
  check("bad page grade is D or worse", "DEF".includes(bad.score.grade), `got ${bad.score.grade}`);
  check("total bytes summed", bad.totalBytes === (900 + 600 + 400 + 300 + 250) * 1024, `got ${bad.totalBytes}`);
  check("avoidable bytes are computed and > 0", bad.avoidableBytes > 0);
  check("avoidable bytes never exceed total bytes", bad.avoidableBytes <= bad.totalBytes, `avoidable ${bad.avoidableBytes} vs total ${bad.totalBytes}`);
  // Regression: an earlier version let the format finding and the budget
  // finding each claim the same bytes, producing a headline saving of 115% of
  // the page weight. The clamp and the non-overlapping budget calc both exist
  // to prevent that, so assert the per-finding claims sum to no more than the
  // headline figure.
  check(
    "per-finding savings do not sum above the headline saving",
    bad.findings.reduce((s, f) => s + (f.potentialSavingBytes ?? 0), 0) <= bad.avoidableBytes + 1,
    `findings sum ${bad.findings.reduce((s, f) => s + (f.potentialSavingBytes ?? 0), 0)} vs headline ${bad.avoidableBytes}`,
  );
  check("avoidable bytes are a believable share of the page (< 100%)", (bad.avoidableBytes / bad.totalBytes) < 1.0, `${(bad.avoidableBytes / bad.totalBytes).toFixed(2)}`);
  check("legacy-format finding raised as critical", bad.findings.some((f) => f.id === "legacy-format" && f.severity === "critical"));
  check("heavy-images finding raised", bad.findings.some((f) => f.id === "heavy-images"));
  check("page-weight finding raised", bad.findings.some((f) => f.id === "page-weight"));
  check("no-dimensions finding raised", bad.findings.some((f) => f.id === "no-dimensions"));
  check("caching finding raised", bad.findings.some((f) => f.id === "caching"));
  check("format subscore is 0 when everything is legacy", bad.score.format === 0, `got ${bad.score.format}`);

  // A well-built page should pass, not merely score higher.
  const goodImages = [
    mkImg("https://x.com/hero.webp", { aboveFold: true, width: 1600, height: 900, fromSrcset: true }),
    mkImg("https://x.com/a.webp", { loading: "lazy", width: 800, height: 600, fromSrcset: true }),
    mkImg("https://x.com/b.avif", { loading: "lazy", width: 800, height: 600, fromSrcset: true }),
  ];
  const goodMeasures = [
    mkMeasure("https://x.com/hero.webp", 140 * 1024, "image/webp"),
    mkMeasure("https://x.com/a.webp", 45 * 1024, "image/webp"),
    mkMeasure("https://x.com/b.avif", 38 * 1024, "image/avif"),
  ];
  const good = audit.score(goodImages, goodMeasures, 120);

  check("well-built page scores 85+", good.score.total >= 85, `got ${good.score.total}`);
  check("well-built page grade is A or B", "AB".includes(good.score.grade), `got ${good.score.grade}`);
  check("no critical findings on a good page", !good.findings.some((f) => f.severity === "critical"));
  check("format finding is a PASS, not an absence", good.findings.some((f) => f.id === "legacy-format" && f.severity === "good"));
  check("avoidable bytes are 0 on a good page", good.avoidableBytes === 0, `got ${good.avoidableBytes}`);
  check("no lazy-loading finding when everything is lazy", !good.findings.some((f) => f.id === "no-lazy"));
  check("no dimension finding when all have width/height", !good.findings.some((f) => f.id === "no-dimensions"));

  // Every finding must be actionable and quantified where it claims to be.
  for (const f of [...bad.findings, ...good.findings]) {
    check(`finding "${f.id}" has a title, detail and fix`, Boolean(f.title && f.detail && f.fix));
  }
  for (const f of bad.findings) {
    check(`finding "${f.id}" names the images it is about`, Array.isArray(f.images));
  }
}

console.log("\ntoMarkdown — report output\n");

// ── 9. Markdown report ──────────────────────────────────────────────────────
{
  const r = {
    url: "https://example.com/",
    finalUrl: "https://example.com/",
    fetchedAt: new Date("2026-09-17T10:00:00Z").toISOString(),
    totalBytes: 2_400_000,
    avoidableBytes: 1_100_000,
    images: [{ url: "https://example.com/a.jpg", rawSrc: "a.jpg", fromSrcset: false, loading: null, decoding: null, width: null, height: null, alt: "", fromCss: false, aboveFold: true }],
    measurements: [{ url: "https://example.com/a.jpg", ok: true, status: 200, bytes: 2_400_000, contentType: "image/jpeg", cacheControl: null, modern: false, formatNote: null, ms: 300 }],
    findings: [
      { id: "x", severity: "critical", title: "Something is bad", detail: "It is very bad.", fix: "Fix it.", images: ["https://example.com/a.jpg"], potentialSavingBytes: 1_100_000 },
    ],
    score: { total: 32, weight: 40, format: 0, delivery: 30, markup: 56, grade: "F" },
    transferMs: 900,
    pageError: null,
  };
  const md = audit.toMarkdown(r);
  check("report includes the URL as a heading", md.includes("# Website Image Audit — https://example.com/"));
  check("report includes the score", md.includes("32/100"));
  check("report includes total bytes", md.includes("2.29 MB"));
  check("report includes every finding title", md.includes("Something is bad"));
  check("report includes the fix text", md.includes("Fix it."));
  check("report includes a measured-images table", md.includes("| Image | Bytes | Format | Cache |"));
  check("report credits ImageAlchemy", md.includes("imagealchemy.app/pro"));
  check("report does NOT leak internal ids", !md.includes("id: x"));
}

console.log("\nformatBytes — units\n");
{
  check("bytes", audit.formatBytes(512) === "512 B");
  check("kilobytes", audit.formatBytes(2048) === "2.0 KB");
  check("megabytes", audit.formatBytes(1_572_864) === "1.50 MB");
  check("zero", audit.formatBytes(0) === "0 B");
  check("negative is a dash, not a crash", audit.formatBytes(-1) === "—");
  check("NaN is a dash", audit.formatBytes(NaN) === "—");
}

// ── Summary ─────────────────────────────────────────────────────────────────
console.log(`\n${"─".repeat(64)}`);
if (failures.length) {
  console.log(`FAILED — ${passed} passed, ${failures.length} failed:\n`);
  for (const f of failures) console.log(`  • ${f}`);
  console.log("");
  process.exit(1);
} else {
  console.log(`ALL PASS — ${passed} assertions.\n`);
}
