import { type ReactNode } from "react";

export interface ContentSection {
  id: string;
  heading: string;
  body: ReactNode[];
  /**
   * Interactive component to render after this section's prose.
   *
   * Why a named slot rather than letting content modules import components
   * directly: content modules are plain data files read by the prerender step
   * and the parity test, both of which run outside the React render tree. If a
   * content module imported a component, those tools would have to resolve the
   * component graph too. A string key resolved in ContentPage keeps content as
   * data and rendering as rendering.
   *
   * The key must exist in EMBEDDED_COMPONENTS in ContentPage.tsx, and
   * scripts/test-content.mjs asserts that it does — so a typo fails the build
   * rather than silently rendering nothing.
   */
  embed?: string;
}

export interface ContentEntry {
  path: string;
  h1: string;
  lede: ReactNode;
  keywords: string[];
  sections: ContentSection[];
  faqs: { question: string; answer: string }[];
  related: { path: string; label: string }[];
}
