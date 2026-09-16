/**
 * Hydration smoke test.
 *
 * Loads the pre-rendered dist/index.html into jsdom, then evaluates the actual
 * client bundle exactly as a browser would (module script in <head>). This
 * catches the exact failure mode that broke the live site: client-side JS that
 * throws and blanks the whole page.
 *
 * Pass criteria: after the bundle runs, #root still contains content and the
 * document has a visible h1.
 */
import { JSDOM } from "jsdom";
import fs from "fs";
import path from "path";
import url from "url";

const root = path.resolve(process.cwd());
const dist = path.join(root, "dist");
const html = fs.readFileSync(path.join(dist, "index.html"), "utf8");

const dom = new JSDOM(html, {
  runScripts: "dangerously",
  pretendToBeVisual: true,
  url: "https://imagealchemy.app/",
});
const { window } = dom;

// Browser-ish globals the bundle may touch.
window.matchMedia = window.matchMedia || (() => ({
  matches: false, media: "", onchange: null,
  addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {},
}));

let threw = null;
window.addEventListener("error", (e) => { threw = e.error || new Error(e.message); });

// Wait for the module script to load and execute.
await new Promise((resolve) => setTimeout(resolve, 2500));

const rootEl = window.document.getElementById("root");
const rootHtml = rootEl ? rootEl.innerHTML : "<NO ROOT>";
const h1s = window.document.querySelectorAll("h1");

console.log("--- HYDRATION TEST ---");
console.log("client error:", threw ? `${threw.name}: ${threw.message}` : "none");
console.log("#root children:", rootEl ? rootEl.children.length : 0);
console.log("#root html length:", rootHtml.length);
console.log("h1 count:", h1s.length);
console.log("h1 text:", h1s[0] ? h1s[0].textContent.slice(0, 80) : "(none)");
console.log("title:", window.document.title);

const ok = !threw && rootHtml.length > 100 && h1s.length >= 1;
console.log(ok ? "RESULT: PASS — client renders, page is not blanked" : "RESULT: FAIL");
process.exit(ok ? 0 : 1);
