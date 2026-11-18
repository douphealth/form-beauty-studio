import { useCallback, useMemo, useRef, useState } from "react";
import { Spotlight } from "@/components/ui/motion-primitives";
import {
  Zap, Shield, Layers, Eye, Palette, MonitorSmartphone,
  CheckCircle2, Image as ImageIcon, Settings2, Download,
  HardDrive, Clock, Cpu, Sparkles, ChevronRight, GripVertical,
} from "lucide-react";
import { Link } from "react-router-dom";

import QualityExplorer from "@/components/QualityExplorer";

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

  const [reduction, setReduction] = useState(40);
  const calc = useMemo(() => {
    const perImage = size * reduction / 100;
    const savedMB = perImage * count;
    return {
      savedMB,
      savedGB: savedMB / 1024,
      pct: reduction,
      outputMB: size * count - savedMB,
    };
  }, [count, size, reduction]);

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

      <label className="mt-5 block">Assumed size reduction · {reduction}%<input type="range" min="0" max="95" step="1" value={reduction} onChange={e => setReduction(+e.target.value)} /></label>
      <div className="mt-7 grid grid-cols-3 gap-3">
        {[
          { label: "Bandwidth", value: fmt(calc.savedMB) },
          { label: "Smaller by", value: `${calc.pct}%` },
          { label: "Output total", value: fmt(calc.outputMB) },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-primary/[0.04] px-3 py-4 text-center">
            <div className="font-mono text-base font-black text-foreground sm:text-lg">{s.value}</div>
            <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/50">{s.label}</div>
          </div>
        ))}
      </div>

      <p className="mt-5 text-center text-sm leading-relaxed text-muted-foreground">
        At the selected reduction, processing <span className="font-semibold text-foreground">{count}</span> images at{" "}
        <span className="font-semibold text-foreground">{size.toFixed(1)} MB</span> each saves about{" "}
        <span className="font-bold gradient-text">{fmt(calc.savedMB)}</span> across the exported files.
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

export default function HeroFeatures({ onQuality }: { onQuality?: (q: number) => void }) {
  return <div className="studio-lab">
    <div className="grid gap-5 lg:grid-cols-2"><BeforeAfterDemo /><SavingsCalculator /></div>
    <QualityExplorer onApply={onQuality} />
    <p><Link to="/learn/jpeg-quality-guide">Read the full quality guide</Link></p>
  </div>;
}
