/**
 * SSR-safe motion wrappers.
 *
 * framer-motion attaches real DOM listeners and reads layout at render time,
 * which throws under React's server renderer. Every component imports motion
 * through here instead of "framer-motion" directly.
 *
 * Client: real framer-motion components. Server: plain DOM tags minus
 * motion-only props, so pre-rendered markup stays structurally identical and
 * hydrates cleanly.
 *
 * NOTE: use a *static* import, never require(). A bare require() is not
 * rewritten by the bundler and ships to the browser verbatim, where
 * `require is not defined` throws during client render and blanks the page.
 */
import { createElement, type ComponentType, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

type MotionTag =
  | "div" | "section" | "nav" | "a" | "span" | "p" | "button" | "li" | "ul" | "article";

const isServer =
  Boolean((globalThis as Record<string, unknown>).__PRERENDER) ||
  typeof window === "undefined";

/** Props framer-motion consumes but that mean nothing to a plain DOM element. */
const MOTION_PROPS = new Set([
  "initial", "animate", "exit", "transition", "variants", "whileHover",
  "whileTap", "whileFocus", "whileDrag", "whileInView", "viewport", "layout",
  "layoutId", "drag", "dragConstraints", "dragElastic", "dragMomentum",
  "dragSnapToOrigin", "dragTransition", "onDrag", "onDragStart", "onDragEnd",
  "onAnimationStart", "onAnimationComplete", "onUpdate", "onPan", "onTap",
  "onHoverStart", "onHoverEnd", "isRerendering", "custom", "inherit",
  "static", "presenceAffectsLayout", "lazy",
]);

function ServerMotion(tag: MotionTag): ComponentType<any> {
  const Component = ({ children, ...rest }: any) => {
    const cleaned: Record<string, unknown> = {};
    for (const key in rest) {
      if (!MOTION_PROPS.has(key)) cleaned[key] = rest[key];
    }
    return createElement(tag, cleaned, children);
  };
  return Component;
}

function makeMotion(tag: MotionTag): ComponentType<any> {
  if (isServer) return ServerMotion(tag);
  return motion[tag] as unknown as ComponentType<any>;
}

export const MotionDiv = makeMotion("div");
export const MotionSection = makeMotion("section");
export const MotionNav = makeMotion("nav");
export const MotionA = makeMotion("a");
export const MotionSpan = makeMotion("span");
export const MotionP = makeMotion("p");
export const MotionButton = makeMotion("button");
export const MotionLi = makeMotion("li");
export const MotionUl = makeMotion("ul");
export const MotionArticle = makeMotion("article");

/** Server: children without animation. Client: real AnimatePresence. */
export { AnimatePresence };
