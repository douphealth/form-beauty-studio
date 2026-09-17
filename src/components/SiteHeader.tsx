import { useState, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { MotionDiv, AnimatePresence, MotionNav } from "@/lib/motion";
import { Sparkles, Menu, X, ArrowUpRight } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { NAV_GROUPS, PRO_NAV_ITEM } from "../seo/site";

/**
 * Header with a scroll progress bar.
 *
 * The top bar reads `document.scrollingElement` in a rAF-throttled scroll
 * listener rather than onScroll + setState, so a long page never re-renders
 * the whole header tree on every frame.
 */
export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const { pathname } = useLocation();

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const el = document.scrollingElement;
        if (!el) return;
        const max = el.scrollHeight - el.clientHeight;
        setProgress(max > 0 ? (el.scrollTop / max) * 100 : 0);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Close the mobile menu whenever the route changes.
  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-border/30 bg-background/50 backdrop-blur-3xl backdrop-saturate-150">
      {/* Scroll progress — width via transform so it stays on the compositor. */}
      <div
        className="h-0.5 origin-left"
        style={{
          background: "var(--gradient-primary)",
          transform: `scaleX(${Math.max(progress, 0.001) / 100})`,
          willChange: "transform",
        }}
        aria-hidden="true"
      />

      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
        <Link to="/" className="group flex items-center gap-3">
          <MotionDiv
            whileHover={{ rotate: 8, scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400 }}
            className="relative flex h-10 w-10 items-center justify-center rounded-2xl text-primary-foreground shadow-lg"
            style={{ background: "var(--gradient-primary)" }}
            aria-hidden="true"
          >
            <Sparkles className="h-5 w-5" strokeWidth={2} />
            <span
              className="absolute inset-0 rounded-2xl"
              style={{ animation: "pulse-ring 3s ease-out infinite", boxShadow: "0 0 0 2px hsl(var(--primary) / 0.35)" }}
              aria-hidden="true"
            />
          </MotionDiv>
          <span className="flex flex-col">
            <span className="gradient-text text-base font-bold tracking-tight sm:text-lg">ImageAlchemy</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Compression Studio
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Primary">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="group relative">
              <button
                type="button"
                className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-primary/[0.06] hover:text-foreground"
              >
                {group.label}
                <span className="text-[10px] opacity-60 transition-transform duration-200 group-hover:translate-y-0.5">▾</span>
              </button>
              <div className="invisible absolute left-1/2 top-full z-50 w-72 -translate-x-1/2 pt-2 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100">
                <div className="glass-card overflow-hidden rounded-2xl p-2 shadow-2xl">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        "flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors " +
                        (isActive
                          ? "bg-primary/[0.08] text-primary"
                          : "text-muted-foreground hover:bg-primary/[0.04] hover:text-foreground")
                      }
                    >
                      {item.label}
                      <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-40" />
                    </NavLink>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* Pro sits next to the primary CTA rather than inside a dropdown: a
              paid feature nobody can find is a paid feature nobody buys, and
              burying it three clicks deep in a "Reference" menu would do
              exactly that. Styled as an outline so it supports the primary
              "Open the tool" action instead of competing with it. */}
          <NavLink
            to={PRO_NAV_ITEM.path}
            className={({ isActive }) =>
              "hidden items-center gap-1.5 rounded-2xl border border-primary/25 px-3.5 py-2.5 text-sm font-semibold transition-colors sm:inline-flex " +
              (isActive
                ? "bg-primary/10 text-primary"
                : "text-primary hover:bg-primary/[0.07]")
            }
          >
            <Sparkles className="h-3.5 w-3.5" />
            {PRO_NAV_ITEM.label}
          </NavLink>
          <Link
            to="/"
            className="hidden items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:scale-[1.02] sm:inline-flex"
            style={{ background: "var(--gradient-primary)" }}
          >
            Open the tool
          </Link>
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border/50 bg-card/40 text-muted-foreground lg:hidden"
            aria-label="Toggle navigation menu"
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <MotionNav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-border/20 lg:hidden"
            aria-label="Mobile"
          >
            <div className="mx-auto max-w-6xl px-5 py-4">
              <NavLink
                to={PRO_NAV_ITEM.path}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  "mb-4 flex items-center gap-2 rounded-xl border border-primary/25 px-3 py-2.5 text-sm font-semibold transition-colors " +
                  (isActive ? "bg-primary/10 text-primary" : "text-primary hover:bg-primary/[0.07]")
                }
              >
                <Sparkles className="h-3.5 w-3.5" />
                {PRO_NAV_ITEM.label} — Website Image Audit
              </NavLink>
              {NAV_GROUPS.map((group) => (
                <div key={group.label} className="mb-4">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/50">
                    {group.label}
                  </p>
                  <div className="grid grid-cols-1 gap-1">
                    {group.items.map((item) => (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => setOpen(false)}
                        className={({ isActive }) =>
                          "rounded-xl px-3 py-2 text-sm font-medium transition-colors " +
                          (isActive
                            ? "bg-primary/[0.08] text-primary"
                            : "text-muted-foreground hover:bg-primary/[0.04] hover:text-foreground")
                        }
                      >
                        {item.label}
                      </NavLink>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </MotionNav>
        )}
      </AnimatePresence>
    </header>
  );
}
