import { useState, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Download, Trash2, Settings2, Layers, Gauge,
  Maximize, FileType, Package, ArrowRight, Shield, Cpu, Sparkles,
  Lock, Globe, ChevronDown, Keyboard, Eye, Image as ImageIcon,
  CheckCircle2, Clock, HardDrive, Palette, FileDown, MonitorSmartphone,
} from "lucide-react";
import JSZip from "jszip";
import { toast } from "sonner";
import DropZone from "@/components/DropZone";
import ImageCard from "@/components/ImageCard";
import ThemeToggle from "@/components/ThemeToggle";
import ImagePreviewModal from "@/components/ImagePreviewModal";
import Footer from "@/components/Footer";
import {
  type ImageFile, type OutputFormat, type CompressionOptions,
  compressImage, formatBytes, getCompressionRatio,
  generateOutputFilename, downloadBlob,
} from "@/lib/image-utils";

const FORMAT_OPTIONS: { value: OutputFormat; label: string; desc: string; icon: string }[] = [
  { value: "webp", label: "WebP", desc: "Best compression", icon: "⚡" },
  { value: "jpeg", label: "JPEG", desc: "Universal", icon: "🌐" },
  { value: "png", label: "PNG", desc: "Lossless", icon: "💎" },
];

const RESIZE_OPTIONS = [
  { value: 0, label: "Original Size" },
  { value: 3840, label: "4K — 3840px" },
  { value: 2048, label: "2K — 2048px" },
  { value: 1920, label: "Full HD — 1920px" },
  { value: 1280, label: "HD — 1280px" },
  { value: 800, label: "Web — 800px" },
  { value: 480, label: "Thumbnail — 480px" },
];

const stagger = {
  container: { transition: { staggerChildren: 0.06 } },
  item: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { type: "spring", stiffness: 300, damping: 25 },
  },
};

const HERO_FEATURES = [
  {
    icon: Zap,
    title: "Lightning Fast",
    desc: "Client-side processing — no uploads, no waiting. Instant results on your machine.",
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
    desc: "Convert between WebP, JPEG, and PNG. Choose the perfect format for every use case.",
  },
  {
    icon: MonitorSmartphone,
    title: "Fully Responsive",
    desc: "Works flawlessly on desktop, tablet, and mobile. Process images from any device.",
  },
];

const COMPARISON_FEATURES = [
  { feature: "Client-side processing", us: true, them: true },
  { feature: "Batch ZIP download", us: true, them: true },
  { feature: "Before/after comparison", us: true, them: false },
  { feature: "Dark mode", us: true, them: false },
  { feature: "Image preview & zoom", us: true, them: false },
  { feature: "Custom resize presets", us: true, them: false },
  { feature: "Keyboard shortcuts", us: true, them: false },
  { feature: "No ads or trackers", us: true, them: false },
  { feature: "Premium design", us: true, them: false },
];

export default function Index() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [format, setFormat] = useState<OutputFormat>("webp");
  const [quality, setQuality] = useState(80);
  const [maxDimension, setMaxDimension] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [previewImage, setPreviewImage] = useState<ImageFile | null>(null);

  const handleFilesAdded = useCallback((newFiles: ImageFile[]) => {
    setImages((prev) => [...prev, ...newFiles]);
    toast.success(`${newFiles.length} image${newFiles.length > 1 ? "s" : ""} added`);
  }, []);

  const removeImage = useCallback((id: string) => {
    setImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img) {
        URL.revokeObjectURL(img.previewUrl);
        if (img.compressedUrl) URL.revokeObjectURL(img.compressedUrl);
      }
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const clearAll = useCallback(() => {
    images.forEach((img) => {
      URL.revokeObjectURL(img.previewUrl);
      if (img.compressedUrl) URL.revokeObjectURL(img.compressedUrl);
    });
    setImages([]);
  }, [images]);

  const processAll = useCallback(async () => {
    if (images.length === 0) return;
    setProcessing(true);
    setProgress({ current: 0, total: images.length });

    const options: CompressionOptions = {
      format,
      quality: quality / 100,
      maxDimension: maxDimension || null,
    };

    const updated = [...images];

    for (let i = 0; i < updated.length; i++) {
      const img = updated[i];
      if (img.status === 'done') {
        setProgress((p) => ({ ...p, current: i + 1 }));
        continue;
      }

      updated[i] = { ...img, status: "processing" };
      setImages([...updated]);

      try {
        const blob = await compressImage(img.file, options);
        const outputFilename = generateOutputFilename(img.file.name, format);
        const compressedUrl = URL.createObjectURL(blob);

        updated[i] = {
          ...updated[i],
          status: "done",
          compressedBlob: blob,
          compressedSize: blob.size,
          compressedUrl,
          outputFilename,
        };
      } catch (err) {
        updated[i] = {
          ...updated[i],
          status: "error",
          error: err instanceof Error ? err.message : "Compression failed",
        };
      }

      setImages([...updated]);
      setProgress((p) => ({ ...p, current: i + 1 }));
    }

    setProcessing(false);
    const doneCount = updated.filter((i) => i.status === "done").length;
    toast.success(`${doneCount} image${doneCount > 1 ? "s" : ""} compressed!`);
  }, [images, format, quality, maxDimension]);

  const downloadZip = useCallback(async () => {
    const completed = images.filter((i) => i.status === "done" && i.compressedBlob);
    if (completed.length === 0) return;

    const zip = new JSZip();
    completed.forEach((img) => zip.file(img.outputFilename, img.compressedBlob!));
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, `imageforge-${Date.now()}.zip`);
    toast.success("ZIP downloaded!");
  }, [images]);

  const downloadAllIndividually = useCallback(() => {
    const completed = images.filter((i) => i.status === "done" && i.compressedBlob);
    completed.forEach((img) => downloadBlob(img.compressedBlob!, img.outputFilename));
    toast.success(`${completed.length} files downloaded!`);
  }, [images]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        processAll();
      }
      if (e.key === "Escape") {
        setPreviewImage(null);
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "d") {
        e.preventDefault();
        downloadZip();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [processAll, downloadZip]);

  const stats = useMemo(() => {
    const totalOriginal = images.reduce((s, i) => s + i.originalSize, 0);
    const completed = images.filter((i) => i.status === "done" && i.compressedSize != null);
    const totalCompressed = completed.reduce((s, i) => s + (i.compressedSize || 0), 0);
    const savedPct = completed.length > 0 ? getCompressionRatio(totalOriginal, totalCompressed) : 0;
    return { count: images.length, totalOriginal, totalCompressed, savedPct, completedCount: completed.length };
  }, [images]);

  const hasCompleted = stats.completedCount > 0;
  const pct = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <div className="min-h-screen bg-background transition-colors duration-700">
      {/* Ambient orbs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="glow-orb absolute -left-48 -top-48 h-[700px] w-[700px] rounded-full bg-primary" />
        <div className="glow-orb absolute -bottom-48 -right-48 h-[600px] w-[600px] rounded-full bg-accent" style={{ animationDelay: '-8s' }} />
        <div className="glow-orb absolute left-1/3 top-1/2 h-[400px] w-[400px] rounded-full bg-success" style={{ animationDelay: '-14s' }} />
      </div>

      <div className="relative z-10">
        {/* ─── Header ─── */}
        <header className="sticky top-0 z-50 border-b border-border/30 bg-background/50 backdrop-blur-3xl backdrop-saturate-150">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
            <div className="flex items-center gap-3.5">
              <motion.div
                whileHover={{ rotate: 8, scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400 }}
                className="flex h-10 w-10 items-center justify-center rounded-2xl text-primary-foreground shadow-lg"
                style={{ background: 'var(--gradient-primary)' }}
              >
                <Sparkles className="h-5 w-5" strokeWidth={2} />
              </motion.div>
              <div>
                <h1 className="text-base font-bold tracking-tight sm:text-lg">
                  <span className="gradient-text">ImageForge</span>
                </h1>
                <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-muted-foreground/60">
                  Compression Studio
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Keyboard shortcut hint */}
              <div className="hidden items-center gap-1.5 rounded-full border border-border/40 bg-card/30 backdrop-blur-sm px-3 py-1.5 text-[10px] font-medium text-muted-foreground/40 lg:inline-flex">
                <Keyboard className="h-3 w-3" />
                <kbd className="font-mono text-[9px]">⌘↵</kbd> Compress
                <span className="mx-1 h-3 w-px bg-border/30" />
                <kbd className="font-mono text-[9px]">⌘⇧D</kbd> ZIP
              </div>
              <div className="hidden items-center gap-1.5 rounded-full border border-border/40 bg-card/30 backdrop-blur-sm px-3 py-1.5 text-[10px] font-medium text-muted-foreground/60 sm:inline-flex">
                <Lock className="h-3 w-3" /> Private
                <span className="mx-1.5 h-3 w-px bg-border/50" />
                <Globe className="h-3 w-3" /> Browser-only
              </div>
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* ─── Main ─── */}
        <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-16">
          {/* Hero drop zone */}
          <DropZone onFilesAdded={handleFilesAdded} hasFiles={images.length > 0} currentCount={images.length} />

          <AnimatePresence mode="wait">
            {images.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                {/* ─── Settings ─── */}
                <div className="mt-10">
                  <button
                    onClick={() => setSettingsOpen((o) => !o)}
                    className="mb-4 flex w-full items-center justify-between rounded-2xl border border-border/40 bg-card/30 backdrop-blur-sm px-5 py-3.5 text-sm font-semibold text-foreground transition-colors duration-300 hover:bg-card/50"
                  >
                    <span className="flex items-center gap-2.5">
                      <Settings2 className="h-4 w-4 text-primary" strokeWidth={1.5} />
                      Compression Settings
                    </span>
                    <motion.span animate={{ rotate: settingsOpen ? 180 : 0 }}>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </motion.span>
                  </button>

                  <AnimatePresence>
                    {settingsOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="glass-card p-6 sm:p-8">
                          <div className="grid gap-8 sm:grid-cols-3">
                            {/* Format */}
                            <div className="space-y-3">
                              <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/70">
                                <FileType className="h-3.5 w-3.5" strokeWidth={1.5} /> Output Format
                              </label>
                              <div className="flex gap-2">
                                {FORMAT_OPTIONS.map((opt) => (
                                  <motion.button
                                    key={opt.value}
                                    onClick={() => setFormat(opt.value)}
                                    whileHover={{ y: -1 }}
                                    whileTap={{ scale: 0.97 }}
                                    className={`flex-1 rounded-xl border px-3 py-3.5 text-center transition-all duration-300 ${
                                      format === opt.value
                                        ? "border-primary/30 bg-primary/[0.06] text-primary shadow-sm"
                                        : "border-border/40 bg-card/20 text-muted-foreground hover:border-border/60 hover:text-foreground"
                                    }`}
                                  >
                                    <div className="text-lg leading-none mb-1.5">{opt.icon}</div>
                                    <div className="text-xs font-bold">{opt.label}</div>
                                    <div className="mt-0.5 text-[10px] font-medium opacity-50">{opt.desc}</div>
                                  </motion.button>
                                ))}
                              </div>
                            </div>

                            {/* Quality */}
                            <div className="space-y-3">
                              <label className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/70">
                                <span className="flex items-center gap-1.5">
                                  <Gauge className="h-3.5 w-3.5" strokeWidth={1.5} /> Quality
                                </span>
                                <span className="font-mono text-lg font-black text-primary tabular-nums leading-none">{quality}%</span>
                              </label>
                              <div className="pt-2">
                                <input
                                  type="range"
                                  min={1}
                                  max={100}
                                  value={quality}
                                  onChange={(e) => setQuality(Number(e.target.value))}
                                  className="w-full"
                                  disabled={format === "png"}
                                />
                              </div>
                              <div className="flex justify-between text-[10px] font-medium text-muted-foreground/40">
                                <span>Smaller file</span>
                                <span>Higher quality</span>
                              </div>
                              {format === "png" && (
                                <p className="text-[10px] font-medium text-accent/70">PNG is lossless — quality doesn't apply</p>
                              )}
                            </div>

                            {/* Resize */}
                            <div className="space-y-3">
                              <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/70">
                                <Maximize className="h-3.5 w-3.5" strokeWidth={1.5} /> Max Dimension
                              </label>
                              <select
                                value={maxDimension}
                                onChange={(e) => setMaxDimension(Number(e.target.value))}
                                className="w-full rounded-xl border border-border/40 bg-card/30 backdrop-blur-sm px-4 py-3.5 text-xs font-semibold text-foreground focus:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all duration-300"
                              >
                                {RESIZE_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* ─── Stats ─── */}
                <motion.div
                  className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4"
                  variants={stagger.container}
                  initial="initial"
                  animate="animate"
                >
                  {[
                    { icon: Layers, label: "Images", value: String(stats.count), color: "text-primary" },
                    { icon: Package, label: "Original", value: formatBytes(stats.totalOriginal), color: "text-muted-foreground" },
                    { icon: ArrowRight, label: "Compressed", value: hasCompleted ? formatBytes(stats.totalCompressed) : "—", color: "text-success" },
                    { icon: Zap, label: "Saved", value: hasCompleted ? `${stats.savedPct}%` : "—", color: "text-primary" },
                  ].map((stat) => (
                    <motion.div
                      key={stat.label}
                      variants={stagger.item}
                      className="glass-card flex flex-col items-center py-6 px-4 text-center group"
                    >
                      <stat.icon className={`mb-2.5 h-4 w-4 ${stat.color} opacity-60`} strokeWidth={1.5} />
                      <motion.span
                        key={stat.value}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`font-mono text-xl font-black tabular-nums leading-none ${stat.color}`}
                      >
                        {stat.value}
                      </motion.span>
                      <span className="mt-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/50">{stat.label}</span>
                    </motion.div>
                  ))}
                </motion.div>

                {/* ─── Progress ─── */}
                <AnimatePresence>
                  {processing && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-8 overflow-hidden"
                    >
                      <div className="glass-card p-6">
                        <div className="mb-4 flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2.5 font-semibold">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="h-4 w-4 rounded-full border-2 border-primary/20 border-t-primary"
                            />
                            Compressing...
                          </span>
                          <span className="font-mono text-sm font-bold text-primary tabular-nums">
                            {progress.current}/{progress.total}
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted/50">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: 'var(--gradient-primary)' }}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ─── Actions ─── */}
                {!processing && (
                  <motion.div
                    className="mt-10 flex flex-wrap items-center justify-center gap-3"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <motion.button
                      onClick={processAll}
                      whileHover={{ y: -2, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="btn-primary group inline-flex items-center gap-2.5 rounded-2xl px-10 py-4 text-sm font-bold text-primary-foreground"
                    >
                      <Zap className="h-4 w-4 transition-transform group-hover:scale-110" strokeWidth={2} />
                      Compress All
                      <kbd className="hidden rounded-md bg-primary-foreground/20 px-1.5 py-0.5 font-mono text-[9px] sm:inline">⌘↵</kbd>
                    </motion.button>

                    {hasCompleted && (
                      <>
                        <motion.button
                          onClick={downloadZip}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          className="inline-flex items-center gap-2 rounded-2xl border border-success/20 bg-success/[0.06] px-7 py-4 text-sm font-bold text-success transition-all duration-300 hover:bg-success hover:text-success-foreground hover:shadow-lg"
                        >
                          <Download className="h-4 w-4" strokeWidth={2} /> Download ZIP
                          <kbd className="hidden rounded-md bg-success/10 px-1.5 py-0.5 font-mono text-[9px] sm:inline">⌘⇧D</kbd>
                        </motion.button>

                        <motion.button
                          onClick={downloadAllIndividually}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          className="inline-flex items-center gap-2 rounded-2xl border border-border/40 bg-card/30 backdrop-blur-sm px-5 py-4 text-sm font-semibold text-muted-foreground transition-all duration-300 hover:bg-card/60 hover:text-foreground"
                        >
                          <FileDown className="h-4 w-4" strokeWidth={1.5} /> Individual
                        </motion.button>
                      </>
                    )}

                    <motion.button
                      onClick={clearAll}
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      className="inline-flex items-center gap-2 rounded-2xl border border-border/40 bg-card/30 backdrop-blur-sm px-7 py-4 text-sm font-semibold text-muted-foreground transition-all duration-300 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1.5} /> Clear All
                    </motion.button>
                  </motion.div>
                )}

                {/* ─── Image Grid ─── */}
                <div className="mt-12">
                  <div className="mb-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-bold text-foreground">Image Queue</h3>
                      <motion.span
                        key={stats.count}
                        initial={{ scale: 0.5 }}
                        animate={{ scale: 1 }}
                        className="rounded-lg bg-primary/[0.08] px-2.5 py-1 font-mono text-xs font-bold text-primary tabular-nums"
                      >
                        {stats.count}
                      </motion.span>
                    </div>
                    {hasCompleted && (
                      <span className="flex items-center gap-1.5 text-[11px] font-medium text-success/60">
                        <CheckCircle2 className="h-3 w-3" /> {stats.completedCount} done
                      </span>
                    )}
                  </div>
                  <motion.div
                    layout
                    className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
                  >
                    <AnimatePresence mode="popLayout">
                      {images.map((img, i) => (
                        <ImageCard
                          key={img.id}
                          image={img}
                          onRemove={removeImage}
                          onPreview={setPreviewImage}
                          index={i}
                        />
                      ))}
                    </AnimatePresence>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── Empty State Features ─── */}
          <AnimatePresence>
            {images.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mt-20"
              >
                {/* Feature grid */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="mb-6 text-center"
                >
                  <h2 className="text-xl font-bold text-foreground sm:text-2xl">
                    Why <span className="gradient-text">ImageForge</span>?
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground/60">
                    The most powerful browser-based image compression tool — free, private, unlimited.
                  </p>
                </motion.div>

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
                      <h3 className="mb-2 text-sm font-bold text-foreground">{f.title}</h3>
                      <p className="text-xs leading-relaxed text-muted-foreground/70">{f.desc}</p>
                    </motion.div>
                  ))}
                </div>

                {/* ─── Comparison Table ─── */}
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                  className="mt-16"
                >
                  <div className="mb-6 text-center">
                    <h2 className="text-xl font-bold text-foreground sm:text-2xl">
                      How We <span className="gradient-text">Compare</span>
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground/60">
                      See why professionals choose ImageForge over the competition.
                    </p>
                  </div>

                  <div className="glass-card overflow-hidden">
                    <div className="grid grid-cols-3 gap-0 border-b border-border/30 bg-primary/[0.02]">
                      <div className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50">Feature</div>
                      <div className="px-5 py-4 text-center">
                        <span className="gradient-text text-xs font-bold">ImageForge</span>
                      </div>
                      <div className="px-5 py-4 text-center text-xs font-medium text-muted-foreground/50">Others</div>
                    </div>
                    {COMPARISON_FEATURES.map((row, i) => (
                      <motion.div
                        key={row.feature}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 + i * 0.04 }}
                        className={`grid grid-cols-3 gap-0 ${i < COMPARISON_FEATURES.length - 1 ? "border-b border-border/15" : ""}`}
                      >
                        <div className="px-5 py-3.5 text-xs font-medium text-foreground/80">{row.feature}</div>
                        <div className="flex items-center justify-center px-5 py-3.5">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success/10 text-success">
                            <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.5} />
                          </span>
                        </div>
                        <div className="flex items-center justify-center px-5 py-3.5">
                          {row.them ? (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success/10 text-success">
                              <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.5} />
                            </span>
                          ) : (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted/30 text-muted-foreground/30">
                              ×
                            </span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* ─── How it works ─── */}
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
                        <span className="absolute left-4 top-4 font-mono text-3xl font-black text-primary/[0.07]">{s.step}</span>
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/[0.06] text-primary">
                          <s.icon className="h-5 w-5" strokeWidth={1.5} />
                        </div>
                        <h3 className="mb-2 text-sm font-bold text-foreground">{s.title}</h3>
                        <p className="text-xs leading-relaxed text-muted-foreground/60">{s.desc}</p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* ─── Stats showcase ─── */}
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
                      <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/40">{s.label}</div>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Footer */}
        <Footer />
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <ImagePreviewModal image={previewImage} onClose={() => setPreviewImage(null)} />
      )}
    </div>
  );
}
