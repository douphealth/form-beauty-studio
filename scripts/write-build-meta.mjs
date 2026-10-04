import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

function runGit(args) {
  try {
    return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

const sha =
  process.env.GITHUB_SHA ||
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.COMMIT_REF ||
  process.env.SOURCE_COMMIT ||
  process.env.LOVABLE_GIT_SHA ||
  runGit(["rev-parse", "HEAD"]) ||
  "unknown";

const branch =
  process.env.GITHUB_REF_NAME ||
  process.env.VERCEL_GIT_COMMIT_REF ||
  process.env.BRANCH ||
  runGit(["rev-parse", "--abbrev-ref", "HEAD"]) ||
  "unknown";

const meta = {
  app: "ImageAlchemy",
  release: "production",
  sha,
  shortSha: sha === "unknown" ? "unknown" : sha.slice(0, 12),
  branch,
  builtAt: new Date().toISOString(),
};

const publicDir = resolve("public");
mkdirSync(publicDir, { recursive: true });
writeFileSync(resolve(publicDir, "deploy-version.json"), JSON.stringify(meta, null, 2) + "\n");
writeFileSync(
  resolve(publicDir, "deploy-version.txt"),
  [
    "ImageAlchemy production build",
    `release: ${meta.release}`,
    `sha: ${meta.sha}`,
    `branch: ${meta.branch}`,
    `built: ${meta.builtAt}`,
    "",
  ].join("\n"),
);

console.log(`Build metadata: ${meta.shortSha} (${meta.branch})`);
