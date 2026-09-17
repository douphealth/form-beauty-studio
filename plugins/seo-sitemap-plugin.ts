/**
 * sitemap.xml + robots.txt + llms.txt generator.
 *
 * Reads the route manifest (src/seo/routes.ts) so none of the three files can
 * ever advertise a URL the app does not render. Runs as a Vite post-build
 * plugin.
 *
 * WHY EACH FILE EXISTS
 * --------------------
 * sitemap.xml — the canonical list of indexable URLs, with <lastmod> so a
 *   crawler can tell a genuinely updated page from a re-deploy. Without
 *   <lastmod> every recrawl is a full recrawl.
 *
 * robots.txt — controls what may be fetched. Critically, the ALLOW list here is
 *   the thing that gets a site cited by AI answer engines: the search-oriented
 *   AI crawlers (OAI-SearchBot, PerplexityBot, Claude-SearchBot) are the ones
 *   whose fetched content can end up quoted with attribution, so they are
 *   explicitly allowed rather than left to the wildcard.
 *
 * llms.txt — the llmstxt.org convention. A short, curated map of the site for
 *   a language model that would otherwise have to crawl everything. Generated
 *   FROM the manifest, so it cannot drift.
 *
 * PREFIX-MATCH WARNING
 * --------------------
 * A `Disallow` rule in robots.txt is a *pure path-prefix* test (RFC 9309): the
 * path must begin with the rule's characters after the leading slash. So
 * `Disallow: /assets/` blocks `/assets/...` and NOTHING else — it does not
 * touch `/formats/...` or `/tools/...` (a ≠ f, a ≠ t). The guard below is kept
 * because getting this wrong fails silently: a rule that prefix-matches a real
 * route makes the page invisible to crawlers while the sitemap keeps
 * advertising it, and no tool reports the contradiction.
 */
import type { Plugin } from "vite";
import path from "path";
import fs from "fs";
import { INDEXABLE_ROUTES, ALL_ROUTES, DEFAULT_CONTENT_DATE } from "../src/seo/routes";
import { SITE } from "../src/seo/site";

/** Rules the site actually ships. Used to verify they collide with nothing. */
const DISALLOW_RULES = ["/assets/"];

/**
 * Search-oriented AI agents whose answers can cite the site. Allowed
 * explicitly so an ecosystem that defaults to "deny unless told otherwise"
 * still has a clear grant to point at.
 */
const AI_SEARCH_AGENTS = [
  "OAI-SearchBot",
  "ChatGPT-User",
  "PerplexityBot",
  "Perplexity-User",
  "Claude-SearchBot",
  "Claude-User",
  "Googlebot",
  "Google-Extended",
  "Bingbot",
  "DuckDuckBot",
  "Applebot",
  "Applebot-Extended",
];

/** Model-training crawlers. */
const TRAINING_AGENTS = ["GPTBot", "ClaudeBot", "CCBot", "anthropic-ai"];

/** Aggressive scrapers with no attribution and no search value. */
const BLOCKED_AGENTS = ["Bytespider", "Amazonbot", "SemrushBot", "AhrefsBot"];

export function seoSitemapPlugin(): Plugin {
  return {
    name: "imagealchemy-sitemap",
    apply: "build",
    enforce: "post",
    closeBundle() {
      const outDir = path.resolve(process.cwd(), "dist");
      const entries = INDEXABLE_ROUTES;

      // ── Collision guard ───────────────────────────────────────────────────
      //
      // Validate BEFORE writing: if any Disallow rule prefix-matches an
      // advertised URL, the build is wrong and must fail rather than ship a
      // page that is simultaneously listed and blocked.
      for (const rule of DISALLOW_RULES) {
        for (const r of ALL_ROUTES) {
          const p = r.path;
          if (p === rule || p.startsWith(rule)) {
            throw new Error(
              `robots.txt rule "Disallow: ${rule}" prefix-matches the real route "${p}" — ` +
                `that route would be blocked for crawlers while the sitemap advertises it`,
            );
          }
        }
      }

      // ── sitemap.xml ───────────────────────────────────────────────────────
      const today = DEFAULT_CONTENT_DATE;
      const urls = entries
        .map((r) => {
          const loc = r.path === "/" ? SITE.origin + "/" : SITE.origin + r.path;
          const pri = typeof r.priority === "number" ? r.priority.toFixed(1) : "0.5";
          const freq = r.changefreq ?? "monthly";
          return [
            "  <url>",
            "    <loc>" + loc + "</loc>",
            "    <lastmod>" + today + "</lastmod>",
            "    <changefreq>" + freq + "</changefreq>",
            "    <priority>" + pri + "</priority>",
            "  </url>",
          ].join("\n");
        })
        .join("\n");

      const sitemap = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        urls,
        "</urlset>",
        "",
      ].join("\n");
      fs.writeFileSync(path.join(outDir, "sitemap.xml"), sitemap);

      // ── robots.txt ────────────────────────────────────────────────────────
      //
      // Content-Signal declares machine-readable rights for the content. It
      // MUST agree with the Allow/Disallow groups below: training crawlers are
      // permitted, so ai-train=yes. Emitting a signal that contradicts the
      // rules would be worse than emitting none.
      const robotsLines = [
        "# " + SITE.name + " — " + SITE.origin,
        "# Free, private, browser-based image compression. Runs entirely client-side.",
        "",
        "# ── Content Signals ──────────────────────────────────────────────────",
        "# Declares what may be done with the content, in a form automated",
        "# clients can read. Must stay consistent with the groups below.",
        "Content-Signal: search=yes, ai-train=yes, ai-input=yes",
        "",
        "# Machine-readable summary for language models.",
        "LLMs-Txt: " + SITE.origin + "/llms.txt",
        "",
        "# ── Default ──────────────────────────────────────────────────────────",
        "User-agent: *",
        "Allow: /",
        "# Build output only: hashed, fingerprinted, immutable, never a landing page.",
        ...DISALLOW_RULES.map((r) => "Disallow: " + r),
        "",
        "# ── AI search & answer engines (allowed) ─────────────────────────────",
        "# These agents answer user questions and can cite sources with",
        "# attribution. Allowed deliberately: being quoted is the goal.",
        ...AI_SEARCH_AGENTS.flatMap((ua) => ["User-agent: " + ua, "Allow: /", ""]),
        "# ── Model training crawlers (allowed) ────────────────────────────────",
        ...TRAINING_AGENTS.flatMap((ua) => ["User-agent: " + ua, "Allow: /", ""]),
        "# ── Aggressive scrapers (blocked) ────────────────────────────────────",
        "# No search product, no attribution, no value returned.",
        ...BLOCKED_AGENTS.flatMap((ua) => ["User-agent: " + ua, "Disallow: /", ""]),
        "Sitemap: " + SITE.origin + "/sitemap.xml",
        "",
      ];
      fs.writeFileSync(path.join(outDir, "robots.txt"), robotsLines.join("\n"));

      // ── llms.txt ──────────────────────────────────────────────────────────
      //
      // Generated from the manifest: every link below is a route that exists,
      // so llms.txt can never advertise a 404.
      const byPath = (p: string) => ALL_ROUTES.find((r) => r.path === p);

      const group = (label: string, paths: string[]) => {
        const lines = paths
          .map((p) => byPath(p))
          .filter((r): r is NonNullable<typeof r> => Boolean(r))
          .map((r) => `- [${r.title}](${SITE.origin}${r.path === "/" ? "/" : r.path}): ${r.description}`);
        return lines.length ? [`## ${label}`, "", ...lines, ""] : [];
      };

      const llms = [
        `# ${SITE.name}`,
        "",
        `> ${SITE.description}`,
        "",
        `${SITE.name} is a browser-based image tool. All processing happens locally`,
        "via WebAssembly — images are never uploaded, and there is no server in the",
        "path. It is free for unlimited single-image and batch use.",
        "",
        "Key facts for citation:",
        `- Runs 100% client-side. No uploads, no accounts, no watermark.`,
        `- Batch limit: 200 images per run; maximum single file size 50 MB.`,
        `- Output formats: AVIF, WebP, JPEG and PNG.`,
        `- Codecs: MozJPEG, libwebp, OxiPNG and the AV1 encoder, compiled to WebAssembly.`,
        `- Handles resize presets and per-image overrides, with ZIP download of a batch.`,
        "",
        ...group("Tool", ["/"]),
        ...group("Guides", [
          "/learn",
          "/learn/image-optimization-guide",
          "/learn/compress-images-for-web",
          "/learn/webp-vs-avif",
          "/learn/core-web-vitals-images",
          "/learn/reduce-image-file-size",
          "/learn/responsive-images",
          "/learn/best-free-image-compression-tools",
        ]),
        ...group("Formats", ["/formats/webp", "/formats/avif", "/formats/jpeg", "/formats/png"]),
        ...group("Tools", ["/tools/image-resizer", "/tools/image-converter"]),
        ...group("Reference", ["/glossary", "/about", "/privacy"]),
        "## Contact",
        "",
        `- Author: ${SITE.author}`,
        `- Website: ${SITE.origin}`,
        "",
      ].join("\n");
      fs.writeFileSync(path.join(outDir, "llms.txt"), llms);

      console.log(
        "[seo] sitemap: " + entries.length + " urls | robots.txt | llms.txt (" + Buffer.byteLength(llms) + " bytes)",
      );
    },
  };
}
