import { SITE } from "./site";

/**
 * Server-side rendered HTML shell.
 *
 * WHY THIS EXISTS
 * --------------
 * The app is a React SPA, so without help the page body is `<div id="root"></div>`
 * for every URL. Google does render JS, but:
 *   - the second pass costs crawl budget and indexation latency,
 *   - indexing is not guaranteed for content that only appears post-JS,
 *   - AI answer engines (ChatGPT, Perplexity, Claude, AI Overviews) and most
 *     social scrapers do NOT render JavaScript at all.
 *
 * This module produces a complete, dependency-free HTML document for every
 * route at BUILD time. The real React app still hydrates on top of it, so the
 * interactive tool keeps working exactly as before. Users see no flash;
 * crawlers and AI bots see fully-formed content immediately.
 *
 * Everything here is string-only and framework-free on purpose: it runs inside
 * the Vite build and never touches the client bundle.
 */

const ESC: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(value: string): string {
  return String(value).replace(/[&<>"']/g, (c) => ESC[c] ?? c);
}

/** Absolute URL for a path — canonical, OG, sitemap. */
export function absUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${SITE.origin}${path.startsWith("/") ? "" : "/"}${path}`;
}

const ACRONYMS = new Set(["webp", "avif", "jpeg", "png", "jpg", "api", "html", "css", "wasm", "lcp", "inp", "cls"]);

function humanize(slug: string): string {
  return slug
    .split("-")
    .map((w) => (ACRONYMS.has(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

/** Breadcrumb trail derived from a content path: /learn/foo -> Home / Learn / Foo */
export function deriveBreadcrumbs(path: string): { label: string; path: string }[] {
  const segments = path.split("/").filter(Boolean);
  if (segments.length === 0) return [{ label: "Home", path: "/" }];
  const crumbs: { label: string; path: string }[] = [{ label: "Home", path: "/" }];
  let acc = "";
  for (const seg of segments) {
    acc += `/${seg}`;
    crumbs.push({ label: humanize(seg), path: acc });
  }
  return crumbs;
}

const JSONIFY_REPLACER = (_k: string, v: unknown) => (v === undefined ? null : v);

function jsonLdScript(data: unknown): string {
  return `<script type="application/ld+json">\n${JSON.stringify(data, JSONIFY_REPLACER)}\n</script>`;
}

export interface SeoInput {
  path: string;
  title: string;
  description: string;
  body: string;
  scripts: string[];
  stylesheets: string[];
  headExtra?: string;
  jsonLd: unknown[];
  ogImage?: string;
  /** "index" or "noindex" */
  robots?: string;
  /** ISO date the content was published */
  datePublished?: string;
  dateModified?: string;
}

/**
 * Assemble the full HTML document for one route.
 * Pure function, no side effects — safe to call for thousands of routes.
 */
export function renderHtmlDocument(input: SeoInput): string {
  const {
    path, title, description, body, scripts, stylesheets,
    headExtra = "", jsonLd, ogImage, robots = "index,follow,max-image-preview:large",
    datePublished, dateModified,
  } = input;

  const url = absUrl(path);
  const image = ogImage ? absUrl(ogImage) : absUrl(SITE.ogImage);
  const escapedTitle = escapeHtml(title);
  const escapedDesc = escapeHtml(description);
  const isHome = path === "/";

  const jsonLdTags = jsonLd.map(jsonLdScript).join("\n    ");

  // Fonts: preconnect early, load the stylesheet non-blockingly.
  const fontLinks = `
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" media="print" onload="this.media='all'" />`;

  const cssTags = stylesheets
    .map((href) => `    <link rel="stylesheet" crossorigin href="${href}">`)
    .join("\n");

  // Entry script is module/preload; the app hydrates over the SSR'd body.
  const jsTags = scripts
    .map(
      (href, i) =>
        i === 0
          ? `    <script type="module" crossorigin src="${href}"></script>`
          : `    <link rel="modulepreload" href="${href}">`
    )
    .join("\n");

  const articleDates =
    datePublished || dateModified
      ? `
    <meta property="article:published_time" content="${datePublished ?? dateModified}" />
    <meta property="article:modified_time" content="${dateModified ?? datePublished}" />`
      : "";

  return `<!doctype html>
<html lang="${SITE.language}" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="theme-color" content="${SITE.themeColorDark}" media="(prefers-color-scheme: dark)" />
    <meta name="theme-color" content="${SITE.themeColor}" media="(prefers-color-scheme: light)" />
    <title>${escapedTitle}</title>
    <meta name="description" content="${escapedDesc}" />
    <meta name="author" content="${escapeHtml(SITE.author)}" />
    <meta name="robots" content="${robots}" />
    <link rel="canonical" href="${url}" />
    <meta name="application-name" content="${SITE.name}" />
    <meta name="apple-mobile-web-app-title" content="${SITE.name}" />
    <meta name="color-scheme" content="dark light" />
${articleDates}
    <meta property="og:type" content="${isHome ? "website" : "article"}" />
    <meta property="og:site_name" content="${SITE.name}" />
    <meta property="og:locale" content="${SITE.locale}" />
    <meta property="og:title" content="${escapedTitle}" />
    <meta property="og:description" content="${escapedDesc}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:image:width" content="${SITE.ogImageWidth}" />
    <meta property="og:image:height" content="${SITE.ogImageHeight}" />
    <meta property="og:image:alt" content="${escapedTitle}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapedTitle}" />
    <meta name="twitter:description" content="${escapedDesc}" />
    <meta name="twitter:image" content="${image}" />
    ${SITE.twitterHandle ? `<meta name="twitter:site" content="${SITE.twitterHandle}" />` : ""}
    <link rel="icon" href="/favicon.ico" sizes="any" />
    <link rel="manifest" href="/site.webmanifest" />
    <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
${fontLinks}
${cssTags}
${jsTags}
    ${jsonLdTags}
${headExtra}
  </head>
  <body>
    <div id="root">${body}</div>
  </body>
</html>`;
}
