import { Link, NavLink } from "react-router-dom";
import { MotionDiv, MotionSection, MotionNav, MotionA, MotionSpan, MotionP, MotionButton, MotionLi } from "@/lib/motion";
import { Sparkles, Shield, Globe } from "lucide-react";
import { SITE, NAV_GROUPS } from "../seo/site";

/**
 * Global footer. Carries the full internal link map — flat, crawlable and
 * grouped by topic so link equity flows to every content page.
 */
export default function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative mt-20 overflow-hidden border-t border-border/20">
      <div className="pointer-events-none absolute inset-0 mesh-bg opacity-40" />
      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl text-primary-foreground shadow-md"
                style={{ background: "var(--gradient-primary)" }}
                aria-hidden="true"
              >
                <Sparkles className="h-4 w-4" strokeWidth={2} />
              </div>
              <span className="flex flex-col">
                <span className="gradient-text text-sm font-bold tracking-tight">{SITE.name}</span>
                <span className="text-[9px] font-semibold uppercase tracking-[0.25em] text-muted-foreground/40">
                  Compression Studio
                </span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-xs leading-relaxed text-muted-foreground/50">
              Professional-grade image compression that runs entirely in your browser. No uploads, no servers, no compromises. Your images stay private — always.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/30 bg-card/20 px-3 py-1.5 text-[10px] font-medium text-muted-foreground/40">
                <Globe className="h-3 w-3" /> Browser-Only
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/30 bg-card/20 px-3 py-1.5 text-[10px] font-medium text-muted-foreground/40">
                <Shield className="h-3 w-3" /> Zero Tracking
              </span>
            </div>
          </div>

          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/30">
                {group.label}
              </p>
              <ul className="flex flex-col gap-1.5">
                {group.items.map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className="text-xs font-medium text-muted-foreground/60 transition-colors hover:text-primary"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-border/15 py-6 sm:flex-row">
          <p className="text-xs text-muted-foreground/40">
            © {year} {SITE.name}. Built by {SITE.author}. Free forever, private always.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground/40">
            <Link to="/about" className="transition-colors hover:text-primary">About</Link>
            <Link to="/privacy" className="transition-colors hover:text-primary">Privacy</Link>
            <a
              href={SITE.repository}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-primary"
            >
              Source code
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
