import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { MotionDiv, MotionSection, MotionNav, MotionA, MotionSpan, MotionP, MotionButton, MotionLi, AnimatePresence } from "@/lib/motion";
import { Sparkles, Menu, X } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { NAV_GROUPS } from "../seo/site";

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-border/30 bg-background/50 backdrop-blur-3xl backdrop-saturate-150">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
        <Link to="/" className="flex items-center gap-3">
          <MotionDiv
            whileHover={{ rotate: 8, scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400 }}
            className="flex h-10 w-10 items-center justify-center rounded-2xl text-primary-foreground shadow-lg"
            style={{ background: "var(--gradient-primary)" }}
            aria-hidden="true"
          >
            <Sparkles className="h-5 w-5" strokeWidth={2} />
          </MotionDiv>
          <span className="flex flex-col">
            <span className="gradient-text text-base font-bold tracking-tight sm:text-lg">ImageForge</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Compression Studio
            </span>
          </span>
        </Link>
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="group relative">
              <button
                type="button"
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-primary/[0.06] hover:text-foreground"
              >
                {group.label}
              </button>
              <div className="invisible absolute left-1/2 top-full z-50 w-64 -translate-x-1/2 pt-2 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100">
                <div className="glass-card overflow-hidden rounded-2xl p-2 shadow-2xl">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        "block rounded-xl px-3 py-2 text-sm font-medium transition-colors " +
                        (isActive ? "bg-primary/[0.08] text-primary" : "text-muted-foreground hover:bg-primary/[0.04] hover:text-foreground")
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </nav>
        <div className="flex items-center gap-2">
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
                          (isActive ? "bg-primary/[0.08] text-primary" : "text-muted-foreground hover:bg-primary/[0.04] hover:text-foreground")
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
