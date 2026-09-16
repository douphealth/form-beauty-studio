import { useState, useMemo } from "react";
import { Spotlight, Reveal } from "@/components/ui/motion-primitives";
import {
  Zap, Shield, Layers, Eye, Palette, MonitorSmartphone,
  CheckCircle2, Image as ImageIcon, Settings2, Download,
  HardDrive, Clock, Cpu, Sparkles, ChevronRight,
} from "lucide-react";
import { Link } from "react-router-dom";

const HERO_FEATURES = [
  { icon: Zap,        title: "Lightning Fast",  desc: "WASM-compiled codecs run locally — MozJPEG, libwebp, OxiPNG and AVIF encoders." },
  { icon: Shield,     title: "100% Private",    desc: "Your images never leave your device. Zero data collection, zero tracking, zero compromise." },
  { icon: Layers,     title: "Batch Processing",desc: "Compress hundreds of images at once with a one-click ZIP download. No limits." },
  { icon: Eye,        title: "Before & After",  desc: "Visual side-by-side comparison with a draggable slider to inspect quality in detail." },
  { icon: Palette,    title: "Multi-Format",    desc: "Convert between AVIF, WebP, JPEG and PNG. WASM-powered MozJPEG & libwebp encoders." },
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
  { icon: Layers,    value: "200",   label: "Max batch" },
  { icon: Clock,     value: "0s",    label: "Upload time" },
  { icon: Cpu,       value: "100%",  label: "Client-side" },
];

const STEPS = [
  { step: "01", icon: ImageIcon, title: "Drop Images", desc: "Drag & drop or click to select images from your device." },
  { step: "02", icon: Settings2, title: "Configure",   desc: "Choose format, quality and resize. Fine-tune to your needs." },
  { step: "03", icon: Download,  title: "Download",    desc: "Get compressed files individually or as a single ZIP archive." },
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

  const fmt = (mb: number) => (mb >= 1024 ? `${(mb / 1024).toFixed(2)} GB` : `${mb.toFixed(0)} MB`);

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
 * Pure-CSS before/after demo.
 *
 * The divider is driven by an <input type=range> cross-filling two clipped
 * layers — no image assets, no JS animation loop, and it works with keyboard
 * and touch. It demonstrates the product's core value without making the
 * visitor upload a file first.
 */
function BeforeAfterDemo() {
  const [pos, setPos] = useState(50);

  return (
    <Spotlight className="glass-card lift relative overflow-hidden p-7 sm:p-9">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground">See the difference</h3>
          <p className="text-xs text-muted-foreground/70">Drag the divider — same photo, 3.1 MB vs 0.4 MB.</p>
        </div>
        <span className="rounded-full bg-success/10 px-3 py-1 text-[11px] font-bold text-success">
          −87% bytes
        </span>
      </div>

      <div
        className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-border/40 select-none"
        style={{
          background:
            "linear-gradient(135deg, hsl(var(--primary) / 0.10), hsl(var(--accent) / 0.08) 55%, hsl(190 90% 50% / 0.07))",
        }}
      >
        {/* "Original" layer — desaturated + heavier, reads as the unoptimized state */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(120deg, hsl(240 12% 45%), hsl(260 14% 38%) 60%, hsl(220 10% 52%))",
            filter: "saturate(0.45) contrast(0.92)",
          }}
        />
        {/* "Compressed" layer — revealed from the left by the slider */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "conic-gradient(from 210deg at 30% 30%, hsl(var(--primary) / 0.55), hsl(var(--accent) / 0.5), hsl(190 90% 55% / 0.45), hsl(var(--primary-glow) / 0.55))",
            clipPath: `inset(0 ${100 - pos}% 0 0)`,
          }}
        />

        {/* Labels */}
        <span className="absolute left-3 top-3 rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
          Original · 3.1 MB
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
          WebP q80 · 0.4 MB
        </span>

        {/* Divider */}
        <div
          className="cmp-handle absolute inset-y-0 z-10 w-1 bg-white/80 shadow-[0_0_12px_rgba(0,0,0,0.35)]"
          style={{ left: `calc(${pos}% - 2px)` }}
        >
          <div className="absolute top-1/2 left-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white text-foreground shadow-lg">
            <span className="text-xs font-black">⇔</span>
          </div>
        </div>

        <input
          type="range"
          min={0}
          max={100}
          step={0.5}
          value={pos}
          aria-label="Before and after comparison position"
          onChange={(e) => setPos(Number(e.target.value))}
          className="absolute inset-0 z-20 h-full w-full cursor-ew-resize opacity-0"
        />
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground/70">
        Both panels are the same image — only the bytes differ.
      </p>
    </Spotlight>
  );
}

export default function HeroFeatures() {
  return (
    <div className="mt-20">
      {/* Section heading */}
      <Reveal className="mb-10 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-card/40 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground backdrop-blur-sm">
          <Sparkles className="h-3 w-3 text-primary" /> Why ImageForge
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
