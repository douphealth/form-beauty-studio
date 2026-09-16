/**
 * Cursor-tracking spotlight + scroll reveal.
 *
 * Why plain CSS classes and not a JS animation library:
 * the transform/opacity work is done by the GPU compositor via CSS transitions,
 * so the main thread only writes two custom properties on pointermove and
 * toggles one class when a card enters the viewport. No per-frame React state.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";

/** Element whose background glow follows the pointer. */
export function Spotlight({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
      el.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
    };
    el.addEventListener("pointermove", onMove);
    return () => el.removeEventListener("pointermove", onMove);
  }, []);

  const Component = Tag as any;
  return (
    <Component ref={ref} className={`spotlight ${className}`}>
      {children}
    </Component>
  );
}

/**
 * Reveals children when they scroll into view.
 *
 * `stagger` spaces the entrance so a grid of cards cascades instead of
 * arriving as one block. If IntersectionObserver is unavailable (older
 * browsers, SSR) the content is shown immediately — never hidden by default.
 */
export function Reveal({
  children,
  className = "",
  delay = 0,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  /** Entrance delay in ms. */
  delay?: number;
  as?: keyof JSX.IntrinsicElements;
}) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const Component = Tag as any;
  return (
    <Component
      ref={ref}
      className={`reveal ${shown ? "in-view" : ""} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Component>
  );
}
