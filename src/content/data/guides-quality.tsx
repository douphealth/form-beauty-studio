import { type ReactNode } from "react";
import type { ContentEntry } from "../types";

const P = (children: ReactNode) => <p>{children}</p>;

/**
 * "What JPEG quality should I use?" — the highest-intent question in this niche.
 *
 * WHY THIS PAGE EXISTS
 * --------------------
 * The compressor exposes a 1-100 quality slider and the site never answered the
 * question the slider raises. That is simultaneously a conversion leak (an
 * unsure user leaves) and a missed AEO opportunity: this is a question people
 * type verbatim into search and into assistants, and the competing answers are
 * almost all a bare number with no reasoning.
 *
 * This page answers it with a rule, the reasoning behind the rule, a
 * per-format table, and a worked tradeoff the reader can explore. It is
 * deliberately specific — vague advice ("it depends") does not get quoted by
 * an answer engine and does not help a reader decide.
 *
 * HONESTY NOTE
 * ------------
 * The measured figures quoted here (q45 / q80 on the demo photo) come from
 * public/compare/meta.json, generated at build time. They are real encodes.
 * Where a number is a general industry range rather than our own measurement,
 * the text says so. Do not replace either with invented precision.
 */
export const GUIDE_CONTENT: Record<string, ContentEntry> = {
  "/learn/jpeg-quality-guide": {
    path: "/learn/jpeg-quality-guide",
    h1: "What JPEG quality should you use? The settings that actually work",
    lede: "Almost every compression guide answers this with a single number and no explanation. Here is the rule, the reasoning behind it, what changes per format, and the exact points where quality stops being worth the bytes.",
    keywords: [
      "what jpeg quality should i use",
      "jpeg quality settings",
      "image compression quality",
      "webp quality setting",
      "quality vs file size",
      "jpg quality 80",
    ],
    sections: [
      {
        id: "the-rule",
        heading: "The rule",
        body: [
          P(<>Use <strong>quality 75–85</strong> for almost everything. Within that band, the file size is still falling sharply while the visible quality cost is essentially nil on any normal display. Below 60 you are trading visible damage for bytes; above 90 you are paying for detail no screen will show.</>),
          P(<>If you want a single number to type: <strong>80</strong>. It is the most defensible default across JPEG, WebP and AVIF, and it is the point most professional pipelines converge on.</>),
          P(<>If you want the nuance, it is genuinely format-dependent and content-dependent — the rest of this page is the nuance, expressed as rules rather than adjectives.</>),
        ],
      },
      {
        id: "why-the-curve-bends",
        heading: "Why the curve bends — the one thing to understand",
        embed: "quality-explorer",
        body: [
          P(<>Compression quality and file size do not scale together. File size falls roughly <strong>logarithmically</strong> as you lower quality, while perceptual error grows <strong>slowly and then suddenly</strong>. That mismatch is the whole game.</>),
          P(<>In practice this creates three zones:</>),
          P(<><strong>Above ~90 — the waste zone.</strong> Files get noticeably bigger and nothing looks better. A JPEG at 95 and a JPEG at 100 are indistinguishable; the second can be twice the size. This is where the majority of unoptimized images on the web actually sit.</>),
          P(<><strong>75 to 88 — the sweet spot.</strong> The size curve is still descending fast and the quality cost stays under the threshold of normal perception. Almost every production image belongs here.</>),
          P(<><strong>Below ~60 — the damage zone.</strong> Error climbs steeply. Blocky artifacts appear in smooth gradients (skies, skin, studio backdrops) and along high-contrast edges. Defensible only for backgrounds and thumbnails.</>),
          P(<>On the demo image used on the home page, this is measurable rather than theoretical: the 189 KB source encodes to <strong>112 KB at q80 (−41%)</strong> and <strong>70 KB at q45 (−63%)</strong>. Moving from q45 to q80 costs 42 KB to remove artifacts that are visible at 100% zoom. That is the tradeoff the whole question is about.</>),
        ],
      },
      {
        id: "where-error-shows",
        heading: "Where artifacts show up first",
        body: [
          P(<>Quality thresholds are not universal — the same setting that is invisible on one image is obvious on another. Artifacts are a function of detail and smoothness, and they appear earliest in a predictable order:</>),
          P(<><strong>1. Smooth gradients.</strong> Skies, studio backdrops, fog and skin tones. There is no high-frequency detail to hide the error in, so banding and blotching appear immediately. If an image is mostly gradient, be careful below 70.</>),
          P(<><strong>2. Fine repeating texture.</strong> Foliage, hair, fabric weave, brick, gravel. The encoder discards exactly the detail your eye uses to recognise texture, and it does so before it discards anything else.</>),
          P(<><strong>3. Text and hard edges.</strong> Screenshots, charts, diagrams, UI captures. JPEG is structurally the wrong format for these — ringing around glyphs is unavoidable at low quality. Use PNG or WebP-lossless instead.</>),
          P(<><strong>4. Saturated colour.</strong> Highly saturated reds and oranges suffer first because chroma is subsampled. Banding on a sunset is usually chroma, not luma.</>),
          P(<>The practical consequence: <strong>compression tolerance is per-image, not per-site.</strong> A quality-80 blanket rule applied to a sky-heavy hero shot and a textured product photo will feel conservative on one and risky on the other.</>),
        ],
      },
      {
        id: "recommended-settings",
        heading: "Recommended settings by format",
        body: [
          P(<>These are starting points, not laws. They assume a photograph. Adjust with the "where artifacts show" section above.</>),
          P(<><strong>JPEG — 78 to 85.</strong> The classic range, and still correct. MozJPEG's improved encoder means you can sit at the lower end of that band than you could with a stock libjpeg encoder; roughly 10–15% smaller files at matched quality is the documented gain. Below 75 on a photographic JPEG, banding becomes a real risk.</>),
          P(<><strong>WebP — 75 to 82.</strong> WebP's lossy mode is more efficient than JPEG, so it can go lower for the same visual result. Quality 80 in WebP is broadly comparable to quality 85 in JPEG. It also handles transparency and animation, so it is often the format that lets you stop shipping a PNG.</>),
          P(<><strong>AVIF — 60 to 75.</strong> This surprises people. AVIF's quality scale is not calibrated to JPEG's — AVIF at 65 is frequently visually equivalent to JPEG at 80, at a smaller size. Encoding is slower, which is the real cost. If you set AVIF to 80 you are usually leaving significant savings on the table.</>),
          P(<><strong>PNG — lossless, no quality setting.</strong> Use the maximum optimisation effort (OxiPNG and similar tools re-encode losslessly for typically 10–30% off a naive PNG export). If you are reaching for a PNG quality slider, you probably want WebP instead.</>),
          P(<><strong>Screenshots, UI and diagrams — do not use lossy JPEG.</strong> Use PNG, or WebP in lossless mode. Text is the worst case for DCT-based compression and the artifacts are maximally visible.</>),
        ],
      },
      {
        id: "resolution-beats-quality",
        heading: "Resolution matters more than quality",
        body: [
          P(<>This is the most commonly missed point in the entire discussion. Lowering quality from 95 to 80 might cut 40% of the bytes. <strong>Resizing a 4000px image down to the 1600px it is actually displayed at can cut 80% or more — and improve sharpness.</strong></>),
          P(<>A 4000-pixel photo rendered into a 800-pixel slot is spending bytes on pixels nobody will ever see. Browsers have to download all of them and then discard three quarters of the detail during scaling. That is pure waste, and no quality setting can recover it.</>),
          P(<>The correct order of operations is therefore:</>),
          P(<><strong>1. Resize to the largest size it will actually be displayed at</strong> (accounting for 2× retina densities — so 1600px for an 800px slot).</>),
          P(<><strong>2. Choose the right format</strong> — AVIF or WebP for photographs, PNG or lossless for UI and text, SVG for logos and icons.</>),
          P(<><strong>3. Only then tune quality</strong> within the bands above.</>),
          P(<>Doing these out of order is why so many "optimized" sites are still slow. A beautifully-compressed 4000px JPEG is still a slow image.</>),
        ],
      },
      {
        id: "per-image-overrides",
        heading: "When to break the rule",
        body: [
          P(<><strong>Go lower (55–70)</strong> for: decorative background images behind text overlays, images displayed below the fold at small sizes, thumbnails and avatars, and photographic textures where the viewer is not inspecting detail. A 24px avatar at quality 90 is a waste of bytes.</>),
          P(<><strong>Go higher (85–92)</strong> for: the hero or LCP image where perceived sharpness drives conversion, product photography where colour accuracy and detail sell the item, anything with fine type, and portfolio or gallery work where the image <em>is</em> the product.</>),
          P(<><strong>Never go above 92</strong> for web delivery unless you have measured a reason. The file grows measurably and nothing visible changes. If you believe you need quality 100, you are almost certainly compensating for a resolution or format problem upstream.</>),
          P(<><strong>Go lossless</strong> for: images that will be re-edited later, anything with text or line art, and any image that will be re-compressed again downstream. Re-compressing an already-lossy image repeatedly is how sites end up with visible artifacts from a source that looked fine.</>),
        ],
      },
      {
        id: "test-it-on-your-own-image",
        heading: "Test it on your own image",
        body: [
          P(<>Generic advice has a ceiling, because the right answer depends on your specific image. The reliable method takes about thirty seconds:</>),
          P(<><strong>1.</strong> Encode at 80. Then encode again at 60.</>),
          P(<><strong>2.</strong> Open both at 100% zoom, side by side, on the display your audience actually uses.</>),
          P(<><strong>3.</strong> Look for banding in gradients and smearing in fine texture.</>),
          P(<><strong>4.</strong> Pick the lowest quality where you cannot see the difference without hunting for it. That is your number, and it will usually be lower than you expected.</>),
          P(<>You can do this in ImageAlchemy without uploading anything: drop the image, set the quality, and use the before/after comparison slider to inspect the result at full zoom. Because processing is client-side, you can iterate as many times as you like without the image ever leaving your machine.</>),
        ],
      },
      {
        id: "the-summary",
        heading: "The short version",
        body: [
          P(<><strong>Default:</strong> quality 80.</>),
          P(<><strong>By format:</strong> JPEG 78–85, WebP 75–82, AVIF 60–75, PNG lossless.</>),
          P(<><strong>Resize before you compress.</strong> It matters more than the quality setting, every time.</>),
          P(<><strong>Above 90 is almost always waste; below 60 is almost always visible damage.</strong></>),
          P(<><strong>Both panels of the tradeoff are measurable</strong> — use the quality explorer above, or test on your own image. Whatever you do, do not pick 100 "to be safe": that is how a site ends up shipping 400 KB images that could have been 90 KB with no perceptible difference.</>),
        ],
      },
    ],
    faqs: [
      {
        question: "What JPEG quality should I use for a website?",
        answer: "Use 78 to 85, with 80 as the safest single default. Within that band the file size is still falling sharply while the visible quality cost stays below the threshold of normal perception. Above 90 the files grow noticeably with no visible gain; below 60 you will see banding in gradients and smearing in fine detail.",
      },
      {
        question: "Is quality 80 or 100 better for JPEG?",
        answer: "Quality 80 for web delivery, essentially always. Quality 100 produces a substantially larger file with no visible difference on a normal display. If an image looks unacceptable at 80, the cause is usually the wrong format (JPEG for text or UI) or excessive resolution, not insufficient quality.",
      },
      {
        question: "What quality should I use for WebP and AVIF?",
        answer: "WebP: 75 to 82, since it is more efficient than JPEG at the same visual result. AVIF: 60 to 75 — its quality scale is not calibrated to JPEG's, and AVIF at 65 is often visually equivalent to JPEG at 80 at a smaller size. Setting AVIF to 80 usually leaves real savings unused.",
      },
      {
        question: "Does lowering image quality really reduce file size that much?",
        answer: "It reduces size logarithmically, not proportionally. On the demo image on this site, a 189 KB source encodes to 112 KB at quality 80 (a 41% reduction) and 70 KB at quality 45 (63%). The jump from 80 to 45 buys another 22 percentage points while introducing artifacts visible at 100% zoom.",
      },
      {
        question: "Should I resize or lower quality first?",
        answer: "Resize first, always. Dropping quality from 95 to 80 might save 40% of the bytes, but resizing a 4000px image to the 1600px it is actually displayed at can save 80% or more while making the image look sharper. A well-compressed oversized image is still a slow image.",
      },
      {
        question: "What quality should I use for PNG?",
        answer: "PNG is lossless — it has no quality setting, and any tool offering a PNG quality slider is applying lossy preprocessing. Use maximum lossless optimisation instead (OxiPNG and similar tools typically cut 10 to 30% from a naive PNG export). If you need to control quality, use WebP or AVIF rather than PNG.",
      },
      {
        question: "Why does my image still look bad after compressing at quality 80?",
        answer: "Two likely causes. First, the format is wrong for the content — JPEG is structurally poor for text, screenshots, logos and line art because ringing artifacts around hard edges are unavoidable; use PNG or lossless WebP instead. Second, you may be re-compressing an already-compressed image, which compounds artifacts. Always start from the highest-quality source you have.",
      },
    ],
    related: [
      { path: "/learn/image-optimization-guide", label: "Image optimization: the complete guide" },
      { path: "/learn/webp-vs-avif", label: "WebP vs AVIF: which format wins?" },
      { path: "/formats/jpeg", label: "JPEG compressor" },
      { path: "/glossary/chroma-subsampling", label: "What is chroma subsampling?" },
      { path: "/learn/reduce-image-file-size", label: "9 proven ways to reduce image file size" },
    ],
  },
};
