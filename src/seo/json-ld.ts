import { SITE } from "./site";
import { absUrl, deriveBreadcrumbs } from "./html";
type Crumb = { label: string; path: string };

/**
 * schema.org JSON-LD graph builder.
 *
 * Emits Organization + WebSite (with SearchAction) on every page, then
 * page-type-specific nodes: BreadcrumbList always, FAQPage when FAQs exist,
 * TechArticle for guides and glossary terms. Rich-result eligibility is what
 * turns "indexed" into "clicked".
 */

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
}

export const DEFAULT_DATE = "2026-09-16";

function orgNode() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE.origin}/#org`,
    name: SITE.name,
    url: SITE.origin,
    description: SITE.shortDescription,
    founder: { "@type": "Person", name: SITE.author },
    sameAs: [SITE.repository],
  };
}

function websiteNode() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE.origin}/#website`,
    url: SITE.origin,
    name: SITE.name,
    description: SITE.description,
    publisher: { "@id": `${SITE.origin}/#org` },
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE.origin}/learn?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

function breadcrumbNode(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      item: absUrl(c.path),
    })),
  };
}

function faqNode(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

function articleNode(e: SeoEntity, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: e.title,
    description: e.description,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    author: { "@type": "Person", name: SITE.author },
    publisher: { "@id": `${SITE.origin}/#org` },
    datePublished: e.datePublished ?? DEFAULT_DATE,
    dateModified: e.dateModified ?? DEFAULT_DATE,
    proficiencyLevel: "Beginner to advanced",
    dependencies: "A modern web browser. No installation required.",
    ...(e.keywords ? { keywords: e.keywords.join(", ") } : {}),
  };
}

export function buildSeoJsonLd(e: SeoEntity): unknown[] {
  const url = absUrl(e.path);
  const crumbs = e.breadcrumbs?.length ? e.breadcrumbs : deriveBreadcrumbs(e.path);

  const nodes: unknown[] = [orgNode(), websiteNode(), breadcrumbNode(crumbs)];

  if (e.faqs && e.faqs.length > 0) {
    nodes.push(faqNode(e.faqs));
  }

  if (e.kind === "guide" || e.kind === "glossary") {
    nodes.push(articleNode(e, url));
  }

  return nodes;
}
