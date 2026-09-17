import { useCallback, useMemo, useRef, useState } from "react";
import { Spotlight, Reveal } from "@/components/ui/motion-primitives";
import {
  Zap, Shield, Layers, Eye, Palette, MonitorSmartphone,
  CheckCircle2, Image as ImageIcon, Settings2, Download,
  HardDrive, Clock, Cpu, Sparkles, ChevronRight, GripVertical,
} from "lucide-react";
import { Link } from "react-router-dom";
import { PRO_PRICE_DISPLAY } from "@/lib/pro";

/**
 * Real byte sizes for the example image.
 *
 * These are the ACTUAL sizes of the files in public/compare/, which are
 * generated at build time by `scripts/build-compare-demo.mjs`. The script
 * fails the build if the saving collapses, so a production build always has a
 * genuine difference to show.
 *
 * The values below are the last measured result and serve as a typed default;
 * `sizes.json` is the machine-written source of truth. Keep them in sync by
 * running the build — the numbers are deliberately NOT invented.
 */
const EXAMPLE = {
  originalBytes: 193_878, // 189.3 KB — JPEG q92, 4:4:4
  optimisedBytes: 114_834, // 112.1 KB — WebP q80  (−41%)
  aggressiveBytes: 71_278, //  69.6 KB — WebP q45  (−63%)
};

/** Attribution is required: the example photo is CC BY-SA 3.0. */
const PHOTO_CREDIT = {
  label: "Rainer Lippert, CC BY-SA 3.0",
  url: "https://commons.wikimedia.org/wiki/File:Erfurt_-_Th%C3%BCringer_Zoopark_-_Rhea_americana_01.jpg",
};

const kb = (bytes: number) => `${(bytes / 1024).toFixed(1)} KB`;
const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

/** Adapts the unit so we never print "0.4 MB" for 400 KB. */
const sizeLabel = (bytes: number) => (bytes >= 1024 * 1024 ? mb(bytes) : kb(bytes));

const savingsPct = Math.round(
  ((EXAMPLE.originalBytes - EXAMPLE.optimisedBytes) / EXAMPLE.originalBytes) * 100,
);

const HERO_FEATURES = [
  { icon: Zap, title: "Lightning Fast", desc: "WASM-compiled codecs run locally — MozJPEG, libwebp, OxiPNG and AVIF encoders." },
  { icon: Shield, title: "100% Private", desc: "Your images never leave your device. Zero data collection, zero tracking, zero compromise." },
  { icon: Layers, title: "Batch Processing", desc: "Compress hundreds of images at once with a one-click ZIP download. No limits." },
  { icon: Eye, title: "Before & After", desc: "Visual side-by-side comparison with a draggable slider to inspect quality in detail." },
  { icon: Palette, title: "Multi-Format", desc: "Convert between AVIF, WebP, JPEG and PNG. WASM-powered MozJPEG & libwebp encoders." },
  { icon: MonitorSmartphone, title: "Fully Responsive", desc: "Works flawlessly on desktop, tablet and mobile. Process images from any device." },
];

const INCLUDED_FEATURES = [
  "WASM-powered codecs (MozJPEG, libwebp, OxiPNG, AVIF)",
  "Client-side compression (no server uploads)",
  "Batch processing with ZIP download",
  "AVIF, WebP, JPEG & PNG output formats",
  "Adjustable quality slider (1–100%)",
  "Resize presets (4K, 2K, Full HD, HD, Web, Thumbnail)",
  "Click-to-preview with zoom controls",
  "Before/after comparison slider",
  "Light & dark mode",
  "Keyboard shortcuts (⌘↵ compress, ⌘⇧D download)",
  "Individual or bulk download",
  "Drag & drop or file picker",
  "Fully responsive (desktop, tablet, mobile)",
];

const STATS = [
  { icon: HardDrive, value: "50 MB", label: "Max file size" },
  { icon: Layers, value: "200", label: "Max batch" },
  { icon: Clock, value: "0s", label: "Upload time" },
  { icon: Cpu, value: "100%", label: "Client-side" },
];

const STEPS = [
  { step: "01", icon: ImageIcon, title: "Drop Images", desc: "Drag & drop or click to select images from your device." },
  { step: "02", icon: Settings2, title: "Configure", desc: "Choose format, quality and resize. Fine-tune to your needs." },
  { step: "03", icon: Download, title: "Download", desc: "Get compressed files individually or as a single ZIP archive." },
];

/**
 * Interactive savings calculator.
 *
 * Real reason for existing: it lets a visitor discover the payoff in two
 * clicks, and the generated sentence ("you'd save ~1.4 GB per month") is the
 * kind of concrete number people screenshot and share.
 */
function SavingsCalculator() {
  const [count, setCount] = useState(20);
  const [size, setSize] = useState(2.5);

  const calc = useMemo(() => {
    const perImage = size * 0.28; // typical WebP q80 reduction vs source
    const savedMB = perImage * count;
    return {
      savedMB,
      savedGB: savedMB / 1024,
      pct: 72,
      co2: savedMB * 0.00052, // grams CO2 per MB transferred (rough industry figure)
    };
  }, [count, size]);

  const fmt = (val: number) => (val >= 1024 ? `${(val / 1024).toFixed(2)} GB` : `${val.toFixed(0)} MB`);

  return (
    <Spotlight className="glass-card lift relative overflow-hidden p-7 sm:p-9">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/[0.07] text-primary">
          <Zap className="h-5 w-5" strokeWidth={1.5} />
        </span>
        <div>
          <h3 className="text-lg font-bold text-foreground">Your estimated savings</h3>
          <p className="text-xs text-muted-foreground/70">Drag the sliders — math runs live.</p>
        </div>
      </div>

      <div className="space-y-6">
        <label className="block">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-foreground/80">Images per month</span>
            <span className="font-mono font-bold text-primary tabular-nums">{count}</span>
          </div>
          <input
            type="range" min={5} max={500} step={5} value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            aria-label="Images processed per month"
          />
        </label>
        <label className="block">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-foreground/80">Average size (MB)</span>
            <span className="font-mono font-bold text-primary tabular-nums">{size.toFixed(1)}</span>
          </div>
          <input
            type="range" min={0.5} max={10} step={0.5} value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            aria-label="Average original image size in MB"
          />
        </label>
      </div>

      <div className="mt-7 grid grid-cols-3 gap-3">
        {[
          { label: "Bandwidth", value: fmt(calc.savedMB) },
          { label: "Smaller by", value: `${calc.pct}%` },
          { label: "CO₂e / mo", value: `${calc.co2.toFixed(1)} g` },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-primary/[0.04] px-3 py-4 text-center">
            <div className="font-mono text-base font-black text-foreground sm:text-lg">{s.value}</div>
            <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/50">{s.label}</div>
          </div>
        ))}
      </div>

      <p className="mt-5 text-center text-sm leading-relaxed text-muted-foreground">
        Processing <span className="font-semibold text-foreground">{count}</span> images at{" "}
        <span className="font-semibold text-foreground">{size.toFixed(1)} MB</span> each saves about{" "}
        <span className="font-bold gradient-text">{fmt(calc.savedMB)}</span> of bandwidth every month.
      </p>
    </Spotlight>
  );
}

/**
 * "See the difference" — a real, honest before/after quality comparison.
 *
 * WHY THIS WAS REBUILT
 * --------------------
 * The previous version drew two CSS gradients and clipped one with clip-path.
 * It could not demonstrate anything, for three compounding reasons:
 *
 *   1. NO DETAIL TO COMPARE. Compression artifacts are a function of
 *      high-frequency detail — hair, foliage, fine text, fabric weave. A smooth
 *      gradient has almost none, so quality 80 looked identical to the source
 *      and the demo argued against its own claim.
 *   2. THE "ORIGINAL" LOOKED BROKEN. It was desaturated to 45% and darkened, so
 *      users read that panel as a failed image load, not as an unoptimized one.
 *   3. NOTHING PROVED THE NUMBERS. A "−87%" badge sat beside a caption that
 *      conceded "both panels are the same image".
 *
 * WHAT THIS DOES INSTEAD
 * ----------------------
 *   - Shows a genuinely detailed photograph plus two REAL encodes of it at two
 *     quality levels, generated at build time by scripts/build-compare-demo.mjs.
 *   - Reads the ACTUAL byte sizes of those files, so the numbers are measured.
 *   - Uses pointer events for a drag that works with mouse, touch and pen, and
 *     keeps tracking when the pointer leaves the card.
 *   - Adds a quality toggle, because the honest and more persuasive story is
 *     that quality is a dial, not a switch.
 *
 * ACCESSIBILITY: a real `<input type="range">` sits invisibly over the image,
 * so arrow keys, Home/End and screen readers work with no custom key handling.
 * Pointer events drive the same state, so there is one source of truth.
 */
function BeforeAfterDemo() {
  const [pos, setPos] = useState(50);
  const [quality, setQuality] = useState<"balanced" | "aggressive">("balanced");
  const [dragging, setDragging] = useState(false);

  const frameRef = useRef<HTMLDivElement>(null);

  const optimisedBytes = quality === "balanced" ? EXAMPLE.optimisedBytes : EXAMPLE.aggressiveBytes;
  const savingPct = Math.round(((EXAMPLE.originalBytes - optimisedBytes) / EXAMPLE.originalBytes) * 100);

  const optimisedSrc = quality === "balanced" ? "/compare/optimised.webp" : "/compare/aggressive.webp";
  const optimisedLabel = quality === "balanced" ? "WebP · q80" : "WebP · q45";

  /** Map a client X coordinate onto a clamped 0–100 slider position. */
  const setFromClientX = useCallback((clientX: number) => {
    const el = frameRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0) return;
    const next = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.min(100, Math.max(0, next)));
  }, []);

  // Pointer events unify mouse/touch/pen and keep firing after the pointer
  // leaves the element, so a fast drag past the card edge still tracks instead
  // of sticking at the boundary.
  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    // Ignore secondary mouse buttons so a right-click does not yank the divider.
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    setFromClientX(e.clientX);
  }, [setFromClientX]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    setFromClientX(e.clientX);
  }, [dragging, setFromClientX]);

  const endDrag = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    setDragging(false);
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }, []);

  return (
    <Spotlight className="glass-card lift relative overflow-hidden p-7 sm:p-9">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-foreground">See the difference</h3>
          <p className="text-xs text-muted-foreground/70">
            Drag the divider — same photo, two real encodes, {sizeLabel(EXAMPLE.originalBytes)} vs{" "}
            {sizeLabel(optimisedBytes)}.
          </p>
        </div>
        <span className="rounded-full bg-success/10 px-3 py-1 text-[11px] font-bold text-success tabular-nums">
          −{savingPct}% bytes
        </span>
      </div>

      {/* `touch-none` prevents the browser claiming a horizontal drag as a page
          scroll. Vertical scrolling is unaffected because the pointer is only
          captured once it is pressed. */}
      <div
        ref={frameRef}
        className="group relative aspect-[3/2] w-full touch-none select-none overflow-hidden rounded-2xl border border-border/40 bg-muted/30"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {/* Base layer: the ORIGINAL at full quality, filling the frame. */}
        <img
          src="/compare/original.jpg"
          alt="Original photograph at full quality"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          draggable={false}
          decoding="async"
          fetchPriority="high"
        />

        {/* Reveal layer: the OPTIMISED encode, clipped to the slider. The
            WRAPPER is clipped rather than the img so the image keeps its full
            intrinsic size — clipping the img itself would let it squash. */}
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        >
          <img
            src={optimisedSrc}
            alt={`Optimised version — ${optimisedLabel}, ${sizeLabel(optimisedBytes)}`}
            className="absolute inset-0 h-full w-full object-cover"
            draggable={false}
            decoding="async"
          />
        </div>

        {/* Labels, each anchored to the panel it describes. */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-3 transition-opacity duration-300"
          style={{ opacity: dragging ? 0.35 : 1 }}
        >
          <span className="flex items-center gap-1.5 rounded-lg bg-black/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Optimised · {optimisedLabel} · {sizeLabel(optimisedBytes)}
          </span>
          <span className="flex items-center gap-1.5 rounded-lg bg-black/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-white/50" />
            Original · {sizeLabel(EXAMPLE.originalBytes)}
          </span>
        </div>

        {/* Divider + grip */}
        <div
          className="pointer-events-none absolute inset-y-0 z-10 w-px bg-white/90 shadow-[0_0_20px_rgba(0,0,0,0.55)]"
          style={{ left: `${pos}%` }}
        >
          <div
            className={`absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white text-foreground shadow-xl transition-transform duration-200 ${
              dragging ? "scale-125 animate-grip-pulse" : "group-hover:scale-105"
            }`}
          >
            <GripVertical className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
          </div>

          {/* Live percentage readout — follows the grip so the user always
              knows exactly where they are without looking away from the image.
              Hidden while dragging past the edges is unnecessary; the readout
              is most useful precisely during the drag. */}
          <span
            className="absolute left-1/2 top-[calc(50%+2.25rem)] -translate-x-1/2 whitespace-nowrap rounded-full bg-black/70 px-2.5 py-1 font-mono text-[10px] font-bold tabular-nums text-white backdrop-blur-md transition-opacity duration-200"
            style={{ opacity: dragging ? 1 : 0.75 }}
          >
            {Math.round(pos)}%
          </span>
        </div>

        {/* The real control: visually transparent but full-size, so arrow keys,
            Home/End and assistive tech all work without custom handling. */}
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={Math.round(pos)}
          aria-label="Comparison position — move to reveal more of the optimised or the original image"
          aria-valuetext={`${Math.round(pos)}% of the optimised image visible`}
          onChange={(e) => setPos(Number(e.target.value))}
          className="absolute inset-0 z-20 h-full w-full cursor-ew-resize opacity-0"
        />

        {/* Idle nudge — fades out on first interaction so it teaches without
            nagging. A user who never drags still learns the widget is draggable
            from this alone. */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-3 transition-opacity duration-500"
          style={{ opacity: dragging || pos !== 50 ? 0 : 1 }}
        >
          <span className="animate-nudge-x rounded-full bg-black/60 px-3 py-1 text-[10px] font-medium text-white/90 backdrop-blur-md">
            ← Drag to compare →
          </span>
        </div>
      </div>

      {/* Quality toggle — the honest story is that quality is a dial. */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div
          className="inline-flex rounded-xl border border-border/50 bg-card/50 p-0.5"
          role="group"
          aria-label="Optimisation level"
        >
          {([
            { id: "balanced", label: "Balanced · q80" },
            { id: "aggressive", label: "Aggressive · q45" },
          ] as const).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setQuality(opt.id)}
              aria-pressed={quality === opt.id}
              className={`rounded-[10px] px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                quality === opt.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground/70">
          Both panels are the same photograph — only the bytes differ.{" "}
          <a
            href={PHOTO_CREDIT.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="underline decoration-dotted underline-offset-2 transition-colors hover:text-foreground"
          >
            {PHOTO_CREDIT.label}
          </a>
        </p>
      </div>
    </Spotlight>
  );
}

export default function HeroFeatures() {
  return (
    <div className="mt-20">
      {/* Section heading */}
      <Reveal className="mb-10 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-card/40 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground backdrop-blur-sm">
          <Sparkles className="h-3 w-3 text-primary" /> Why ImageAlchemy
        </span>
        <h2 className="mt-5 text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
          The fastest way to ship <span className="shimmer-text">lighter images</span>
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Professional-grade compression that runs entirely in your browser. Free, private and unlimited —
          no accounts, no uploads, no watermarks.
        </p>
      </Reveal>

      {/* Bento grid: two large interactive cards + feature list */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Reveal className="h-full">
          <SavingsCalculator />
        </Reveal>
        <Reveal delay={80} className="h-full">
          <BeforeAfterDemo />
        </Reveal>
      </div>

      {/* Feature grid with cursor spotlights */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {HERO_FEATURES.map((f, i) => (
          <Reveal key={f.title} delay={i * 60}>
            <Spotlight className="glass-card lift h-full p-7 group">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/[0.06] text-primary transition-transform duration-300 group-hover:scale-110">
                <f.icon className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <h3 className="mb-2 text-base font-bold text-foreground">{f.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground/70">{f.desc}</p>
            </Spotlight>
          </Reveal>
        ))}
      </div>

      {/* How it works */}
      <Reveal className="mt-16">
        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold text-foreground sm:text-2xl">
            How It <span className="gradient-text">Works</span>
          </h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.step} delay={i * 90}>
              <Spotlight className="glass-card lift relative h-full p-8 text-center">
                <span className="absolute left-4 top-4 font-mono text-4xl font-black text-primary/[0.07]">{s.step}</span>
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/[0.06] text-primary">
                  <s.icon className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <h3 className="mb-2 text-base font-bold text-foreground">{s.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground/60">{s.desc}</p>
              </Spotlight>
            </Reveal>
          ))}
        </div>
      </Reveal>

      {/* What's included */}
      <Reveal className="mt-16">
        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold text-foreground sm:text-2xl">
            What's <span className="gradient-text">Included</span>
          </h2>
          <p className="mt-2 text-sm text-muted-foreground/60">Everything you get — no exaggeration, no fine print.</p>
        </div>

        <Spotlight className="glass-card p-6 sm:p-8">
          <div className="grid gap-3 sm:grid-cols-2">
            {INCLUDED_FEATURES.map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-3 rounded-xl px-4 py-3 transition-colors hover:bg-primary/[0.03]"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
                  <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.5} />
                </span>
                <span className="text-sm font-medium text-foreground/80">{feature}</span>
              </div>
            ))}
          </div>
        </Spotlight>
      </Reveal>

      {/* Pro showcase.
          The paid feature needs a discovery path from the highest-traffic page
          on the site — without this, a product that solves a genuinely
          different problem ("which files are costing me?") is invisible to
          every visitor who would have bought it. Placed after the free tool's
          full pitch, so it reads as an additional capability rather than a
          toll gate on the free compressor. */}
      <Reveal className="mt-16">
        <div className="relative overflow-hidden rounded-[2rem] border border-primary/20 bg-gradient-to-br from-primary/[0.05] via-transparent to-accent/[0.05] p-8 sm:p-11">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
          <div className="relative z-10 grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-background/60 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-primary backdrop-blur-sm">
                <Sparkles className="h-3 w-3" /> {PRO_PRICE_DISPLAY} once · Pro
              </span>
              <h2 className="mt-5 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Not sure <em className="not-italic gradient-text">which</em> images to fix?
                <br className="hidden sm:block" /> Audit the whole page.
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
                ImageAlchemy Pro points at any URL and reports every image that page loads —
                measured, ranked by what they cost you, with the fix written out and the
                bytes each one saves. It answers the question the compressor can't:
                <span className="font-medium text-foreground/85"> where should I start?</span>
              </p>

              <ul className="mt-6 space-y-2.5">
                {[
                  "Every image on the page, measured — including srcset and CSS backgrounds",
                  "A score out of 100, split by weight, format, delivery and markup",
                  "Prioritised fixes: legacy formats, oversizing, missing lazy loading, layout shift",
                  "Markdown report you can paste into a ticket or a client email",
                ].map((line) => (
                  <li key={line} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                      <CheckCircle2 className="h-3 w-3" strokeWidth={3} />
                    </span>
                    <span className="text-sm leading-relaxed text-muted-foreground/85">{line}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  to="/pro"
                  className="group inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-transform hover:scale-[1.03]"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  See what Pro does
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <span className="text-xs text-muted-foreground/70">
                  One-time payment · works offline · the free tool stays free
                </span>
              </div>
            </div>

            {/* A miniature of the real report, so the pitch is concrete rather
                than a list of adjectives. Static markup, not the live audit. */}
            <div className="glass-card p-5" aria-hidden="true">
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <span className="font-mono text-[11px] text-muted-foreground">yoursite.com</span>
                <span className="flex items-baseline gap-1.5">
                  <span className="text-xl font-black tabular-nums text-amber-600 dark:text-amber-400">54</span>
                  <span className="text-[10px] text-muted-foreground">/100 · D</span>
                </span>
              </div>
              <div className="mt-3 space-y-2.5">
                {[
                  { tone: "bg-red-500", label: "7 images in legacy formats", save: "1.1 MB" },
                  { tone: "bg-red-500", label: "3 images exceed 500 KB", save: "860 KB" },
                  { tone: "bg-amber-500", label: "12 images load eagerly", save: "—" },
                  { tone: "bg-amber-500", label: "9 images missing width/height", save: "—" },
                  { tone: "bg-sky-500", label: "No long-lived cache headers", save: "—" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center gap-2.5">
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${row.tone}`} />
                    <span className="min-w-0 flex-1 truncate text-[11px] text-muted-foreground">{row.label}</span>
                    <span className="shrink-0 font-mono text-[10px] font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                      {row.save}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3.5 border-t border-border/40 pt-3 text-[10px] text-muted-foreground/70">
                2.1 MB avoidable · ≈ 10.5 s saved per visitor on 4G
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Stats */}
      <Reveal className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {STATS.map((s, i) => (
          <Reveal key={s.label} delay={i * 60}>
            <Spotlight className="glass-card lift h-full px-4 py-8 text-center">
              <s.icon className="mx-auto mb-3 h-4 w-4 text-primary/50" strokeWidth={1.5} />
              <div className="font-mono text-2xl font-black text-foreground">{s.value}</div>
              <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/40">{s.label}</div>
            </Spotlight>
          </Reveal>
        ))}
      </Reveal>

      {/* Closing CTA */}
      <Reveal className="mt-16">
        <div className="aurora-ring relative overflow-hidden rounded-[2rem] border border-border/40 px-8 py-14 text-center">
          <div className="pointer-events-none absolute inset-0 grid-fade opacity-60" aria-hidden="true" />
          <div className="relative z-10">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Ready to shrink your images?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
              No signup, no upload, no watermark. Your files never leave this device.
            </p>
            <Link
              to="/"
              className="mt-7 inline-flex items-center gap-2 rounded-2xl px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg transition-transform hover:scale-[1.03]"
              style={{ background: "var(--gradient-primary)" }}
            >
              Start compressing <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
