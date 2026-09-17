import { useMemo, useState } from "react";
import { Film, Image as ImageIcon, Type, Code2, Database, Layers } from "lucide-react";

/**
 * Page-weight waterfall — "where do the bytes actually go?"
 *
 * WHY THIS EXISTS
 * ---------------
 * Every image-optimization guide asserts a number ("images are ~50% of page
 * weight") and expects the reader to accept it. This renders the breakdown as a
 * stacked bar the reader can hover, which converts an abstract statistic into a
 * visual argument for why image compression is the highest-leverage thing on
 * their page.
 *
 * THE DATA IS PUBLISHED RESEARCH, NOT A GUESS
 * -------------------------------------------
 * The proportions below reflect the widely-reported shape of the median page
 * (HTTP Archive / Web Almanac "Page Weight" chapter): images dominate at roughly
 * half of transferred bytes, with JS, video, CSS and fonts splitting the rest.
 * The exact split has drifted a few points year to year, so this is labelled as
 * a *typical* breakdown in the UI rather than presented as live telemetry.
 *
 * HONESTY RULE: never restate these as measured values for a specific site. The
 * Pro audit exists for that, and it measures the real page.
 */

export interface WaterfallSegment {
  id: string;
  label: string;
  /** Percentage of total transferred bytes. */
  pct: number;
  color: string;
  icon: typeof ImageIcon;
  /** Why this segment matters / what to do about it. */
  note: string;
}

/** Median-page composition — HTTP Archive / Web Almanac shape, rounded. */
export const TYPICAL_PAGE_WEIGHT: WaterfallSegment[] = [
  {
    id: "images",
    label: "Images",
    pct: 49,
    color: "#7c3aed",
    icon: ImageIcon,
    note: "The single largest category, and the most compressible. Modern formats typically cut 40–65% of these bytes with no visible change — this is the highest-leverage fix on almost every page.",
  },
  {
    id: "js",
    label: "JavaScript",
    pct: 22,
    color: "#f59e0b",
    icon: Code2,
    note: "Hard to shrink after the fact and it competes for the main thread, so it hurts INP as well as weight. Code-splitting and deferring beat minification by a wide margin.",
  },
  {
    id: "video",
    label: "Video",
    pct: 14,
    color: "#ec4899",
    icon: Film,
    note: "Huge when present, but only present on some pages. A single autoplaying hero video can outweigh every image on the page — check it hasn't been enabled by default.",
  },
  {
    id: "css",
    label: "CSS",
    pct: 7,
    color: "#06b6d4",
    icon: Layers,
    note: "Small in absolute terms once compressed, but it is render-blocking, so it costs more time than its byte count suggests. Inline the critical path.",
  },
  {
    id: "fonts",
    label: "Fonts",
    pct: 5,
    color: "#10b981",
    icon: Type,
    note: "Usually 2–4 files. Subsetting to the characters actually used and self-hosting with long cache headers is the standard fix.",
  },
  {
    id: "other",
    label: "Other",
    pct: 3,
    color: "#94a3b8",
    icon: Database,
    note: "Documents, third-party tags, beacons and analytics. Rarely the answer, but a surprising number of audit findings live here.",
  },
];

/**
 * Where the savings actually come from, expressed against the *image* slice.
 *
 * These are the measured results of re-encoding the same source at three
 * settings (see public/compare/meta.json, build-generated) rather than
 * industry averages — so the claim is reproducible on the demo photo.
 */
const MEASURED_REDUCTION = {
  /** WebP q80 vs the original JPEG q92 source. */
  balanced: 0.408,
  /** WebP q45 vs the original source. */
  aggressive: 0.632,
} as const;

const fmtMB = (mb: number) => (mb >= 1024 ? `${(mb / 1024).toFixed(2)} GB` : `${mb.toFixed(2)} MB`);

export interface PageWeightWaterfallProps {
  /** Assumed page weight in MB before any optimisation. */
  defaultTotalMB?: number;
  heading?: string;
  subheading?: string;
}

export default function PageWeightWaterfall({
  defaultTotalMB = 2.8,
  heading = "Where your page weight actually goes",
  subheading = "Hover any segment. The image slice is where the leverage is — and it is the easiest to fix.",
}: PageWeightWaterfallProps) {
  const [active, setActive] = useState<string | null>("images");
  const [totalMB, setTotalMB] = useState(defaultTotalMB);
  const [effort, setEffort] = useState<"balanced" | "aggressive">("balanced");

  const imageMB = useMemo(() => (totalMB * (TYPICAL_PAGE_WEIGHT[0].pct / 100)), [totalMB]);
  const savedMB = imageMB * MEASURED_REDUCTION[effort];
  const afterMB = totalMB - savedMB;
  const savedPctOfPage = (savedMB / totalMB) * 100;

  const activeSegment = TYPICAL_PAGE_WEIGHT.find((s) => s.id === active) ?? null;

  return (
    <div className="glass-card noise-texture relative overflow-hidden p-6 sm:p-8">
      <div className="mb-6">
        <h3 className="text-base font-bold text-foreground sm:text-lg">{heading}</h3>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground/70">{subheading}</p>
      </div>

      {/* ── The stacked bar ───────────────────────────────────────────────── */}
      <div
        className="flex h-11 w-full overflow-hidden rounded-2xl border border-border/50"
        role="img"
        aria-label={`Typical page composition: ${TYPICAL_PAGE_WEIGHT.map((s) => `${s.label} ${s.pct} percent`).join(", ")}`}
      >
        {TYPICAL_PAGE_WEIGHT.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onMouseEnter={() => setActive(s.id)}
            onFocus={() => setActive(s.id)}
            onClick={() => setActive(s.id)}
            aria-label={`${s.label}, ${s.pct} percent of page weight`}
            aria-pressed={active === s.id}
            className="pww-seg group relative h-full border-0 outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-primary"
            style={{
              width: `${s.pct}%`,
              background: s.color,
              opacity: active && active !== s.id ? 0.42 : 1,
              // Stagger the entrance with a plain CSS delay. No framer-motion
              // here on purpose: it touches `document` at import time in its
              // event modules, which throws during the Node prerender pass.
              animationDelay: `${i * 60}ms`,
            }}
          >
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white/95">
              {s.pct >= 7 ? `${s.pct}%` : ""}
            </span>
          </button>
        ))}
      </div>

      {/* ── Legend ────────────────────────────────────────────────────────── */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
        {TYPICAL_PAGE_WEIGHT.map((s) => (
          <button
            key={s.id}
            type="button"
            onMouseEnter={() => setActive(s.id)}
            onFocus={() => setActive(s.id)}
            onClick={() => setActive(s.id)}
            className={`flex items-center gap-1.5 text-[11px] font-medium transition-colors ${
              active === s.id ? "text-foreground" : "text-muted-foreground/70 hover:text-foreground"
            }`}
          >
            <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
            {s.label}
          </button>
        ))}
      </div>

      {/* ── Segment detail ────────────────────────────────────────────────── */}
      <div className="mt-4 min-h-[92px] rounded-2xl border border-border/40 bg-card/40 p-4">
        {activeSegment ? (
          <div className="flex items-start gap-3">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
              style={{ background: `${activeSegment.color}1f`, color: activeSegment.color }}
            >
              <activeSegment.icon className="h-4 w-4" strokeWidth={1.8} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground">
                {activeSegment.label}{" "}
                <span className="font-mono text-xs font-normal text-muted-foreground">
                  {activeSegment.pct}% · ≈{fmtMB(totalMB * (activeSegment.pct / 100))}
                </span>
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground/85">{activeSegment.note}</p>
            </div>
          </div>
        ) : (
          <p className="text-[13px] text-muted-foreground/70">Select a segment to see what to do about it.</p>
        )}
      </div>

      {/* ── The payoff calculator ─────────────────────────────────────────── */}
      <div className="mt-6 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.05] via-transparent to-accent/[0.04] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">
          What optimising the images alone buys you
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-medium text-foreground/80">Your page weight</span>
              <span className="font-mono font-bold tabular-nums text-primary">{totalMB.toFixed(1)} MB</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={10}
              step={0.1}
              value={totalMB}
              onChange={(e) => setTotalMB(Number(e.target.value))}
              aria-label="Total page weight in megabytes"
            />
          </label>

          <div
            className="inline-flex h-fit rounded-xl border border-border/50 bg-card/50 p-0.5"
            role="group"
            aria-label="Optimisation level"
          >
            {([
              { id: "balanced", label: "Balanced" },
              { id: "aggressive", label: "Aggressive" },
            ] as const).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setEffort(opt.id)}
                aria-pressed={effort === opt.id}
                className={`flex-1 rounded-[10px] px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                  effort === opt.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Before / after bars */}
        <div className="mt-5 space-y-2.5">
          <div className="flex items-center gap-3">
            <span className="w-12 shrink-0 font-mono text-[10px] uppercase text-muted-foreground/60">Before</span>
            <div className="h-6 flex-1 overflow-hidden rounded-lg bg-muted/60">
              <div className="flex h-full w-full">
                {TYPICAL_PAGE_WEIGHT.map((s) => (
                  <div key={s.id} style={{ width: `${s.pct}%`, background: s.color, opacity: 0.75 }} />
                ))}
              </div>
            </div>
            <span className="w-16 shrink-0 text-right font-mono text-[11px] font-bold tabular-nums text-foreground">
              {totalMB.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-12 shrink-0 font-mono text-[10px] uppercase text-muted-foreground/60">After</span>
            <div className="h-6 flex-1 overflow-hidden rounded-lg bg-muted/60">
              <div className="flex h-full">
                <div style={{ width: `${(imageMB * (1 - MEASURED_REDUCTION[effort]) / totalMB) * 100}%`, background: "#7c3aed", opacity: 0.75 }} />
                {TYPICAL_PAGE_WEIGHT.slice(1).map((s) => (
                  <div key={s.id} style={{ width: `${s.pct}%`, background: s.color, opacity: 0.75 }} />
                ))}
              </div>
            </div>
            <span className="w-16 shrink-0 text-right font-mono text-[11px] font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              {afterMB.toFixed(2)}
            </span>
          </div>
        </div>

        <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground">
          Optimising images alone takes this page from{" "}
          <span className="font-semibold text-foreground">{totalMB.toFixed(2)} MB</span> to{" "}
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">{afterMB.toFixed(2)} MB</span> —
          a <span className="font-bold gradient-text">{savedPctOfPage.toFixed(0)}% lighter page</span>, without
          touching a line of JavaScript or CSS.
        </p>
      </div>

      <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground/60">
        Composition reflects the shape of the typical page in HTTP Archive's page-weight research, not a live
        measurement of your site. The reduction figures are measured: re-encoding the same source produced −41%
        (balanced) and −63% (aggressive). To measure your own pages, use the{" "}
        <a href="/pro" className="underline decoration-dotted underline-offset-2 hover:text-foreground">
          ImageAlchemy Pro audit
        </a>.
      </p>
    </div>
  );
}
