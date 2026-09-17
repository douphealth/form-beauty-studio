/**
 * Build the assets for the "See the difference" quality comparison.
 *
 * WHY THIS EXISTS AT ALL
 * ----------------------
 * The previous implementation drew two CSS gradients and clipped one with
 * `clip-path`. It could not demonstrate anything, for three compounding
 * reasons — recorded here so they are not reintroduced:
 *
 *   1. NO DETAIL TO COMPARE. Compression artifacts are a function of
 *      high-frequency detail — hair, feathers, foliage, fine text, fabric
 *      weave. A smooth gradient has almost none, so a q80 encode is visually
 *      indistinguishable from the source and the demo argued against its own
 *      claim.
 *   2. THE "ORIGINAL" LOOKED BROKEN. It was desaturated to 45% and darkened, so
 *      users read that panel as a failed image load, not an unoptimized one.
 *   3. NOTHING PROVED THE NUMBERS. A "−87%" badge sat beside a caption that
 *      conceded "both panels are the same image".
 *
 * WHAT IT PRODUCES
 * ----------------
 * A real photograph, encoded three ways at REAL quality settings, plus a
 * manifest of the measured byte sizes. The UI reads those sizes, so every
 * number on screen is a measurement of an actual file.
 *
 * SOURCE IMAGE + LICENCE
 * ----------------------
 * `assets/rhea-source.jpg` is "Erfurt - Thüringer Zoopark - Rhea americana 01"
 * from Wikimedia Commons, licensed CC BY-SA 3.0. A rhea's plumage is an ideal
 * test subject: dense overlapping feather filaments produce exactly the
 * high-frequency content that lossy codecs degrade first.
 *
 * The attribution string is written into `meta.json` AND surfaced in the UI,
 * because a CC BY-SA image must carry attribution where it is displayed.
 */
import fs from "fs";
import path from "path";
import { createRequire } from "module";

const require = createRequire(path.join(process.cwd(), "package.json"));
let sharp;
try {
  sharp = require("sharp");
} catch {
  console.error(
    "\nFATAL: `sharp` is required to build the comparison assets.\n" +
      "Install it as a dev dependency:  npm install -D sharp\n",
  );
  process.exit(1);
}

const root = path.resolve(process.cwd());
const sourcePath = path.join(root, "assets", "rhea-source.jpg");
const outDir = path.join(root, "public", "compare");
fs.mkdirSync(outDir, { recursive: true });

if (!fs.existsSync(sourcePath)) {
  console.error(`FATAL: source photograph not found at ${path.relative(root, sourcePath)}`);
  process.exit(1);
}

// Display size. 1400px wide is comfortably above the largest card width at 2x
// DPR, so the comparison is sharp on a retina screen without shipping a
// needlessly large file.
const W = 1400;
const H = 933; // 3:2, matching the card's aspect ratio exactly (no CLS)

// `position: "attention"` lets sharp pick the most detailed region rather than
// a blind centre crop — on a feather subject that is the difference between a
// compelling demo and a photo of empty grass.
const base = await sharp(sourcePath)
  .resize(W, H, { fit: "cover", position: "attention" })
  .toBuffer();

// The source a user would realistically arrive with: a good-quality JPEG.
// 4:4:4 chroma so the baseline is genuinely high quality and the comparison is
// fair — using a 4:2:0 source would inflate the apparent saving.
const originalJpg = await sharp(base)
  .jpeg({ quality: 92, chromaSubsampling: "4:4:4", mozjpeg: true })
  .toBuffer();

// What ImageAlchemy produces at its documented sensible default.
const optimisedWebp = await sharp(base).webp({ quality: 80, effort: 6 }).toBuffer();

// A deliberately aggressive setting, so the UI can show quality is a dial and
// let a visitor see where the tradeoff actually becomes visible.
const aggressiveWebp = await sharp(base).webp({ quality: 45, effort: 6 }).toBuffer();

fs.writeFileSync(path.join(outDir, "original.jpg"), originalJpg);
fs.writeFileSync(path.join(outDir, "optimised.webp"), optimisedWebp);
fs.writeFileSync(path.join(outDir, "aggressive.webp"), aggressiveWebp);

const pct = (a, b) => Math.round(((a - b) / a) * 100);
const kb = (b) => Math.round((b / 1024) * 10) / 10;

const meta = {
  width: W,
  height: H,
  originalBytes: originalJpg.length,
  optimisedBytes: optimisedWebp.length,
  aggressiveBytes: aggressiveWebp.length,
  optimisedSavingPct: pct(originalJpg.length, optimisedWebp.length),
  aggressiveSavingPct: pct(originalJpg.length, aggressiveWebp.length),
  credit: "Photo: Rainer Lippert, CC BY-SA 3.0, via Wikimedia Commons",
  creditUrl: "https://commons.wikimedia.org/wiki/File:Erfurt_-_Th%C3%BCringer_Zoopark_-_Rhea_americana_01.jpg",
};
fs.writeFileSync(path.join(outDir, "meta.json"), JSON.stringify(meta, null, 2) + "\n");

// ── Guards ────────────────────────────────────────────────────────────────
//
// The whole value of this asset set is that the saving is real. If a future
// change makes the "optimised" file larger, or collapses the difference, the
// demo becomes a lie — so fail the build rather than ship it.
if (meta.optimisedBytes >= meta.originalBytes) {
  console.error("FATAL: the optimised WebP is not smaller than the original JPEG");
  process.exit(1);
}
if (meta.optimisedSavingPct < 25) {
  console.error(
    `FATAL: only ${meta.optimisedSavingPct}% saving at q80 — the source lacks the detail ` +
      `needed to demonstrate compression. Pick a more detailed photograph.`,
  );
  process.exit(1);
}
if (meta.aggressiveBytes >= meta.optimisedBytes) {
  console.error("FATAL: the aggressive encode is not smaller than the balanced one");
  process.exit(1);
}

console.log(
  `[compare] original ${kb(meta.originalBytes)}KB -> webp q80 ${kb(meta.optimisedBytes)}KB ` +
    `(-${meta.optimisedSavingPct}%), q45 ${kb(meta.aggressiveBytes)}KB (-${meta.aggressiveSavingPct}%)`,
);
