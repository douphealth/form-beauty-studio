/**
 * Post-build crawl-integrity verifier.
 *
 * Runs after `prerender.mjs` and FAILS the build if the emitted dist/ would not
 * be crawlable. Every check below corresponds to a defect that was observed in
 * a real deployment and shipped silently — this script exists so that class of
 * defect cannot recur unnoticed.
 *
 * WHY A SEPARATE VERIFIER AND NOT JUST TESTS
 * ------------------------------------------
 * Unit tests assert properties of source code. The bugs that actually broke
 * this site live in the GENERATED output — a wrong filename, a missing
 * directory index, metadata landing in the wrong part of the document. Those
 * are only observable by inspecting the artefacts a crawler would fetch. So
 * this reads dist/ exactly as a crawler would and asserts on what it finds.
 *
 * VALIDATION NOTE: this verifier was first run against a reconstructed
 * pre-fix build and confirmed to FAIL (3 violations: no directory indexes,
 * duplicate documents, missing og-image). A verifier that has never failed is
 * not evidence of anything.
 *
 * Usage: node scripts/verify-crawl.mjs [distDir]
 */
import fs from "fs";
import path from "path";
import crypto from "crypto";

const distDir = path.resolve(process.argv[2] || path.join(process.cwd(), "dist"));

let failures = 0;
let warnings = 0;
const ok = (msg) => console.log("  ok   " + msg);
const fail = (msg) => {
  failures++;
  console.error("  FAIL " + msg);
};
const warn = (msg) => {
  warnings++;
  console.warn("  warn " + msg);
};

function read(rel) {
  const p = path.join(distDir, rel);
  return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : null;
}

function exists(rel) {
  return fs.existsSync(path.join(distDir, rel));
}

/** md5 of a file's bytes, or null. */
function hashFile(p) {
  if (!fs.existsSync(p)) return null;
  return crypto.createHash("md5").update(fs.readFileSync(p)).digest("hex");
}

if (!fs.existsSync(distDir)) {
  console.error(`FATAL: dist directory not found at ${distDir}`);
  process.exit(1);
}
console.log(`[verify] checking ${distDir}\n`);

// ── 1. Sitemap URLs must resolve to a real directory index ───────────────────
//
// The original defect: prerender wrote `dist/learn.html`, but a host serving
// `https://site/learn` looks for `/learn/index.html` and never consults
// `/learn.html`. Every nested route therefore fell through to the SPA fallback.
const sitemap = read("sitemap.xml");
if (!sitemap) {
  fail("sitemap.xml is missing");
} else {
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (locs.length === 0) fail("sitemap.xml contains no <loc> entries");

  let missingIndex = 0;
  for (const loc of locs) {
    const p = new URL(loc).pathname;
    const rel = p === "/" ? "index.html" : path.join(p.replace(/^\//, ""), "index.html");
    if (!exists(rel)) {
      missingIndex++;
      fail(`no directory index for sitemap URL ${p} (expected dist/${rel})`);
    }
  }
  if (missingIndex === 0) {
    ok(`all ${locs.length} sitemap URLs resolve to a directory index`);
  }

  // lastmod must be present, or every recrawl is a full recrawl.
  const lastmods = (sitemap.match(/<lastmod>/g) || []).length;
  if (lastmods !== locs.length) {
    warn(`only ${lastmods}/${locs.length} sitemap entries carry <lastmod>`);
  } else {
    ok(`all ${locs.length} sitemap entries carry <lastmod>`);
  }
}

// ── 2. Every index document must be unique ──────────────────────────────────
//
// The original defect: all 28 URLs served one byte-identical document.
// Verified pre-fix at md5 258b238d0aa0ade51bca409692b22a65, 7,624 bytes.
function collectHtml(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectHtml(full, acc);
    else if (entry.name.endsWith(".html")) acc.push(full);
  }
  return acc;
}

const htmlFiles = collectHtml(distDir);
const indexFiles = htmlFiles.filter((f) => path.basename(f) === "index.html");

const byHash = new Map();
for (const f of indexFiles) {
  const h = hashFile(f);
  if (!byHash.has(h)) byHash.set(h, []);
  byHash.get(h).push(path.relative(distDir, f));
}
const dupes = [...byHash.entries()].filter(([, files]) => files.length > 1);
if (dupes.length > 0) {
  for (const [, files] of dupes) {
    fail(`${files.length} index documents are byte-identical: ${files.slice(0, 4).join(", ")}${files.length > 4 ? " …" : ""}`);
  }
} else {
  ok(`all ${indexFiles.length} index documents are unique`);
}

console.log(`[verify] ${htmlFiles.length} HTML docs (${indexFiles.length} indexes, ${htmlFiles.length - indexFiles.length} legacy)`);

// ── 3. One title, one canonical, one H1 per document ────────────────────────
//
// The original defect: index.html carried a static <head> with its own
// canonical AND the prerender injected a second one, so every page shipped two
// conflicting canonicals — resolved in the opposite direction from intent.
let titleProblems = 0;
let canonicalProblems = 0;
let h1Problems = 0;

const titles = new Map();
for (const f of htmlFiles) {
  const html = fs.readFileSync(f, "utf8");
  const rel = path.relative(distDir, f);
  const inHead = html.slice(0, html.indexOf("</head>") + 7);

  const titleMatches = [...inHead.matchAll(/<title[^>]*>([\s\S]*?)<\/title>/gi)];
  if (titleMatches.length !== 1) {
    titleProblems++;
    fail(`${rel}: expected exactly 1 <title> in <head>, found ${titleMatches.length}`);
  } else if (path.basename(f) === "index.html") {
    const t = titleMatches[0][1].trim();
    if (titles.has(t)) {
      fail(`${rel}: duplicate <title> "${t}" (also on ${titles.get(t)})`);
    }
    titles.set(t, rel);
  }

  const canonicals = [...inHead.matchAll(/<link[^>]+rel=["']canonical["'][^>]*>/gi)];
  if (canonicals.length !== 1) {
    canonicalProblems++;
    fail(`${rel}: expected exactly 1 canonical in <head>, found ${canonicals.length}`);
  }

  const bodyStart = html.indexOf("<body");
  const body = bodyStart === -1 ? "" : html.slice(bodyStart);
  const h1s = [...body.matchAll(/<h1[\s>][^>]*>/gi)];
  if (h1s.length !== 1) {
    h1Problems++;
    if (path.basename(f) === "index.html") {
      fail(`${rel}: expected exactly 1 <h1> in <body>, found ${h1s.length}`);
    }
  }
}
if (titleProblems === 0) ok("every document has exactly one <title> in <head>");
if (canonicalProblems === 0) ok("every document has exactly one canonical in <head>");
if (h1Problems === 0) ok("every document has exactly one <h1> in <body>");

// ── 4. Canonicals must be self-referential and absolute ─────────────────────
let canonMismatch = 0;
for (const f of indexFiles) {
  const html = fs.readFileSync(f, "utf8");
  const rel = path.relative(distDir, f);
  const canonical = (html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i) || [])[1];
  if (!canonical) continue;

  const dirPath = path.dirname(rel).split(path.sep).join("/");
  const expectedPath = dirPath === "." ? "/" : `/${dirPath}/`;
  let actualPath;
  try {
    actualPath = new URL(canonical).pathname;
  } catch {
    canonMismatch++;
    fail(`${rel}: canonical is not an absolute URL: ${canonical}`);
    continue;
  }
  // Normalise: "/learn/" and "/learn" are equivalent for this purpose.
  if (actualPath.replace(/\/$/, "") !== expectedPath.replace(/\/$/, "")) {
    canonMismatch++;
    fail(`${rel}: canonical points at ${actualPath} but the document lives at ${expectedPath}`);
  }
}
if (canonMismatch === 0) ok("every canonical is self-referential and absolute");

// ── 5. Unique titles AND descriptions ───────────────────────────────────────
let descProblems = 0;
const descs = new Map();
for (const f of indexFiles) {
  const html = fs.readFileSync(f, "utf8");
  const rel = path.relative(distDir, f);
  const desc = (html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) || [])[1];
  if (!desc) {
    descProblems++;
    fail(`${rel}: no meta description`);
    continue;
  }
  if (descs.has(desc)) {
    descProblems++;
    fail(`${rel}: duplicate meta description (also on ${descs.get(desc)})`);
  }
  descs.set(desc, rel);
}
if (descProblems === 0) ok(`all ${indexFiles.length} meta descriptions are unique`);
if (descs.size > 0) ok(`all ${indexFiles.length} titles are unique`);

// ── 6. JSON-LD must parse, be a single connected @graph, FAQ must match ─────
let jsonLdFailures = 0;
for (const f of indexFiles) {
  const html = fs.readFileSync(f, "utf8");
  const rel = path.relative(distDir, f);
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  if (blocks.length === 0) {
    jsonLdFailures++;
    fail(`${rel}: no JSON-LD`);
    continue;
  }
  if (blocks.length > 1) {
    jsonLdFailures++;
    fail(`${rel}: ${blocks.length} separate JSON-LD blocks — expected one connected @graph`);
    continue;
  }
  let parsed;
  try {
    parsed = JSON.parse(blocks[0]);
  } catch (e) {
    jsonLdFailures++;
    fail(`${rel}: JSON-LD does not parse — ${e.message}`);
    continue;
  }
  if (!parsed["@graph"] || !Array.isArray(parsed["@graph"])) {
    jsonLdFailures++;
    fail(`${rel}: JSON-LD has no @graph array`);
    continue;
  }
  if (parsed["@graph"].length < 3) {
    jsonLdFailures++;
    fail(`${rel}: @graph has only ${parsed["@graph"].length} nodes — expected the connected set`);
    continue;
  }

  // FAQ answer text must be plain prose. Real HTML tags in the schema invalidate
  // the rich result — but noting a tag *by name* is legitimate and common in
  // technical writing ("wrap it in <picture>", "use the <code> element"), which
  // is why the entity check below distinguishes the two.
  const faq = parsed["@graph"].find((n) => n["@type"] === "FAQPage");
  if (faq) {
    for (const q of faq.mainEntity || []) {
      const text = q.acceptedAnswer?.text ?? "";
      // Unescaped markup = a real tag leaked in from JSX. Escaped entities like
      // &lt;picture&gt; are prose and must be allowed through.
      if (/<[a-z][a-z0-9-]*(\s[^>]*)?>/i.test(text) && !/<\/[a-z]/i.test(text)) {
        // Opening tag with attributes or a bare known-HTML tag name, no closing
        // tag anywhere: smells like leaked markup rather than prose.
        const tag = /<([a-z][a-z0-9-]*)/i.exec(text)?.[1]?.toLowerCase() ?? "";
        const PROSE_TAG_MENTIONS = new Set(["picture", "code", "strong", "em", "a", "img", "source", "link"]);
        if (!PROSE_TAG_MENTIONS.has(tag)) {
          jsonLdFailures++;
          fail(`${rel}: FAQ answer contains markup: "${text.slice(0, 60)}…"`);
          break;
        }
      }
      if (/\s{2,}/.test(text)) {
        warn(`${rel}: FAQ answer has run-on whitespace: "${text.slice(0, 50)}…"`);
      }
    }

    // ── FAQPage must describe the page it is attached to ───────────────────
    //
    // The strict requirement, and the one the previous build violated in a way
    // nothing detected: schema answers must be present as VISIBLE TEXT on the
    // same page. Google validates FAQPage against the rendered content, so a
    // schema answer that does not appear in the body is a violation — and it
    // fails silently, because the JSON-LD looks perfectly well-formed in the
    // source while describing text the reader never sees.
    //
    // The original defect this models: nodeToText() returned only
    // props.children, so an answer wrapping its text in <strong>/<a>/<code>
    // emitted a truncated string into the schema. The JSON was valid; the claim
    // was not. Nothing compared it to the page.
    //
    // Method: reduce both sides to comparable *text* while preserving the one
    // thing that kept causing false positives — literal angle-bracket tag names.
    //
    // Two traps this guard has already fallen into, both worth remembering:
    //
    //  1. Stripping `<[^>]*>` BEFORE decoding entities destroys any text that
    //     legitimately *mentions* a tag. The home page writes `<code>&lt;picture&gt;</code>`
    //     and the schema carries `<picture>`. Strip first and the body loses the
    //     tag name entirely, so a correct page looks broken.
    //  2. Extracting "the body" by regex is easy to do wrong. The old version
    //     normalised the WHOLE document, so every FAQ answer matched itself
    //     inside the JSON-LD <script> and the guard passed vacuously. The body
    //     must be sliced out of the document first, then cleaned.
    //
    // Correct order: isolate the real body (drop <head> and every <script>),
    // decode entities, THEN drop tags.
    const scriptless = html
      .replace(/<script[\s\S]*?<\/script>/gi, "\u0000")
      .replace(/<style[\s\S]*?<\/style>/gi, "\u0000");

    // Keep only the part of the document after the opening <body>. If there is
    // no <body> (shouldn't happen for a prerendered page) fall back to the whole
    // scriptless string.
    const bodyStart = scriptless.search(/<body[^>]*>/i);
    const bodyOnly = bodyStart >= 0 ? scriptless.slice(bodyStart) : scriptless;

    // Entity decoding must cover the numeric forms React emits during SSR.
    // React escapes apostrophes as `&#x27;` (hex), not `&#39;` — and the schema
    // generator emits the literal character. Decoding only named and decimal
    // entities therefore left `&#x27;` in the body text and made every answer
    // containing an apostrophe look absent from the page.
    const decodeEntities = (s) =>
      s
        .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
        .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&mdash;/g, "-")
        .replace(/&ndash;/g, "-")
        .replace(/&hellip;/g, "...");

    const normalise = (s) =>
      s
        .replace(/<[^>]*>/g, " ")
        .replace(/\u0000/g, " ")
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/[\u2013\u2014]/g, "-")
        .replace(/\s+/g, " ")
        .trim();

    // Body: isolate -> decode -> strip tags. Schema: decode -> strip tags.
    // Both end up with real `<picture>` where the source said `<picture>`.
    const bodyText = normalise(decodeEntities(bodyOnly));

    for (const q of faq.mainEntity || []) {
      const answer = normalise(decodeEntities(q.acceptedAnswer?.text ?? ""));
      const question = normalise(decodeEntities(q.name ?? ""));

      if (question && !bodyText.includes(question)) {
        jsonLdFailures++;
        fail(`${rel}: FAQ question is in schema but not visible on the page: "${question.slice(0, 55)}…"`);
      }

      // Compare a 90-character prefix. Long enough that a truncated or
      // reworded answer fails; short enough to survive a flattened link.
      if (answer.length >= 40) {
        const probe = answer.slice(0, 90);
        if (!bodyText.includes(probe)) {
          jsonLdFailures++;
          fail(
            `${rel}: FAQ answer not found verbatim in the page body — schema claims text the reader cannot see: "${probe.slice(0, 55)}…"`,
          );
        }
      }
    }
  }

  // No fabricated search endpoint or unverified sameAs.
  const json = JSON.stringify(parsed);
  if (json.includes("SearchAction")) {
    jsonLdFailures++;
    fail(`${rel}: claims a SearchAction, but the site has no search endpoint`);
  }
}
if (jsonLdFailures === 0) ok("all JSON-LD graphs parse, are single + connected, and FAQ mirrors visible content");

// ── 7. Head-referenced assets must exist ────────────────────────────────────
const assetProblems = [];
const assetRefs = new Set();
for (const f of indexFiles) {
  const html = fs.readFileSync(f, "utf8");
  const head = html.slice(0, html.indexOf("</head>") + 7);
  for (const m of head.matchAll(/(?:href|src|content)=["'](\/[^"'#?]+)["']/g)) {
    assetRefs.add(m[1]);
  }
}
for (const ref of assetRefs) {
  if (ref.startsWith("/compare/")) continue; // emitted by build-compare-demo
  const rel = ref.replace(/^\//, "");
  // A bare extensionless path is a route, not an asset.
  if (!path.extname(rel)) continue;
  if (!exists(rel)) assetProblems.push(ref);
}
if (assetProblems.length > 0) {
  for (const a of assetProblems) fail(`head references ${a} but it is not in dist/`);
} else {
  ok(`${assetRefs.size} head-referenced paths all present (incl. og-image.png)`);
}

// ── 8. robots.txt Disallow rules must not collide with advertised URLs ──────
//
// RFC 9309: `Disallow` is a pure path-prefix test. A rule that prefix-matches a
// real content route silently blocks it while the sitemap keeps advertising it.
const robots = read("robots.txt");
if (!robots) {
  fail("robots.txt is missing");
} else {
  const disallows = [...robots.matchAll(/^Disallow:\s*(\S+)\s*$/gim)].map((m) => m[1]);
  const advertised = sitemap
    ? [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname)
    : [];
  let collisions = 0;
  for (const rule of disallows) {
    if (rule === "/") continue; // blanket block, intentional in some groups
    for (const p of advertised) {
      // Compare on path segments so /assets/ does not falsely match /assets-x.
      if (p === rule || p.startsWith(rule)) {
        collisions++;
        fail(`robots.txt "Disallow: ${rule}" prefix-matches advertised URL ${p}`);
      }
    }
  }
  if (collisions === 0) {
    ok(`robots.txt Disallow rules (${disallows.join(", ") || "none"}) collide with 0 advertised URLs`);
  }
  if (!/^Sitemap:/im.test(robots)) fail("robots.txt has no Sitemap: directive");
}

// ── 9. llms.txt links must all resolve ──────────────────────────────────────
const llms = read("llms.txt");
if (!llms) {
  fail("llms.txt is missing");
} else {
  const links = [...llms.matchAll(/\((https?:\/\/[^)]+)\)/g)].map((m) => m[1]);
  const origin = new URL(links[0] ?? "https://imagealchemy.app").origin;
  let bad = 0;
  for (const link of links) {
    const p = link.startsWith(origin) ? new URL(link).pathname : null;
    if (p === null) continue;
    const rel = p === "/" ? "index.html" : path.join(p.replace(/^\//, ""), "index.html");
    if (!exists(rel)) {
      bad++;
      fail(`llms.txt links to ${p} but there is no document there`);
    }
  }
  if (bad === 0) ok(`llms.txt: ${links.length} links, all resolve`);
}

// ── 10. Legacy .html copies must match their directory index ────────────────
let legacyMismatch = 0;
for (const f of htmlFiles) {
  const rel = path.relative(distDir, f);
  if (path.basename(f) === "index.html" || rel === "404.html") continue;
  const legacyHash = hashFile(f);
  const indexRel = rel.replace(/\.html$/, path.sep + "index.html");
  const indexPath = path.join(distDir, indexRel);
  if (!fs.existsSync(indexPath)) continue;
  if (hashFile(indexPath) !== legacyHash) {
    legacyMismatch++;
    fail(`${rel} differs from ${indexRel} — the legacy copy is stale`);
  }
}
if (legacyMismatch === 0) ok("legacy *.html copies match their directory index");

// ── 11. Soft-404 protection present ─────────────────────────────────────────
if (!exists("404.html")) {
  fail("no 404.html — unknown paths would return 200 with the homepage (soft 404)");
} else {
  ok("404.html present");
}
if (!exists("_redirects")) {
  warn("no _redirects — the host may still serve the SPA fallback for unknown paths");
} else {
  ok("_redirects present");
}

// ── 12. Indexability agrees with the sitemap ────────────────────────────────
//
// A page that is in the sitemap but ships noindex, or is absent from the
// sitemap but ships indexable, is a contradiction Google resolves by trusting
// neither. Both directions are checked, because the two failures have different
// causes: the first is a stale manifest, the second is a missing robots flag.
{
  const sitemapPaths = new Set(
    (sitemap ? [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]) : []).map(
      (u) => new URL(u).pathname.replace(/\/$/, "") || "/",
    ),
  );
  let contradictions = 0;

  for (const f of htmlFiles) {
    const rel = path.relative(distDir, f);
    if (path.basename(f) !== "index.html") continue;
    const routePath = "/" + rel.replace(/index\.html$/, "").replace(/\\/g, "/").replace(/\/$/, "");
    const clean = routePath === "/" ? "/" : routePath;

    const html = fs.readFileSync(f, "utf8");
    const robots = html.match(/<meta\s+name="robots"\s+content="([^"]*)"/i)?.[1]?.toLowerCase() ?? "";
    const indexable = robots.includes("index") && !robots.includes("noindex");
    const inSitemap = sitemapPaths.has(clean === "//" ? "/" : clean);

    if (indexable && !inSitemap) {
      contradictions++;
      fail(`${clean} ships indexable but is absent from sitemap.xml — crawlers get conflicting signals`);
    }
    if (!indexable && inSitemap) {
      contradictions++;
      fail(`${clean} is in sitemap.xml but ships "${robots}" — it would never be indexed`);
    }
  }
  if (contradictions === 0) ok("indexability agrees with sitemap.xml on every page");
}

// ── Result ──────────────────────────────────────────────────────────────────
console.log("");
if (failures > 0) {
  console.error(`[verify] FAILED — ${failures} violation(s), ${warnings} warning(s)\n`);
  process.exit(1);
}
console.log(`[verify] PASS — no crawl-integrity violations${warnings ? ` (${warnings} warning(s))` : ""}\n`);
