import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useLocation } from "react-router-dom";
import { deriveBreadcrumbs } from "../../seo/html";

export interface Crumb {
  label: string;
  path: string;
}

/**
 * Breadcrumb navigation. Derives the trail from the current path when no
 * explicit items are supplied. A matching BreadcrumbList schema is emitted by
 * the <Seo /> component (see buildSeoJsonLd in src/seo/json-ld.ts).
 */
export default function Breadcrumbs({ items, className = "" }: { items?: Crumb[]; className?: string }) {
  const location = useLocation();
  const crumbs = items?.length ? items : deriveBreadcrumbs(location.pathname);
  if (crumbs.length < 2) return null;

  return (
    <nav aria-label="Breadcrumb" className={`mb-6 ${className}`}>
      <ol className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-muted-foreground/60">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={c.path} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight className="h-3 w-3 shrink-0 opacity-40" />}
              {last ? (
                <span aria-current="page" className="text-foreground/90">
                  {c.label}
                </span>
              ) : (
                <Link to={c.path} className="transition-colors hover:text-primary">
                  {c.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
