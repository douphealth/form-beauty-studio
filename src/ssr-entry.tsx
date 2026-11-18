/**
 * SSR entry — a render-only view of the app for scripts/prerender.mjs.
 *
 * Never imported by the client bundle. Content pages render their full article
 * markup here, which is what crawlers and AI answer engines need. The home page
 * is emitted as static markup by prerender.mjs because its interactive tool
 * shell is hydration-only.
 *
 * Note on animations: every component imports motion through `@/lib/motion`,
 * which renders plain DOM tags on the server, so no framer-motion module scope
 * is ever evaluated during SSR.
 */
import { createElement } from "react";
import { StaticRouter } from "react-router-dom/server.js";
import { HelmetProvider } from "react-helmet-async";
import { renderToString } from "react-dom/server";
import ContentPage from "./content/ContentPage";

import SiteHeader from "./components/SiteHeader";
import SiteFooter from "./components/SiteFooter";
import StudioIntro from "./components/StudioIntro";
import StudioResources from "./components/StudioResources";
export { HOME_FAQS } from "./content/studio-faq";

export function renderHomeStatic() {
  return renderToString(<StaticRouter location="/"><SiteHeader /><main id="main-content" className="studio-container">
    <StudioIntro hasFiles={false} onFilesAdded={() => {}}/><StudioResources />
  </main><SiteFooter /></StaticRouter>);
}
export { ContentPage };

/** Render a content route to an HTML string, with the helmet head alongside. */
export function renderContentRoute(pathname: string) {
  const helmetContext: Record<string, unknown> = {};
  const html = renderToString(
    createElement(
      HelmetProvider,
      { context: helmetContext },
      createElement(
        StaticRouter,
        { location: pathname },
        createElement(ContentPage, { path: pathname })
      )
    )
  );
  return { html, helmet: helmetContext };
}

export default { ContentPage, renderContentRoute };
