import { type ReactNode } from "react";
import Seo from "./Seo";
import type { SeoProps } from "./Seo";
import Breadcrumbs from "./Breadcrumbs";
import TableOfContents from "./TableOfContents";
import FAQAccordion from "./FAQAccordion";
import ToolCta from "./ToolCta";
import SiteHeader from "../SiteHeader";
import SiteFooter from "../SiteFooter";
import { deriveBreadcrumbs } from "../../seo/html";

export interface ContentLayoutProps {
  title: string;
  description: string;
  path: string;
  h1?: string;
  lede?: ReactNode;
  faqs?: { question: string; answer: string }[];
  breadcrumbs?: { label: string; path: string }[];
  keywords?: string[];
  children: ReactNode;
  toc?: { id: string; text: string }[];
  noindex?: boolean;
  cta?: ReactNode;
}

/**
 * Shared shell for every indexable content page: Seo head, breadcrumbs, H1,
 * lede, optional right-rail TOC, FAQ block and the conversion CTA. One
 * consistent markup pattern across 20+ pages so the site reads as a single
 * publication to readers and crawlers alike.
 */
export default function ContentLayout(props: ContentLayoutProps) {
  const { title, description, path, h1, lede, faqs, breadcrumbs, keywords, children, toc, noindex, cta } = props;
  const crumbs = breadcrumbs?.length ? breadcrumbs : deriveBreadcrumbs(path);

  return (
    <>
      <Seo
        title={title}
        description={description}
        path={path}
        breadcrumbs={crumbs}
        faqs={faqs}
        keywords={keywords}
        noindex={noindex}
      />
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="glow-orb absolute -left-48 -top-48 h-[700px] w-[700px] rounded-full bg-primary" />
        <div className="glow-orb absolute -bottom-48 -right-48 h-[600px] w-[600px] rounded-full bg-accent" style={{ animationDelay: "-8s" }} />
      </div>
      <div className="relative z-10">
        <SiteHeader />
        <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-16">
          <div className="flex gap-10">
            <article className="min-w-0 flex-1">
              <Breadcrumbs items={crumbs} />
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                {h1 ?? title}
              </h1>
              {lede && (
                <p className="mt-5 text-lg leading-relaxed text-muted-foreground/80 sm:text-xl">
                  {lede}
                </p>
              )}
              <div className="mt-10">{children}</div>
              <div className="mt-16">{cta ?? <ToolCta />}</div>
            </article>
            {toc && toc.length > 0 && (
              <aside className="hidden w-64 shrink-0 lg:block">
                <TableOfContents items={toc} />
              </aside>
            )}
          </div>
          {faqs && faqs.length > 0 && (
            <div className="mt-16">
              <FAQAccordion faqs={faqs} />
            </div>
          )}
        </main>
        <SiteFooter />
      </div>
    </>
  );
}
