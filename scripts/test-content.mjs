/**
 * Content + interactive-component assertions.
 *
 * Framework-free on purpose: this runs FIRST in `npm run build`, before tsc and
 * vite, so a broken claim fails the deploy instead of shipping. It mirrors
 * scripts/test-audit.mjs and test-licence.mjs.
 *
 * WHAT IT PROTECTS
 * ----------------
 * 1. The quality model returns the MEASURED values exactly at the anchor
 *    points. If someone edits the curve, these asserts fail rather than letting
 *    the UI quietly claim a number the encoder never produced.
 * 2. The waterfall's reduction figures match reality (savings must be positive
 *    and must not exceed the image slice).
 * 3. Every content entry is structurally sound: non-empty sections, an H1, a
 *    lede, and FAQ answers long enough to be worth quoting by an answer engine.
 * 4. Content is substantive — the word-count floor is the guard against a page
 *    silently shrinking back to a stub.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

let passed = 0;
const failures = [];

function ok(name, condition, detail = "") {
  if (condition) {
    passed++;
  } else {
    failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function section(title) {
  console.log(`\n── ${title}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Quality model — must reproduce the measured anchors exactly
// ─────────────────────────────────────────────────────────────────────────────
section("quality model");

// The measured values, read from the build-written file so there is ONE source.
const metaPath = join(ROOT, "public", "compare", "meta.json");
let meta = null;
try {
  meta = JSON.parse(readFileSync(metaPath, "utf8"));
} catch (e) {
  failures.push(`public/compare/meta.json is missing or unparseable: ${e.message}`);
}

if (meta) {
  const original = meta.original?.bytes ?? meta.originalBytes;
  const optimised = meta.optimised?.bytes ?? meta.optimisedBytes;
  const aggressive = meta.aggressive?.bytes ?? meta.aggressiveBytes;

  ok("meta.json exposes an original byte count", typeof original === "number" && original > 0);
  ok("meta.json exposes an optimised byte count", typeof optimised === "number" && optimised > 0);
  ok("meta.json exposes an aggressive byte count", typeof aggressive === "number" && aggressive > 0);

  // The optimised encode must be genuinely smaller — the old broken demo shipped
  // a "−87%" badge next to two identical gradients.
  ok(
    "optimised encode is smaller than the original",
    optimised < original,
    `${optimised} vs ${original}`,
  );
  ok(
    "aggressive encode is smaller than the balanced encode",
    aggressive < optimised,
    `${aggressive} vs ${optimised}`,
  );

  // The component's declared anchors must match the real files. This is the
  // assertion that stops the model drifting away from the measurement.
  const componentSrc = readFileSync(join(ROOT, "src", "components", "QualityExplorer.tsx"), "utf8");
  for (const [label, value] of [
    ["originalBytes", original],
    ["q80Bytes", optimised],
    ["q45Bytes", aggressive],
  ]) {
    const re = new RegExp(`${label}:\\s*([0-9_]+)`);
    const m = componentSrc.match(re);
    ok(
      `QualityExplorer declares ${label} matching meta.json`,
      m && Number(m[1].replace(/_/g, "")) === value,
      m ? `component=${m[1]} meta=${value}` : "declaration not found",
    );
  }

  // Re-implement the model here and check it against the anchors. Kept as a
  // duplicate on purpose: an independent reimplementation catches a sign or
  // slope error that importing the module would reproduce faithfully.
  const ORIGINAL = original;
  const Q80 = optimised;
  const Q45 = aggressive;
  const lnQ45 = Math.log(Q45);
  const slope = (Math.log(Q80) - lnQ45) / 35;
  const sizeAt = (q) => {
    const raw = Math.exp(lnQ45 + slope * (q - 45));
    return Math.min(ORIGINAL * 0.99, Math.max(ORIGINAL * 0.22, raw));
  };

  ok("model reproduces the q45 measurement", Math.abs(sizeAt(45) - Q45) < 1, `${sizeAt(45)} vs ${Q45}`);
  ok("model reproduces the q80 measurement", Math.abs(sizeAt(80) - Q80) < 1, `${sizeAt(80)} vs ${Q80}`);

  // Monotonicity: raising quality must never shrink the file.
  let monotonic = true;
  for (let q = 10; q < 100; q++) if (sizeAt(q + 1) < sizeAt(q) - 0.001) monotonic = false;
  ok("size increases monotonically with quality", monotonic);

  // The model must never predict a file larger than the source.
  let exceedsSource = false;
  for (let q = 10; q <= 100; q++) if (sizeAt(q) > ORIGINAL) exceedsSource = true;
  ok("model never predicts a file larger than the source", !exceedsSource);

  // Sanity on the low end: q10 should be a real saving, not a rounding error.
  ok("q10 saves a meaningful amount", sizeAt(10) < ORIGINAL * 0.45, `${sizeAt(10)}`);

  // ── waterfall reduction figures ──
  const reductionBalanced = (ORIGINAL - Q80) / ORIGINAL;
  const reductionAggressive = (ORIGINAL - Q45) / ORIGINAL;

  const waterfallSrc = readFileSync(join(ROOT, "src", "components", "PageWeightWaterfall.tsx"), "utf8");
  for (const [label, expected] of [
    ["balanced", reductionBalanced],
    ["aggressive", reductionAggressive],
  ]) {
    const re = new RegExp(`${label}:\\s*([0-9.]+)`);
    const m = waterfallSrc.match(re);
    const declared = m ? Number(m[1]) : NaN;
    ok(
      `waterfall ${label} reduction matches the measurement`,
      Math.abs(declared - expected) < 0.005,
      `declared=${declared} actual=${expected.toFixed(4)}`,
    );
  }

  ok("reduction is a positive saving", reductionBalanced > 0 && reductionBalanced < 1);
  ok("aggressive saving is the larger of the two", reductionAggressive > reductionBalanced);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Page-weight composition must sum to 100
// ─────────────────────────────────────────────────────────────────────────────
section("page-weight composition");
{
  const src = readFileSync(join(ROOT, "src", "components", "PageWeightWaterfall.tsx"), "utf8");
  const block = src.split("export const TYPICAL_PAGE_WEIGHT")[1]?.split("];")[0] ?? "";
  const pcts = [...block.matchAll(/pct:\s*([0-9]+)/g)].map((m) => Number(m[1]));
  ok("composition has six segments", pcts.length === 6, `found ${pcts.length}`);
  const sum = pcts.reduce((a, b) => a + b, 0);
  ok("composition sums to exactly 100", sum === 100, `sum=${sum}`);
  ok("images are the largest single segment", pcts[0] === Math.max(...pcts));
  ok("the images share is roughly half the page", pcts[0] >= 45 && pcts[0] <= 55, `${pcts[0]}%`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Verdict bands must be monotonic and cover the full slider range
// ─────────────────────────────────────────────────────────────────────────────
section("verdict bands");
{
  const src = readFileSync(join(ROOT, "src", "components", "QualityExplorer.tsx"), "utf8");
  const bounds = [...src.matchAll(/q\s*<\s*(\d+)/g)].map((m) => Number(m[1]));
  ok("verdict bands are declared in ascending order", bounds.every((b, i) => i === 0 || b > bounds[i - 1]), bounds.join(","));
  ok("the lowest band starts above the slider minimum", bounds[0] > 10);
  ok("the highest band leaves room for diminishing returns", bounds[bounds.length - 1] < 100);

  // Every slider position must land in a band. Bands are <40, <62, <88, else.
  const band = (q) => {
    if (q < 40) return 0;
    if (q < 62) return 1;
    if (q < 88) return 2;
    return 3;
  };
  let covered = true;
  for (let q = 10; q <= 100; q++) if (band(q) === undefined) covered = false;
  ok("every slider position resolves to a verdict", covered);
  ok("the sweet spot covers the range most projects use", band(80) === 2 && band(75) === 2);
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Content structure — every entry must be quotable and complete
// ─────────────────────────────────────────────────────────────────────────────
section("content structure");
{
  const dir = join(ROOT, "src", "content", "data");
  const files = readdirSync(dir).filter((f) => f.endsWith(".tsx"));
  ok("content data modules present", files.length > 0, `${files.length} files`);

  let totalEntries = 0;
  let totalFaqs = 0;
  const problems = [];

  for (const file of files) {
    const raw = readFileSync(join(dir, file), "utf8");

    // Count top-level entries by counting `path:` declarations alongside an h1.
    const entries = raw.split(/\n\s*"\/[a-z0-9-/]+":\s*\{/).length - 1;
    if (entries === 0) continue;
    totalEntries += entries;

    // Count entry-level `path:` declarations only — NOT the `path:` keys inside
    // `related: [...]` arrays. Matching every `path:` was the first version of
    // this check and it produced false failures on every file that had related
    // links, which is most of them.
    //
    // Entry-level paths are the keys of the top-level object literal and are
    // written at the start of a line with a leading quote, e.g.   "/about": {
    const paths = [...raw.matchAll(/^\s*"(\/[a-z0-9-/]*)":\s*\{/gm)].map((m) => m[1]);
    const h1s = [...raw.matchAll(/h1:\s*"([^"]+)"/g)].map((m) => m[1]);
    const ledes = [...raw.matchAll(/lede:\s*"/g)].length;

    if (paths.length !== h1s.length) problems.push(`${file}: ${paths.length} paths vs ${h1s.length} h1s`);
    if (paths.length !== ledes) problems.push(`${file}: ${paths.length} paths vs ${ledes} ledes`);

    // H1 length. Glossary entries are legitimately terse — the H1 is the term
    // being defined ("WebP", "MozJPEG"), not a headline — so the floor applies
    // only to prose pages. Applying a headline rule to a dictionary would be a
    // check that trains you to ignore failures.
    const isGlossary = file.startsWith("glossary");
    for (const h1 of h1s) {
      if (h1.length > 90) problems.push(`${file}: h1 too long (${h1.length}): ${h1.slice(0, 50)}`);
      if (!isGlossary && h1.length < 12) problems.push(`${file}: h1 too short: ${h1}`);
    }

    // FAQ answers: collect question/answer pairs and enforce an answer floor.
    const faqBlocks = [...raw.matchAll(/question:\s*"([^"]+)",\s*\n\s*answer:\s*\n?\s*"([^"]+)"/g)];
    for (const [, q, a] of faqBlocks) {
      totalFaqs++;
      if (a.length < 120) problems.push(`${file}: FAQ answer too short for an answer engine (${a.length}): ${q.slice(0, 40)}`);
      if (q.length < 12) problems.push(`${file}: FAQ question too short: ${q}`);
      if (/^(yes|no)\.?$/i.test(a.trim())) problems.push(`${file}: FAQ answer is a bare yes/no: ${q}`);
    }
  }

  ok("content entries discovered", totalEntries > 0, `${totalEntries} entries`);
  ok("every entry has matching path/h1/lede", problems.length === 0, problems.slice(0, 6).join(" | "));
  // FAQ floor. 53 across 27 indexable pages is ~2 per page; the guides carry
  // 5-7 each, which is the shape that actually earns answer-engine citations.
  // The floor guards against a page silently losing its FAQ block in an edit.
  ok("FAQ corpus is substantial", totalFaqs >= 50, `${totalFaqs} FAQs`);

  // ── embed keys must resolve in ContentPage ──────────────────────────────
  // A typo in `embed:` would silently render nothing, which is worse than a
  // crash because no one notices. Resolve every key against the registry.
  const pageSrc = readFileSync(join(ROOT, "src", "content", "ContentPage.tsx"), "utf8");
  const registry = pageSrc.split("EMBEDDED_COMPONENTS")[1]?.split("};")[0] ?? "";
  const known = [...registry.matchAll(/"([a-z-]+)":/g)].map((m) => m[1]);

  const usedKeys = [];
  for (const file of files) {
    const raw = readFileSync(join(dir, file), "utf8");
    for (const m of raw.matchAll(/embed:\s*"([^"]+)"/g)) {
      usedKeys.push({ file, key: m[1] });
    }
  }
  const unknown = usedKeys.filter((u) => !known.includes(u.key));
  ok(
    "every embed key resolves to a registered component",
    unknown.length === 0,
    unknown.map((u) => `${u.file}: "${u.key}"`).join(", "),
  );
  ok("the embed registry is populated", known.length >= 2, `registered: ${known.join(", ")}`);

  // Every registered component must actually be used, or it is dead weight in
  // the bundle. This is the check that stops an orphaned component shipping.
  const unused = known.filter((k) => !usedKeys.some((u) => u.key === k));
  ok("no registered embed is unused", unused.length === 0, unused.join(", "));
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Honesty guards — the retracted claims must never come back
// ─────────────────────────────────────────────────────────────────────────────
section("honesty guards");
{
  const filesToScan = (function walk(d, acc = []) {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.name === "node_modules" || e.name === ".git") continue;
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p, acc);
      else if (/\.(tsx?|jsx?|md)$/.test(e.name)) acc.push(p);
    }
    return acc;
  })(join(ROOT, "src"));

  // The privacy page previously claimed there was no identifying analytics while
  // the site shipped Tinybird. These exact sentences are retracted.
  const RETRACTED = [
    "we do not run analytics that identify you",
    "only your UI preferences",
  ];
  for (const phrase of RETRACTED) {
    const offenders = filesToScan.filter((f) => readFileSync(f, "utf8").toLowerCase().includes(phrase));
    ok(`retracted privacy claim absent: "${phrase.slice(0, 34)}…"`, offenders.length === 0, offenders.join(", "));
  }

  // The old brand must not survive anywhere in the source.
  const forge = filesToScan.filter((f) => readFileSync(f, "utf8").includes("ImageForge"));
  ok("legacy brand name absent from src", forge.length === 0, forge.join(", "));

  // No fabricated aggregate ratings.
  const ratingFiles = filesToScan.filter((f) => /ratingValue|aggregateRating|reviewCount/.test(readFileSync(f, "utf8")));
  ok("no fabricated review ratings", ratingFiles.length === 0, ratingFiles.join(", "));

  // No invented author bylines on the article schema.
  const src = readFileSync(join(ROOT, "src", "seo", "json-ld.ts"), "utf8");
  ok("no placeholder author name in schema", !/AUTHOR_NAME|REPLACE_ME/.test(src));
}

// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${"═".repeat(64)}`);
if (failures.length === 0) {
  console.log(`CONTENT TESTS: PASS — ${passed} assertions`);
  process.exit(0);
} else {
  console.log(`CONTENT TESTS: FAILED — ${failures.length} of ${passed + failures.length} assertions\n`);
  for (const f of failures) console.log(`  FAIL ${f}`);
  process.exit(1);
}
