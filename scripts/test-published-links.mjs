// Preserve per-page destinations, including query strings and section links.
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import { JSDOM } from "jsdom";

const fixture = JSON.parse(
  readFileSync(new URL("./fixtures/published-links.json", import.meta.url)),
);
const docs = new Map();
const root = path.resolve("dist");
for (const route of Object.keys(fixture.routes)) {
  docs.set(
    route,
    new JSDOM(readFileSync(path.join(root, route, "index.html"), "utf8")).window
      .document,
  );
}
let checked = 0;
for (const [route, expected] of Object.entries(fixture.routes)) {
  const doc = docs.get(route);
  const links = new Set(
    [...doc.querySelectorAll("a[href]")].map((link) =>
      link.getAttribute("href"),
    ),
  );
  for (const href of [
    ...(expected.usesArticleNav ? fixture.articleNav : []),
    ...expected.links,
  ]) {
    assert(links.has(href), route + " lost " + href);
    const target = new URL(href, "https://imagealchemy.app" + route);
    if (target.hostname === "imagealchemy.app" && target.hash) {
      assert(
        docs
          .get(target.pathname)
          ?.getElementById(decodeURIComponent(target.hash.slice(1))),
        "Missing target: " + href,
      );
    }
    checked++;
  }
  const alternate = doc.querySelector(
    'link[rel="alternate"][type="text/markdown"]',
  );
  const md = readFileSync(
    path.join(root, new URL(alternate.href).pathname),
    "utf8",
  );
  assert(md.startsWith("# " + doc.title), "Missing Markdown for " + route);
}
for (const [file, bytes] of Object.entries({
  "alaska-range.jpg": 215293,
  "alaska-range-q30.webp": 47558,
  "alaska-range-q65.webp": 83314,
  "alaska-range-q85.webp": 133656,
})) {
  assert.equal(
    statSync(path.join(root, "studio-demo", file)).size,
    bytes,
    file + " comparison readout is stale",
  );
}
console.log(
  "Preserved " +
    checked +
    " published link destinations across " +
    docs.size +
    " paths.",
);
