import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { SITE } from "../../seo/site";
import { absUrl } from "../../seo/html";
import { buildSeoJsonLd } from "../../seo/json-ld";
import { findRoute } from "../../seo/routes";

export interface SeoProps {
  title?: string;
  description?: string;
  path?: string;
  breadcrumbs?: { label: string; path: string }[];
  faqs?: { question: string; answer: string }[];
  keywords?: string[];
  datePublished?: string;
  dateModified?: string;
  noindex?: boolean;
  ogImage?: string;
}

export default function Seo(props: SeoProps) {
  const location = useLocation();
  const path = props.path ?? location.pathname;
  const route = findRoute(path);

  const title = props.title ?? route?.title ?? SITE.name;
  const description = props.description ?? route?.description ?? SITE.description;
  const kind = route?.kind ?? "webpage";
  const noindex = props.noindex ?? route?.noindex ?? false;
  const image = props.ogImage ? absUrl(props.ogImage) : absUrl(SITE.ogImage);
  const isHome = path === "/";

  const jsonLd = buildSeoJsonLd({
    path,
    title,
    description,
    kind,
    breadcrumbs: props.breadcrumbs,
    faqs: props.faqs,
    keywords: props.keywords,
    datePublished: props.datePublished,
    dateModified: props.dateModified,
  });

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={absUrl(path)} />
      {noindex ? (
        <meta name="robots" content="noindex,follow" />
      ) : (
        <meta name="robots" content="index,follow,max-image-preview:large" />
      )}
      <meta property="og:type" content={isHome ? "website" : "article"} />
      <meta property="og:site_name" content={SITE.name} />
      <meta property="og:locale" content={SITE.locale} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={absUrl(path)} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content={String(SITE.ogImageWidth)} />
      <meta property="og:image:height" content={String(SITE.ogImageHeight)} />
      <meta property="og:image:alt" content={title} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      {jsonLd.map((node, i) => (
        <script type="application/ld+json" key={i}>
          {JSON.stringify(node)}
        </script>
      ))}
    </Helmet>
  );
}
