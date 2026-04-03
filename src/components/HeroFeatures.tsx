import { motion } from "framer-motion";
import {
  Zap, Shield, Layers, Eye, Palette, MonitorSmartphone,
  CheckCircle2, Image as ImageIcon, Settings2, Download,
  HardDrive, Clock, Cpu,
} from "lucide-react";

const HERO_FEATURES = [
  {
    icon: Zap,
    title: "Lightning Fast",
    desc: "WASM-compiled codecs run locally — MozJPEG, libwebp, OxiPNG, and AVIF encoders.",
  },
  {
    icon: Shield,
    title: "100% Private",
    desc: "Your images never leave your device. Zero data collection, zero tracking, zero compromise.",
  },
  {
    icon: Layers,
    title: "Batch Processing",
    desc: "Compress hundreds of images at once with a one-click ZIP download. No limits.",
  },
  {
    icon: Eye,
    title: "Before & After",
    desc: "Visual side-by-side comparison with a draggable slider to inspect quality in detail.",
  },
  {
    icon: Palette,
    title: "Multi-Format",
    desc: "Convert between AVIF, WebP, JPEG, and PNG. WASM-powered MozJPEG & libwebp encoders.",
  },
  {
    icon: MonitorSmartphone,
    title: "Fully Responsive",
    desc: "Works flawlessly on desktop, tablet, and mobile. Process images from any device.",
  },
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

export default function HeroFeatures() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
      className="mt-20"
    >
      {/* Feature grid */}
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold text-foreground sm:text-2xl">
          Why <span className="gradient-text">ImageForge</span>?
        </h2>
        <p className="mt-2 text-sm text-muted-foreground/60">
          The most powerful browser-based image compression tool — free, private, unlimited.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {HERO_FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.08, type: "spring", stiffness: 200 }}
            whileHover={{ y: -4 }}
            className="glass-card p-8 text-center group"
          >
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/[0.06] text-primary transition-transform duration-300 group-hover:scale-110">
              <f.icon className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <h3 className="mb-2 text-base font-bold text-foreground">{f.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground/70">{f.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* What's Included */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
        className="mt-16"
      >
        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold text-foreground sm:text-2xl">
            What's <span className="gradient-text">Included</span>
          </h2>
          <p className="mt-2 text-sm text-muted-foreground/60">
            Everything you get — no exaggeration, no fine print.
          </p>
        </div>

        <div className="glass-card p-6 sm:p-8">
          <div className="grid gap-3 sm:grid-cols-2">
            {INCLUDED_FEATURES.map((feature, i) => (
              <motion.div
                key={feature}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + i * 0.04 }}
                className="flex items-center gap-3 rounded-xl px-4 py-3 transition-colors hover:bg-primary/[0.03]"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
                  <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.5} />
                </span>
                <span className="text-sm font-medium text-foreground/80">{feature}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* How it works */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, type: "spring", stiffness: 200 }}
        className="mt-16"
      >
        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold text-foreground sm:text-2xl">
            How It <span className="gradient-text">Works</span>
          </h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { step: "01", icon: ImageIcon, title: "Drop Images", desc: "Drag & drop or click to select images from your device." },
            { step: "02", icon: Settings2, title: "Configure", desc: "Choose format, quality, and resize. Fine-tune to your needs." },
            { step: "03", icon: Download, title: "Download", desc: "Get compressed files individually or as a single ZIP archive." },
          ].map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 + i * 0.1 }}
              className="glass-card relative p-8 text-center"
            >
              <span className="absolute left-4 top-4 font-mono text-4xl font-black text-primary/[0.07]">{s.step}</span>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/[0.06] text-primary">
                <s.icon className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <h3 className="mb-2 text-base font-bold text-foreground">{s.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground/60">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Stats showcase */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, type: "spring", stiffness: 200 }}
        className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4"
      >
        {[
          { icon: HardDrive, value: "50 MB", label: "Max file size" },
          { icon: Layers, value: "200", label: "Max batch" },
          { icon: Clock, value: "0s", label: "Upload time" },
          { icon: Cpu, value: "100%", label: "Client-side" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.3 + i * 0.06 }}
            className="glass-card py-8 px-4 text-center"
          >
            <s.icon className="mx-auto mb-3 h-4 w-4 text-primary/50" strokeWidth={1.5} />
            <div className="font-mono text-2xl font-black text-foreground">{s.value}</div>
            <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/40">{s.label}</div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
