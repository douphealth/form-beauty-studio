import { Link } from "react-router-dom";
import { Sparkles, Heart } from "lucide-react";
import { NAV_GROUPS } from "../seo/site";
import { SITE } from "../seo/site";

export default function SiteFooter() {
  return (
    <footer className="relative mt-24 border-t border-border/40 bg-card/20">
      <div className="pointer-events-none absolute inset-0 mesh-bg opacity-40" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-3">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-2xl text-primary-foreground shadow-lg"
                style={{ background: "var(--gradient-primary)" }}
                aria-hidden="true"
              >
                <Sparkles className="h-5 w-5" strokeWidth={2} />
              </span>
              <span className="flex flex-col">
                <span className="gradient-text text-base font-bold tracking-tight sm:text-lg">ImageAlchemy</span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Compression Studio
                </span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground/70">
              Free, private, browser-based image compression. AVIF, WebP, JPEG and PNG —
              batch processed locally with WASM codecs. Nothing leaves your device.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["No signup", "No uploads", "No watermark"].map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-border/50 bg-card/40 px-3 py-1 text-[10px] font-semibold text-muted-foreground"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>

          {/* Directory — every link below is an indexable spoke from the hub. */}
          {NAV_GROUPS.map((group) => (
            <nav key={group.label} aria-label={group.label}>
              <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/50">
                {group.label}
              </h3>
              <ul className="space-y-2">
                {group.items.slice(0, 6).map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className="text-sm text-muted-foreground/75 transition-colors hover:text-foreground"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/40 pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground/60">
            © {new Date().getFullYear()} {SITE.name}. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
            <span>Built with</span>
            <Heart className="h-3 w-3 fill-accent text-accent" />
            <span>for a faster web</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
