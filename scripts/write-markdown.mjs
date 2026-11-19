// Materialize the Markdown alternates already advertised in the HTML head.
import { JSDOM } from "jsdom";
import { writeFileSync } from "node:fs";
import path from "node:path";

export function writeMarkdown(outDir, route, html) {
  const base = "https://imagealchemy.app" + route.path;
  const document = new JSDOM(html).window.document;
  const main =
    document.querySelector("main") ?? document.querySelector("#root");
  const lines = [
    "# " + route.title,
    "",
    route.description,
    "",
    "Canonical: " + base,
    "",
  ];
  for (const el of main.querySelectorAll(
    "h2, h3, p, li, summary, .studio-faq details > p",
  )) {
    if (
      el.closest("nav, aside, button, .mobile-toc") ||
      el.querySelector("h2, h3, p, li")
    )
      continue;
    const copy = el.cloneNode(true);
    copy.querySelectorAll("a[href]").forEach((a) => {
      a.replaceWith(
        "[" +
          a.textContent.trim() +
          "](" +
          new URL(a.getAttribute("href"), base).href +
          ")",
      );
    });
    const text = copy.textContent.trim().replace(/\s+/g, " ");
    if (!text) continue;
    const prefix =
      { H2: "## ", H3: "### ", SUMMARY: "### ", LI: "- " }[el.tagName] ?? "";
    lines.push(prefix + text, "");
  }
  if (route.path === "/") writeFileSync(path.join(outDir, "index.md"), lines.join("\n"));
  writeFileSync(
    path.join(outDir, route.path.slice(1) + ".md"),
    lines.join("\n"),
  );
}
