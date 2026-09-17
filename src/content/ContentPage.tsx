import { Fragment } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import ContentLayout from "../components/seo/ContentLayout";
import QualityExplorer from "../components/QualityExplorer";
import PageWeightWaterfall from "../components/PageWeightWaterfall";
import { getContent } from "./index";
import { findRoute } from "../seo/routes";

/**
 * Interactive components a content module can place by name via `section.embed`.
 *
 * Kept as an explicit registry rather than a dynamic import so the components
 * stay in the main bundle's graph (they are small and used on several high-value
 * pages) and so a bad key is caught at build time by scripts/test-content.mjs.
 */
const EMBEDDED_COMPONENTS: Record<string, React.ComponentType> = {
  "quality-explorer": QualityExplorer,
  "page-weight": PageWeightWaterfall,
};

/**
 * Renders any page from the content index. One component serves all 20+ pages —
 * the route manifest supplies title/description, the content entry supplies the
 * body, FAQs and related links.
 */
export default function ContentPage({ path }: { path: string }) {
  const entry = getContent(path);
  const route = findRoute(path);

  if (!entry || !route) {
    return (
      <ContentLayout
        title="Page not found"
        description="The page you're looking for doesn't exist."
        path={path}
        noindex
      >
        <p>This page doesn't exist or has moved.</p>
      </ContentLayout>
    );
  }

  const toc = entry.sections.map((s) => ({ id: s.id, text: s.heading }));

  return (
    <ContentLayout
      title={route.title}
      description={route.description}
      path={path}
      h1={entry.h1}
      lede={entry.lede}
      keywords={entry.keywords}
      faqs={entry.faqs}
      toc={toc}
    >
      <div className="prose-content">
        {entry.sections.map((section) => {
          const Embed = section.embed ? EMBEDDED_COMPONENTS[section.embed] : undefined;
          return (
            <Fragment key={section.id}>
              <section className="mb-12 scroll-mt-24" id={section.id} aria-labelledby={"h-" + section.id}>
                <h2 className="mb-4 text-2xl font-bold tracking-tight text-foreground" id={"h-" + section.id}>
                  {section.heading}
                </h2>
                {section.body.map((paragraph, i) => (
                  <p key={i} className="mb-4 text-[15px] leading-relaxed text-muted-foreground/90 sm:text-base">
                    {paragraph}
                  </p>
                ))}
              </section>
              {Embed && (
                <div className="mb-12">
                  <Embed />
                </div>
              )}
            </Fragment>
          );
        })}
      </div>

      {entry.related.length > 0 && (
        <section className="mt-16" aria-labelledby="related-heading">
          <h2 id="related-heading" className="mb-5 text-lg font-bold text-foreground">
            Related guides
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {entry.related.map((rel) => (
              <Link
                key={rel.path}
                to={rel.path}
                className="glass-card group flex items-center justify-between gap-4 p-4 transition-all hover:border-primary/30 hover:shadow-lg"
              >
                <span className="text-sm font-medium text-foreground/90">{rel.label}</span>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-primary" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </ContentLayout>
  );
}
