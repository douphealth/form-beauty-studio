/**
 * Route → component resolution.
 *
 * Every content route renders through the single <ContentPage> component, which
 * looks the path up in the content index (src/content/index.ts). That means one
 * component serves all 20+ pages, and there is exactly one place to edit
 * content. No per-page module files to keep in sync.
 *
 * src/test/seo-consistency.test.tsx asserts that every route in
 * src/seo/routes.ts resolves to content in the index, so the manifest, the
 * router and the content can never drift.
 */
import { lazy } from "react";
import { ALL_ROUTES } from "../seo/routes";
import { CONTENT_INDEX } from "./index";

export const ContentPage = lazy(() => import("./ContentPage"));

/** Every route in the manifest has a matching content entry. */
export function everyRouteHasContent(): boolean {
  return ALL_ROUTES.every((r) => Boolean(CONTENT_INDEX[r.path]));
}
