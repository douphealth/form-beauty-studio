import { renderToStaticMarkup } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { it, expect } from "vitest";
import GuideFinder from "../components/GuideFinder";

it("renders direct guide links and honors a shared search", () => {
  function results(path: string) {
    const html = renderToStaticMarkup(<StaticRouter location={path}><GuideFinder /></StaticRouter>);
    return new DOMParser().parseFromString(html, "text/html");
  }
  expect(results("/learn").querySelectorAll("a")).toHaveLength(9);
  const matches = results("/learn?q=srcset").querySelectorAll("a");
  expect(matches).toHaveLength(1);
  expect(matches[0].getAttribute("href")).toBe("/learn/responsive-images");
  expect(results("/learn?q=no-such-guide").querySelector("button")?.textContent).toBe("Show all guides");
});
