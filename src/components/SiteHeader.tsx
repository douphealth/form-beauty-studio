import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { ChevronDown, Menu, X, ScanLine } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { NAV_GROUPS, PRO_NAV_ITEM } from "../seo/site";

export default function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [groupOpen, setGroupOpen] = useState("");
  const header = useRef<HTMLElement>(null);
  const { pathname } = useLocation();
  const close = () => {
    setMobileOpen(false);
    setGroupOpen("");
  };

  useEffect(close, [pathname]);
  useEffect(() => {
    const outside = (e: PointerEvent) => {
      if (!header.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, []);

  return (
    <header
      ref={header}
      className="studio-header"
      onKeyDown={(e) => {
        if (e.key !== "Escape") return;
        const trigger = header.current?.querySelector<HTMLButtonElement>(
          groupOpen ? "[data-group][aria-expanded=true]" : ".nav-toggle",
        );
        close();
        trigger?.focus();
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) close();
      }}
    >
      <a className="skip-nav" href="#main-content">
        Skip to content
      </a>
      <div className="studio-bar">
        <Link to="/" className="studio-brand">
          <img src="/brand-mark.svg" width="36" height="36" alt="" />
          ImageAlchemy
        </Link>
        <nav
          id="primary-nav"
          aria-label="Primary"
          className={mobileOpen ? "studio-menu open" : "studio-menu"}
        >
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="nav-group">
              <button
                type="button"
                data-group=""
                aria-expanded={groupOpen === group.label}
                aria-controls={"nav-" + group.label}
                onClick={() =>
                  setGroupOpen(groupOpen === group.label ? "" : group.label)
                }
              >
                {group.label}
                <ChevronDown size={14} />
              </button>
              <div
                id={"nav-" + group.label}
                hidden={groupOpen !== group.label}
                className="studio-dropdown"
              >
                {group.items.map((item) => (
                  <NavLink key={item.path} end to={item.path} onClick={close}>
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="studio-bar-actions">
          <NavLink to={PRO_NAV_ITEM.path} className="audit-link">
            <ScanLine size={17} />
            <span>Image audit</span>
          </NavLink>
          <ThemeToggle />
          <button
            type="button"
            className="nav-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Navigation menu"
            aria-controls="primary-nav"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>
    </header>
  );
}
