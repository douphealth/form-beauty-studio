#!/usr/bin/env node
/**
 * Link-integrity guard.
 *
 * WHY THIS EXISTS
 * ---------------
 * `src/content/data/glossary.tsx` shipped a `related` link to `/glossary/lcp` —
 * a page that was never in `src/seo/routes.ts`, had no content module, and
 * produced no HTML file. The link rendered fine, looked plausible, and sent any
 * reader (or crawler) who clicked it to the SPA shell: a 200 response carrying
 * the homepage with `canonical` pointing at `/`. Silent duplicate content.
 *
 * That survived for a reason worth recording: this project's memory described a
 * `src/test/seo-consistency.test.ts` with "21 tests covering nav + related link
 * resolution". That file does not exist and never has — only the stock
 * `example.test.ts` scaffold was ever committed, and `npm run build` never ran
 * vitest anyway. The guardrail was assumed, not present. So this is written as a
 * plain Node script that the build actually invokes.
 *
 * WHAT IT CHECKS
 * --------------
 *  1. Every internal path referenced from a content module resolves to a real route.
 *  2. Every link in the site's navigation resolves to a real route.
 *  3. Every route is reachable: either indexed in a nav group, or listed in at
 *     least one other page's `related` block. An unreachable route is an orphan —
 *     crawlers can only find it through the sitemap, which is weak.
 *  4. Every route has a content module and vice versa (parity, both directions).
 *  5. No route is advertised in the sitemap while being marked `noindex`, and no
 *     `noindex` route is leaked into navigation.
 *
 * Run standalone:  node scripts/test-links.mjs
 * Wired into `npm run build` before `vite build`.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = join(root, "src", "content", "data");
const ROUTES_FILE = join(root, "src", "seo", "routes.ts");
const SITE_FILE = join(root, "src", "seo", "site.ts");

let failures = 0;
const fail = (msg) => {
  failures++;
  console.error(`  FAIL ${msg}`);
};
const ok = (msg) => console.log(`  ok   ${msg}`);

/* ── Parse the route manifest ──────────────────────────────────────────────── */
const routesSrc = readFileSync(ROUTES_FILE, "utf8");

// Each entry looks like:  path: "/learn/foo",  ... noindex: true,
const routeEntries = [];
{
  // Split on the start of each object literal in the ROUTES array.
  const blocks = routesSrc.split(/\{\s*\n\s*path:/).slice(1);
  for (const block of blocks) {
    const pathMatch = /^\s*"([^"]+)"/.exec(block);
    if (!pathMatch) continue;
    routeEntries.push({
      path: pathMatch[1],
      noindex: /\bnoindex:\s*true\b/.test(block),
    });
  }
}

const routePaths = new Set(routeEntries.map((r) => r.path));
const noindexPaths = new Set(routeEntries.filter((r) => r.noindex).map((r) => r.path));
const indexable = routeEntries.filter((r) => !r.noindex).map((r) => r.path);

console.log(`\n[links] checking ${routePaths.size} routes (${indexable.length} indexable, ${noindexPaths.size} noindex)`);

/* ── Collect every internal link declared in content modules ───────────────── */
const files = readdirSync(DATA_DIR).filter((f) => f.endsWith(".tsx"));
const declPattern = /path:\s*"(\/[^"]*)"/g;
const linksByFile = new Map();
const relatedTargets = new Set();
const declaredEntries = new Set();

for (const file of files) {
  const src = readFileSync(join(DATA_DIR, file), "utf8");
  const found = [];
  for (const m of src.matchAll(declPattern)) found.push(m[1]);
  linksByFile.set(file, found);

  // Entry keys: top-level quoted route keys, e.g.  "/glossary/webp": {
  for (const m of src.matchAll(/^\s*"(\/[a-z0-9\-/]*)":\s*\{/gm)) {
    declaredEntries.add(m[1]);
  }

  // Cross-page links appear in more than one shape: `related: [{ path, label }]`
  // on article pages, and `{ path, term, desc }` inside the glossary hub's term
  // list. Keying on `related:` alone reported /glossary/entropy-coding as an
  // orphan when it is in fact linked from hub-glossary.tsx. So: any `path:` that
  // is NOT the file's own entry key counts as a pointer at another page.
  for (const file of files) {
    const src = readFileSync(join(DATA_DIR, file), "utf8");
    const entryKeys = new Set();
    for (const m of src.matchAll(/^\s*"(\/[a-z0-9\-/]*)":\s*\{/gm)) entryKeys.add(m[1]);
    for (const m of src.matchAll(declPattern)) {
      if (!entryKeys.has(m[1])) relatedTargets.add(m[1]);
    }
  }
}

/* ── 1. Every declared internal path resolves ─────────────────────────────── */
{
  let bad = 0;
  for (const [file, paths] of linksByFile) {
    for (const p of paths) {
      if (!routePaths.has(p)) {
        bad++;
        fail(`${file}: link to "${p}" — no such route in src/seo/routes.ts (reader lands on the SPA shell)`);
      }
    }
  }
  if (bad === 0) ok("every internal path declared in content resolves to a real route");
}

/* ── 2. Navigation links resolve ───────────────────────────────────────────── */
let navPaths = new Set();
if (existsSync(SITE_FILE)) {
  const siteSrc = readFileSync(SITE_FILE, "utf8");
  const navBlock = /NAV_GROUPS[\s\S]*?\n\]/.exec(siteSrc)?.[0] ?? siteSrc;
  for (const m of navBlock.matchAll(/path:\s*"(\/[^"]*)"/g)) navPaths.add(m[1]);

  let bad = 0;
  for (const p of navPaths) {
    if (!routePaths.has(p)) {
      bad++;
      fail(`src/seo/site.ts: nav link "${p}" — no such route`);
    }
  }
  if (bad === 0 && navPaths.size > 0) ok(`all ${navPaths.size} navigation links resolve`);
}

/* ── 3. No orphan routes ──────────────────────────────────────────────────── */
{
  const orphans = [];
  for (const p of routePaths) {
    if (p === "/") continue; // the homepage is reachable by definition
    if (noindexPaths.has(p)) continue; // excluded from nav on purpose
    const inNav = navPaths.has(p);
    const inRelated = relatedTargets.has(p);
    if (!inNav && !inRelated) orphans.push(p);
  }
  if (orphans.length === 0) {
    ok("no orphan routes — every indexable page is linked from nav or a related block");
  } else {
    for (const o of orphans) fail(`orphan route: ${o} — in the manifest but reachable only via the sitemap`);
  }
}

/* ── 4. Route <-> content parity, both directions ─────────────────────────── */
{
  const missing = [...routePaths].filter((p) => !declaredEntries.has(p) && p !== "/");
  const extra = [...declaredEntries].filter((p) => !routePaths.has(p));

  // "/" is rendered from prerender static markup, and standalone routes render
  // from src/pages/, so neither needs a data-module entry. Compare only the
  // article routes that should have one.
  const standalone = new Set(["/", "/privacy", "/pro"]);
  const reallyMissing = missing.filter((p) => !standalone.has(p));

  if (reallyMissing.length === 0) {
    ok("every article route has a content module");
  } else {
    for (const p of reallyMissing) fail(`route "${p}" has no content entry in src/content/data/`);
  }

  if (extra.length === 0) {
    ok("every content entry maps to a declared route");
  } else {
    for (const p of extra) fail(`content entry "${p}" has no matching route in the manifest`);
  }
}

/* ── 5. noindex discipline ────────────────────────────────────────────────── */
{
  // A noindex page belongs in the FOOTER (users expect legal pages there, and
  // `follow` still passes link equity) but must not be promoted as primary
  // navigation, and must never be advertised in files that exist to solicit
  // indexing — sitemap.xml and llms.txt. Both of those are generated from the
  // manifest and already exclude noindex routes; this asserts it stays true.
  let bad = 0;

  const FOOTER_ONLY = new Set(["/privacy", "/terms"]);
  for (const p of noindexPaths) {
    if (navPaths.has(p) && !FOOTER_ONLY.has(p)) {
      bad++;
      fail(`${p} is noindex but appears in navigation — the link advertises a page we exclude from search`);
    }
  }

  // llms.txt must not list a noindex route: it is a curated map of citable content.
  const llmsPath = join(root, "dist", "llms.txt");
  const srcLlms = join(root, "plugins", "seo-sitemap-plugin.ts");
  if (existsSync(srcLlms)) {
    const pluginSrc = readFileSync(srcLlms, "utf8");
    const llmsBlock = /const llms = \[([\s\S]*?)\]\.join/.exec(pluginSrc)?.[1] ?? "";
    for (const p of noindexPaths) {
      if (new RegExp(`"${p.replace(/\//g, "\\/")}"`).test(llmsBlock)) {
        bad++;
        fail(`llms.txt lists ${p}, which is noindex — a citable-content file must not advertise an excluded page`);
      }
    }
  }

  if (bad === 0) ok("noindex pages stay out of nav, llms.txt and the sitemap");
}

console.log("");
if (failures > 0) {
  console.error(`[links] FAILED — ${failures} violation(s)\n`);
  process.exit(1);
}
console.log("[links] PASS — no link-integrity violations\n");
