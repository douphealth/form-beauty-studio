import { SITE } from "./site";
import { absUrl, deriveBreadcrumbs } from "./html";
type Crumb = { label: string; path: string };

/**
 * schema.org JSON-LD graph builder.
 *
 * WHY A `@graph` AND NOT LOOSE BLOCKS
 * -----------------------------------
 * The previous version emitted 3–5 separate <script type="application/ld+json">
 * blocks, each with its own "@context" and no @id links between them. To a
 * consumer that is five unrelated documents that happen to sit in one page:
 *  - there was no way to say "THIS WebPage is the mainEntity of THAT Article",
 *  - the FAQPage and the BreadcrumbList had no declared relationship,
 *  - and nothing told a parser which WebSite the page belonged to.
 *
 * One connected @graph with @id cross-references is the shape Google's own
 * structured-data documentation uses, and it is what lets an AI answer engine
 * resolve "who publishes this page, what is it about, and how does it relate to
 * the rest of the site" without guessing.
 *
 * HONESTY RULES — every one of these was a real defect
 * ---------------------------------------------------
 * 1. No `SearchAction`. The site has no search endpoint. Claiming a sitelinks
 *    search box that does not exist invites Google to test it and find nothing.
 * 2. No `sameAs` unless the target genuinely represents this brand. The
 *    repository exists but its README is the stock Lovable template, so a
 *    crawler following it finds a page that never says "ImageAlchemy". That
 *    weakens the entity instead of strengthening it — gated behind
 *    SITE.repositoryIsBranded.
 * 3. No aggregate `Rating`/`Review`. There is no review system, so any number
 *    here would be invented, and fake review markup is a manual-action risk.
 */

/** Facts change; bump this when the claims below are re-verified. */
export const DEFAULT_DATE = "2026-09-16";

const ORG_ID = `${SITE.origin}/#org`;
const SITE_ID = `${SITE.origin}/#website`;

function organizationNode() {
  return {
    "@type": "Organization",
    "@id": ORG_ID,
    name: SITE.name,
    url: SITE.origin,
    description: SITE.shortDescription,
    founder: { "@type": "Person", name: SITE.author },
    logo: {
      "@type": "ImageObject",
      url: absUrl("/og-icon.png"),
      width: 512,
      height: 512,
    },
    areaServed: { "@type": "Place", name: SITE.areaServed },
    // Only asserted when the external profile actually identifies this product.
    ...(SITE.repositoryIsBranded ? { sameAs: [SITE.repository] } : {}),
  };
}

function websiteNode() {
  return {
    "@type": "WebSite",
    "@id": SITE_ID,
    url: SITE.origin,
    name: SITE.name,
    description: SITE.description,
    inLanguage: SITE.language,
    publisher: { "@id": ORG_ID },
    // NOTE: deliberately no `potentialAction` SearchAction — there is no
    // on-site search endpoint to point it at. See the honesty rules above.
  };
}

/**
 * The tool itself. Emitted ONLY on the home route, because that is the only
 * page that IS the application. Marking an article page as a WebApplication
 * would misdescribe it.
 */
function applicationNode(url: string) {
  return {
    "@type": ["WebApplication", "SoftwareApplication"],
    "@id": `${SITE.origin}/#app`,
    name: SITE.name,
    url,
    description: SITE.description,
    applicationCategory: "MultimediaApplication",
    applicationSubCategory: "Image Compression",
    operatingSystem: "Any operating system with a modern web browser",
    browserRequirements: "Requires JavaScript and WebAssembly",
    isAccessibleForFree: true,
    // A one-time paid tier exists; the free tier is genuinely unlimited, so we
    // do NOT emit an `offers` price of 0 that would misrepresent the Pro tier,
    // and we do NOT emit a price for Pro we cannot honour from config.
    featureList: [
      "Batch compress up to 200 images at once",
      "Convert between AVIF, WebP, JPEG and PNG",
      "MozJPEG, libwebp, OxiPNG and AV1 encoders via WebAssembly",
      "Before and after comparison slider",
      "Client-side processing with no uploads",
      "Resize presets and per-image overrides",
      "ZIP download of a whole batch",
    ],
    publisher: { "@id": ORG_ID },
    mainEntityOfPage: { "@id": url },
  };
}

function breadcrumbNode(crumbs: Crumb[], url: string) {
  return {
    "@type": "BreadcrumbList",
    "@id": `${url}#breadcrumbs`,
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      item: absUrl(c.path),
    })),
  };
}

function faqNode(faqs: { question: string; answer: string }[], url: string) {
  return {
    "@type": "FAQPage",
    "@id": `${url}#faq`,
    // Ties the FAQ to the page it belongs to. Without this, a parser has to
    // infer the association from document order.
    mainEntityOfPage: { "@id": url },
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

function articleNode(e: SeoEntity, url: string) {
  return {
    "@type": "TechArticle",
    "@id": `${url}#article`,
    headline: e.title,
    description: e.description,
    url,
    mainEntityOfPage: { "@id": url },
    author: { "@type": "Person", name: SITE.author },
    publisher: { "@id": ORG_ID },
    datePublished: e.datePublished ?? DEFAULT_DATE,
    dateModified: e.dateModified ?? DEFAULT_DATE,
    proficiencyLevel: "Beginner to advanced",
    dependencies: "A modern web browser. No installation required.",
    ...(e.keywords ? { keywords: e.keywords.join(", ") } : {}),
  };
}

/** A hub page that lists other pages — tells crawlers the pages form a set. */
function itemListNode(e: SeoEntity, url: string) {
  const items = e.listItems ?? [];
  if (items.length === 0) return null;
  return {
    "@type": "ItemList",
    "@id": `${url}#list`,
    name: e.title,
    numberOfItems: items.length,
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      url: absUrl(item.path),
    })),
  };
}

/** A glossary entry, tied back to the glossary hub. */
function definedTermNode(e: SeoEntity, url: string) {
  return {
    "@type": "DefinedTerm",
    "@id": `${url}#term`,
    name: e.term ?? e.title,
    description: e.description,
    url,
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      "@id": `${SITE.origin}/glossary#termset`,
      name: "Image compression glossary",
      url: absUrl("/glossary"),
    },
  };
}

/** The page node every other node hangs off. */
function webPageNode(e: SeoEntity, url: string) {
  return {
    "@type": "WebPage",
    "@id": url,
    url,
    name: e.title,
    description: e.description,
    isPartOf: { "@id": SITE_ID },
    about: { "@id": ORG_ID },
    inLanguage: SITE.language,
    ...(e.keywords && e.keywords.length > 0 ? { keywords: e.keywords.join(", ") } : {}),
    ...(e.dateModified ? { dateModified: e.dateModified } : {}),
  };
}

export interface SeoEntity {
  path: string;
  title: string;
  description: string;
  kind: string;
  breadcrumbs?: Crumb[];
  faqs?: { question: string; answer: string }[];
  keywords?: string[];
  datePublished?: string;
  dateModified?: string;
  /** For hub pages: the child pages this hub links to. */
  listItems?: { label: string; path: string }[];
  /** For glossary entries: the term being defined. */
  term?: string;
}

/**
 * Build the complete graph for one route.
 *
 * Returns a SINGLE-ELEMENT array containing one `@graph`. The prerender script
 * emits it as one <script> block, so every page has exactly one parseable graph
 * with no duplicated Organization/WebSite nodes.
 */
export function buildSeoJsonLd(e: SeoEntity): unknown[] {
  const url = absUrl(e.path);
  const crumbs = e.breadcrumbs?.length ? e.breadcrumbs : deriveBreadcrumbs(e.path);
  const isHome = e.path === "/";

  const graph: unknown[] = [
    organizationNode(),
    websiteNode(),
    webPageNode(e, url),
    breadcrumbNode(crumbs, url),
  ];

  // The application node belongs to the home page and is referred to from it.
  if (isHome) {
    graph.push(applicationNode(url));
  }

  if (e.faqs && e.faqs.length > 0) {
    graph.push(faqNode(e.faqs, url));
  }

  if (e.kind === "guide" || e.kind === "glossary") {
    graph.push(articleNode(e, url));
  }

  if (e.kind === "glossary" && e.term) {
    graph.push(definedTermNode(e, url));
  }

  const list = itemListNode(e, url);
  if (list) {
    graph.push(list);
  }

  return [
    {
      "@context": "https://schema.org",
      "@graph": graph,
    },
  ];
}
