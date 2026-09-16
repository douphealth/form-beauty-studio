/**
 * Generates the social preview (Open Graph / Twitter) image at build time.
 * Renders a 1200x630 canvas in the brand's visual language — no design tools
 * or external services required, and it self-hosts at /og-image.png.
 *
 * Run: node scripts/build-og.mjs
 */
import path from "path";
import fs from "fs";

const W = 1200;
const H = 630;

// SVG is trivially composable; we rasterize to PNG at the end.
function svg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0b0a14"/>
      <stop offset="55%" stop-color="#14101f"/>
      <stop offset="100%" stop-color="#1c0f2b"/>
    </linearGradient>
    <linearGradient id="brand" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#7c3aed"/>
      <stop offset="100%" stop-color="#c026d3"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#f97316"/>
      <stop offset="100%" stop-color="#f43f5e"/>
    </linearGradient>
    <radialGradient id="glow1" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="#7c3aed" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#7c3aed" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow2" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="#f97316" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="#f97316" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <circle cx="140" cy="120" r="380" fill="url(#glow1)"/>
  <circle cx="1080" cy="540" r="360" fill="url(#glow2)"/>

  <!-- Brand mark -->
  <rect x="72" y="66" width="72" height="72" rx="20" fill="url(#brand)"/>
  <path d="M108 84 l16 34 -16 -8 -16 8 z" fill="#ffffff" opacity="0.95"/>

  <text x="164" y="116" font-family="'Space Grotesk','Segoe UI',sans-serif" font-size="30" font-weight="700" fill="#f4f2fb" letter-spacing="0.5">ImageForge</text>

  <!-- Headline -->
  <text x="72" y="270" font-family="'Space Grotesk','Segoe UI',sans-serif" font-size="76" font-weight="700" fill="#ffffff" letter-spacing="-2">Compress images.</text>
  <text x="72" y="352" font-family="'Space Grotesk','Segoe UI',sans-serif" font-size="76" font-weight="700" fill="url(#accent)" letter-spacing="-2">Keep the quality.</text>

  <!-- Subline -->
  <text x="72" y="430" font-family="'Space Grotesk','Segoe UI',sans-serif" font-size="29" font-weight="500" fill="#a89fc4">WebP · AVIF · JPEG · PNG — free, private, unlimited batch compression</text>

  <!-- Format pills -->
  <g font-family="'JetBrains Mono',monospace" font-size="20" font-weight="600">
    <rect x="72"  y="480" width="116" height="48" rx="24" fill="#ffffff" fill-opacity="0.06" stroke="#7c3aed" stroke-opacity="0.55"/>
    <text x="98"  y="511" fill="#c4b5fd">AVIF</text>
    <rect x="204" y="480" width="116" height="48" rx="24" fill="#ffffff" fill-opacity="0.06" stroke="#7c3aed" stroke-opacity="0.55"/>
    <text x="230" y="511" fill="#c4b5fd">WebP</text>
    <rect x="336" y="480" width="116" height="48" rx="24" fill="#ffffff" fill-opacity="0.06" stroke="#7c3aed" stroke-opacity="0.55"/>
    <text x="362" y="511" fill="#c4b5fd">JPEG</text>
    <rect x="468" y="480" width="110" height="48" rx="24" fill="#ffffff" fill-opacity="0.06" stroke="#7c3aed" stroke-opacity="0.55"/>
    <text x="492" y="511" fill="#c4b5fd">PNG</text>
  </g>

  <!-- Privacy badge -->
  <g>
    <rect x="72" y="556" width="280" height="46" rx="23" fill="#0e2a1f" stroke="#10b981" stroke-opacity="0.5"/>
    <circle cx="102" cy="579" r="5" fill="#34d399"/>
    <text x="120" y="586" font-family="'Space Grotesk','Segoe UI',sans-serif" font-size="20" font-weight="600" fill="#6ee7b7">100% in-browser</text>
  </g>

  <!-- Domain -->
  <text x="${W - 72}" y="596" text-anchor="end" font-family="'JetBrains Mono',monospace" font-size="21" fill="#8d84ab">imagealchemy.app</text>
</svg>`;
}

const out = process.cwd();
const distDir = path.join(out, "dist");
fs.mkdirSync(distDir, { recursive: true });
const svgPath = path.join(distDir, "og-image.svg");
fs.writeFileSync(svgPath, svg());

// Prefer sharp if available for PNG; otherwise ship the SVG (works for OG on
// most platforms) and log a hint.
try {
  const sharp = (await import("sharp")).default;
  await sharp(Buffer.from(svg())).png().toFile(path.join(distDir, "og-image.png"));
  console.log("[seo] wrote dist/og-image.png (1200x630)");
} catch {
  console.log("[seo] wrote dist/og-image.svg — install 'sharp' to emit PNG");
}
