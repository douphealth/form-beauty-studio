import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MotionDiv, MotionSection, MotionNav, MotionA, MotionSpan, MotionP, MotionButton, MotionLi } from "@/lib/motion";

export interface TocItem {
  id: string;
  text: string;
}

/**
 * Sticky table of contents with scroll-spy. Watches the headings on the page,
 * highlights the section the reader is in, and deep-links via #anchors so
 * individual sections are shareable — good for dwell time and for crawlers
 * parsing document structure.
 */
export default function TableOfContents({ items, className = "" }: { items: TocItem[]; className?: string }) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? "");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-100px 0px -70% 0px", threshold: [0, 1] }
    );
    const ids = items.map((i) => i.id);
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [items]);

  if (!items.length) return null;

  return (
    <nav aria-label="Table of contents" className={"hidden lg:block " + className}>
      <div className="sticky top-24">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/50">
          On this page
        </p>
        <ul className="flex flex-col gap-1 border-l border-border/30">
          {items.map((item) => {
            const active = activeId === item.id;
            return (
              <li key={item.id}>
                <Link
                  to={"#" + item.id}
                  className="relative block border-l-2 py-1.5 pl-4 text-xs font-medium transition-colors"
                  style={active ? { color: "hsl(var(--primary))", borderColor: "hsl(var(--primary))" } : { color: "hsl(var(--muted-foreground) / 0.7)", borderColor: "transparent" }}
                >
                  {item.text}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
