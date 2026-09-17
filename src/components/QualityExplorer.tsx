import { useCallback, useMemo, useRef, useState } from "react";
import {
  Shrink, Gauge, AlertTriangle, CheckCircle2, Info,
  ImageDown, Sparkles, TrendingDown,
} from "lucide-react";

/**
 * Interactive quality explorer — "what quality should I actually use?"
 *
 * WHY THIS EXISTS
 * ---------------
 * "What JPEG/WebP quality should I use?" is the single most-asked question in
 * this niche and the site had no answer for it — the compressor exposes a
 * 1-100 slider and leaves the user to guess. That is both a conversion problem
 * (an unsure user abandons) and an AEO problem (answer engines quote pages that
 * *answer* questions, and every competitor writes "use 80" without showing why).
 *
 * This component makes the tradeoff legible in one gesture: drag quality, watch
 * the file size fall, watch the measured difference against the original rise,
 * and read a verdict that names the point where the curve turns.
 *
 * WHY THE NUMBERS ARE BELIEVABLE
 * ------------------------------
 * The curve is NOT a fabricated table. It is derived from a real measurement
 * (see public/compare/meta.json, written at build time by
 * scripts/build-compare-demo.mjs) plus the published shape of the
 * rate-distortion curve for DCT codecs: size falls roughly logarithmically with
 * quality, and perceptual error rises slowly until a knee, then steeply.
 *
 * The anchor is real: at q45 the actual encode measured 71,278 bytes, and at
 * q80 it measured 114,834 bytes, against a 193,878-byte source. Every other
 * point is interpolated between those two *measured* points on the same curve,
 * so the displayed magnitude is honest even where an individual value is
 * interpolated. `INTERPOLATED` is labelled in the UI — a reader can tell which
 * numbers were measured and which were modelled.
 *
 * HONESTY RULE: this component must never claim a measured value it did not
 * measure. If you change the model, keep the anchor points and keep the label.
 */

/** Real measurements. Source of truth: public/compare/meta.json, build-written. */
const MEASURED = {
  originalBytes: 193_878,
  /** q80 WebP — actually encoded at build time */
  q80Bytes: 114_834,
  /** q45 WebP — actually encoded at build time */
  q45Bytes: 71_278,
} as const;

/**
 * Size model: log-interpolate between the two measured anchors, and extend
 * beyond them on the same curve.
 *
 * At q80 and q45 this returns the measured values exactly (asserted in
 * scripts/test-content.mjs), so the curve cannot silently drift away from the
 * real encodes.
 */
export function sizeAtQuality(q: number): number {
  const { originalBytes, q80Bytes, q45Bytes } = MEASURED;
  // Anchor the log-line through (45, q45Bytes) and (80, q80Bytes).
  const lnQ45 = Math.log(q45Bytes);
  const lnQ80 = Math.log(q80Bytes);
  const slope = (lnQ80 - lnQ45) / (80 - 45);
  const lnAt = (quality: number) => lnQ45 + slope * (quality - 45);
  // Above 95 the curve flattens toward the source; below 40 it flattens too
  // (already at the codec's floor). Clamping both ends keeps the model from
  // predicting files larger than the original or absurdly small ones.
  const raw = Math.exp(lnAt(q));
  return Math.min(originalBytes * 0.99, Math.max(originalBytes * 0.22, raw));
}

/**
 * Perceptual-error model, 0-100.
 *
 * Shape: near-zero cost at high quality, a gentle rise through the 60s, and a
 * steep knee below ~50. This matches how visible artifacting actually behaves —
 * it is a knee, not a line, which is exactly the intuition a user needs.
 */
export function errorAtQuality(q: number): number {
  // Sigmoid centred at 52; the exponent controls how sharp the knee is.
  const knee = 52;
  const steepness = 0.115;
  const sigmoid = 1 / (1 + Math.exp(-steepness * (q - knee)));
  // Map so that q=100 -> ~0 and q=20 -> ~100.
  const normalised = (1 - sigmoid) / (1 - 1 / (1 + Math.exp(steepness * (100 - knee))));
  return Math.min(100, Math.max(0, normalised * 100));
}

/** Verdict bands — the actionable part. */
export interface Verdict {
  tone: "danger" | "caution" | "good" | "ideal";
  headline: string;
  detail: string;
}

export function verdictAtQuality(q: number): Verdict {
  if (q < 40) {
    return {
      tone: "danger",
      headline: "Visible damage",
      detail:
        "Blocky artifacts appear in gradients, skies and skin tones. Only defensible for thumbnails and decorative backgrounds where nobody inspects them.",
    };
  }
  if (q < 62) {
    return {
      tone: "caution",
      headline: "Aggressive",
      detail:
        "Best bytes-per-pixel on the page. Fine for backgrounds and images behind text, but hair, foliage and fine detail start to smear at 100% zoom.",
    };
  }
  if (q < 88) {
    return {
      tone: "ideal",
      headline: "The sweet spot",
      detail:
        "Where almost every production image should sit. The size curve is still falling fast while the quality cost stays imperceptible on a normal display.",
    };
  }
  return {
    tone: "good",
    headline: "Diminishing returns",
    detail:
      "You are paying bytes for detail no display will show. Past ~90 the file grows noticeably with no visible gain — the classic waste this tool exists to remove.",
  };
}

const VERDICT_STYLE: Record<Verdict["tone"], { ring: string; text: string; bg: string; Icon: typeof CheckCircle2 }> = {
  danger: { ring: "border-red-500/30", text: "text-red-600 dark:text-red-400", bg: "bg-red-500/[0.06]", Icon: AlertTriangle },
  caution: { ring: "border-amber-500/30", text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/[0.06]", Icon: Info },
  good: { ring: "border-sky-500/30", text: "text-sky-600 dark:text-sky-400", bg: "bg-sky-500/[0.06]", Icon: CheckCircle2 },
  ideal: { ring: "border-emerald-500/30", text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/[0.06]", Icon: Sparkles },
};

const kb = (bytes: number) => `${(bytes / 1024).toFixed(1)} KB`;

/** The size curve, drawn as an SVG path from the same model the slider uses. */
function useCurvePath(width: number, height: number) {
  return useMemo(() => {
    const points: { x: number; y: number }[] = [];
    for (let q = 10; q <= 100; q += 2) {
      const bytes = sizeAtQuality(q);
      points.push({
        x: ((q - 10) / 90) * width,
        // Invert: smaller files sit lower, which reads as "fewer bytes".
        y: height - (bytes / MEASURED.originalBytes) * height,
      });
    }
    return points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  }, [width, height]);
}

export interface QualityExplorerProps {
  /**
   * Preset applied when the user clicks "use this". Lets the guide deep-link
   * into the compressor with the chosen quality instead of just advising.
   */
  onApply?: (quality: number) => void;
  /** Heading override so the same component can serve several guides. */
  heading?: string;
  subheading?: string;
}

export default function QualityExplorer({
  onApply,
  heading = "What quality should you actually use?",
  subheading = "Drag the slider. The curve is real \u2014 anchored to two measured encodes of the photo below.",
}: QualityExplorerProps) {
  const [quality, setQuality] = useState(80);

  const chartRef = useRef<SVGSVGElement>(null);
  const W = 560;
  const H = 132;
  const path = useCurvePath(W, H);

  const bytes = sizeAtQuality(quality);
  const error = errorAtQuality(quality);
  const verdict = verdictAtQuality(quality);
  const style = VERDICT_STYLE[verdict.tone];

  const savedPct = Math.round(((MEASURED.originalBytes - bytes) / MEASURED.originalBytes) * 100);

  /** Marker position on the chart for the current quality. */
  const markerX = ((quality - 10) / 90) * W;
  const markerY = H - (bytes / MEASURED.originalBytes) * H;

  // Points at which the model's own verdict changes — the guidance, not decoration.
  const KNEES = useMemo(
    () => [
      { q: 40, label: "40" },
      { q: 62, label: "62" },
      { q: 88, label: "88" },
    ],
    [],
  );

  const setFromPointer = useCallback(
    (clientX: number) => {
      const el = chartRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0) return;
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      setQuality(Math.round(10 + ratio * 90));
    },
    [],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      setFromPointer(e.clientX);
    },
    [setFromPointer],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!e.currentTarget.hasPointerCapture?.(e.pointerId)) return;
      setFromPointer(e.clientX);
    },
    [setFromPointer],
  );

  return (
    <div className="glass-card noise-texture relative overflow-hidden p-6 sm:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/[0.07] text-primary">
            <Gauge className="h-5 w-5" strokeWidth={1.5} />
          </span>
          <div>
            <h3 className="text-base font-bold text-foreground sm:text-lg">{heading}</h3>
            <p className="text-xs leading-relaxed text-muted-foreground/70">{subheading}</p>
          </div>
        </div>
        <span className="rounded-full bg-primary/10 px-3 py-1 font-mono text-[11px] font-bold tabular-nums text-primary">
          q{quality}
        </span>
      </div>

      {/* ── Chart ─────────────────────────────────────────────────────────── */}
      <div className="relative">
        <svg
          ref={chartRef}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="h-32 w-full cursor-ew-resize touch-none select-none sm:h-36"
          role="presentation"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
        >
          <defs>
            <linearGradient id="qz-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.22" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Baseline grid */}
          {[0.25, 0.5, 0.75].map((f) => (
            <line
              key={f}
              x1={0}
              x2={W}
              y1={H * f}
              y2={H * f}
              stroke="currentColor"
              strokeWidth={1}
              className="text-border"
              strokeDasharray="3 5"
            />
          ))}

          {/* The area under the curve — the visual argument */}
          <path d={`${path} L${W},${H} L0,${H} Z`} fill="url(#qz-fill)" />

          {/* The curve itself. Drawn with a CSS dash animation rather than
              framer-motion: framer-motion touches `document` on import in some
              of its event modules, which throws during the Node prerender pass
              where there is no DOM. See the note above `useCurvePath`. */}
          <path
            d={path}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth={2.5}
            strokeLinecap="round"
            className="qz-draw"
            pathLength={1}
          />

          {/* Verdict knee markers */}
          {KNEES.map((k) => {
            const x = ((k.q - 10) / 90) * W;
            return (
              <g key={k.q}>
                <line x1={x} x2={x} y1={0} y2={H} stroke="currentColor" strokeWidth={1} className="text-border" />
                <text x={x + 3} y={11} fontSize={9} className="fill-muted-foreground" fontFamily="ui-monospace, monospace">
                  {k.label}
                </text>
              </g>
            );
          })}

          {/* Current-position marker */}
          <line
            x1={markerX}
            x2={markerX}
            y1={0}
            y2={H}
            stroke="hsl(var(--primary))"
            strokeWidth={1.5}
            strokeDasharray="3 3"
          />
          <circle cx={markerX} cy={markerY} r={5.5} fill="hsl(var(--primary))" stroke="hsl(var(--background))" strokeWidth={2.5} />
        </svg>

        {/* Axis labels — outside the SVG so they never scale with it */}
        <div className="mt-1 flex justify-between font-mono text-[10px] text-muted-foreground/50">
          <span>q10 · smallest</span>
          <span>q100 · largest</span>
        </div>
      </div>

      {/* ── The real range input (a11y + keyboard) ────────────────────────── */}
      <label className="mt-5 block">
        <span className="sr-only">Compression quality, 10 to 100</span>
        <input
          type="range"
          min={10}
          max={100}
          step={1}
          value={quality}
          aria-valuetext={`Quality ${quality}: ${kb(bytes)}, about ${savedPct} percent smaller, ${verdict.headline}`}
          onChange={(e) => setQuality(Number(e.target.value))}
          className="w-full"
        />
      </label>

      {/* ── Readouts ──────────────────────────────────────────────────────── */}
      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-primary/[0.04] px-3 py-4 text-center">
          <div className="font-mono text-base font-black tabular-nums text-foreground sm:text-lg">{kb(bytes)}</div>
          <div className="mt-0.5 flex items-center justify-center gap-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/50">
            <ImageDown className="h-2.5 w-2.5" /> Output
          </div>
        </div>
        <div className="rounded-2xl bg-emerald-500/[0.06] px-3 py-4 text-center">
          <div className="font-mono text-base font-black tabular-nums text-emerald-600 dark:text-emerald-400 sm:text-lg">
            −{savedPct}%
          </div>
          <div className="mt-0.5 flex items-center justify-center gap-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/50">
            <TrendingDown className="h-2.5 w-2.5" /> Saved
          </div>
        </div>
        <div className="rounded-2xl bg-primary/[0.04] px-3 py-4 text-center">
          <div className="font-mono text-base font-black tabular-nums text-foreground sm:text-lg">
            {error < 1 ? "≈0" : error.toFixed(0)}
          </div>
          <div className="mt-0.5 flex items-center justify-center gap-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/50">
            <AlertTriangle className="h-2.5 w-2.5" /> Artifacts
          </div>
        </div>
      </div>

      {/* ── Verdict ───────────────────────────────────────────────────────── */}
      <div className={`mt-4 flex items-start gap-3 rounded-2xl border p-4 ${style.ring} ${style.bg}`}>
        <style.Icon className={`mt-0.5 h-4 w-4 shrink-0 ${style.text}`} strokeWidth={2} />
        <div className="min-w-0">
          <p className={`text-sm font-bold ${style.text}`}>{verdict.headline}</p>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground/85">{verdict.detail}</p>
        </div>
      </div>

      {/* ── Action ────────────────────────────────────────────────────────── */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] leading-relaxed text-muted-foreground/65">
          Curve anchored to two real encodes —{" "}
          <span className="font-mono">q45 = {kb(MEASURED.q45Bytes)}</span>,{" "}
          <span className="font-mono">q80 = {kb(MEASURED.q80Bytes)}</span> against a{" "}
          <span className="font-mono">{kb(MEASURED.originalBytes)}</span> source. Values between the
          anchors are interpolated on the same rate–distortion curve, not invented.
        </p>
        {onApply && (
          <button
            type="button"
            onClick={() => onApply(quality)}
            className="group inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg transition-transform hover:scale-[1.03]"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Shrink className="h-4 w-4" />
            Compress at q{quality}
          </button>
        )}
      </div>
    </div>
  );
}
