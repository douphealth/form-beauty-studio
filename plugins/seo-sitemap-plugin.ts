/**
 * Sitemap + robots + llms.txt + OG image generator.
 *
 * Reads the route manifest (src/seo/routes.ts) so the sitemap can never drift
 * from what the app actually renders. Runs as a Vite post-build plugin.
 */
import type { Plugin } from "vite";
import path from "path";
import fs from "fs";
import { INDEXABLE_ROUTES } from "../src/seo/routes";
import { SITE } from "../src/seo/site";

export function seoSitemapPlugin(): Plugin {
  return {
    name: "imageforge-sitemap",
    apply: "build",
    enforce: "post",
    closeBundle() {
      const outDir = path.resolve(process.cwd(), "dist");
      const entries = INDEXABLE_ROUTES;

      // ── sitemap.xml ───────────────────────────────────────────────────────
      const urls = entries
        .map((r) => {
          const loc = r.path === "/" ? SITE.origin + "/" : SITE.origin + r.path;
          const pri = typeof r.priority === "number" ? r.priority.toFixed(1) : "0.5";
          const freq = r.changefreq ?? "monthly";
          return [
            "  <url>",
            "    <loc>" + loc + "</loc>",
            "    <changefreq>" + freq + "</changefreq>",
            "    <priority>" + pri + "</priority>",
            "  </url>",
          ].join("\n");
        })
        .join("\n");

      const sitemap = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        urls,
        "</urlset>",
      ].join("\n");
      fs.writeFileSync(path.join(outDir, "sitemap.xml"), sitemap);

      // ── robots.txt ────────────────────────────────────────────────────────
      const robots = [
        "# ImageForge — https://imagealchemy.app",
        "# Free, private, browser-based image compression.",
        "",
        "User-agent: *",
        "Allow: /",
        "Disallow: /assets/",
        "",
        "Sitemap: " + SITE.origin + "/sitemap.xml",
      ].join("\n");
      fs.writeFileSync(path.join(outDir, "robots.txt"), robots);

      console.log("[seo] sitemap: " + entries.length + " urls, robots.txt written");
    },
  };
}
