import { useState, useCallback, useMemo } from "react";
import {
  Zap, Download, Trash2, Settings2, Layers, Gauge,
  Maximize, FileType, Package, ArrowRight, Shield, Cpu, Sparkles
} from "lucide-react";
import JSZip from "jszip";
import { toast } from "sonner";
import DropZone from "@/components/DropZone";
import ImageCard from "@/components/ImageCard";
import ThemeToggle from "@/components/ThemeToggle";
import {
  type ImageFile, type OutputFormat, type CompressionOptions,
  compressImage, formatBytes, getCompressionRatio,
  generateOutputFilename, downloadBlob,
} from "@/lib/image-utils";

const FORMAT_OPTIONS: { value: OutputFormat; label: string; desc: string }[] = [
  { value: "webp", label: "WebP", desc: "Best compression" },
  { value: "jpeg", label: "JPEG", desc: "Universal" },
  { value: "png", label: "PNG", desc: "Lossless" },
];

const RESIZE_OPTIONS = [
  { value: 0, label: "Original" },
  { value: 3840, label: "4K (3840px)" },
  { value: 2048, label: "2K (2048px)" },
  { value: 1920, label: "FHD (1920px)" },
  { value: 1280, label: "HD (1280px)" },
  { value: 800, label: "Web (800px)" },
];

export default function Index() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [format, setFormat] = useState<OutputFormat>("webp");
  const [quality, setQuality] = useState(80);
  const [maxDimension, setMaxDimension] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

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
    toast.success(`${doneCount} image${doneCount > 1 ? "s" : ""} compressed successfully!`);
  }, [images, format, quality, maxDimension]);

  const downloadZip = useCallback(async () => {
    const completed = images.filter((i) => i.status === "done" && i.compressedBlob);
    if (completed.length === 0) return;

    const zip = new JSZip();
    completed.forEach((img) => {
      zip.file(img.outputFilename, img.compressedBlob!);
    });

    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, `imageforge-${Date.now()}.zip`);
    toast.success("ZIP downloaded!");
  }, [images]);

  // Stats
  const stats = useMemo(() => {
    const totalOriginal = images.reduce((s, i) => s + i.originalSize, 0);
    const completed = images.filter((i) => i.status === "done" && i.compressedSize != null);
    const totalCompressed = completed.reduce((s, i) => s + (i.compressedSize || 0), 0);
    const savedBytes = totalOriginal - totalCompressed;
    const savedPct = completed.length > 0 ? getCompressionRatio(totalOriginal, totalCompressed) : 0;
    return { count: images.length, totalOriginal, totalCompressed, savedBytes, savedPct, completedCount: completed.length };
  }, [images]);

  const hasCompleted = stats.completedCount > 0;

  return (
    <div className="min-h-screen bg-background transition-colors duration-700">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="glow-orb absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-primary" />
        <div className="glow-orb absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-accent" style={{ animationDelay: '-4s' }} />
        <div className="glow-orb absolute left-1/2 top-1/3 h-[300px] w-[300px] rounded-full bg-primary-glow" style={{ animationDelay: '-7s' }} />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-border/40 bg-background/60 backdrop-blur-3xl">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-8">
            <div className="flex items-center gap-3.5">
              <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-glow text-lg font-black text-primary-foreground shadow-lg shadow-primary/20">
                <Sparkles className="h-5 w-5" />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary to-primary-glow opacity-0 blur-lg transition-opacity duration-500 hover:opacity-50" />
              </div>
              <div>
                <h1 className="text-lg font-extrabold tracking-tight">
                  <span className="gradient-text">ImageForge</span>
                </h1>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Compression Studio
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="hidden items-center gap-1.5 rounded-full border border-success/15 bg-success/[0.06] px-3.5 py-1.5 text-[11px] font-semibold text-success sm:inline-flex">
                <Shield className="h-3 w-3" /> Private
              </span>
              <span className="hidden items-center gap-1.5 rounded-full border border-primary/15 bg-primary/[0.06] px-3.5 py-1.5 text-[11px] font-semibold text-primary sm:inline-flex">
                <Cpu className="h-3 w-3" /> Local
              </span>
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
          {/* Drop zone */}
          <DropZone onFilesAdded={handleFilesAdded} hasFiles={images.length > 0} />

          {/* Settings panel */}
          {images.length > 0 && (
            <div className="mt-10 animate-fade-in">
              <div className="glass-card noise-texture p-6 sm:p-8">
                <div className="mb-6 flex items-center gap-3 text-sm font-bold text-foreground">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
                    <Settings2 className="h-4 w-4 text-primary" />
                  </div>
                  Compression Settings
                </div>

                <div className="grid gap-8 sm:grid-cols-3">
                  {/* Format */}
                  <div className="space-y-3">
                    <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <FileType className="h-3.5 w-3.5" /> Format
                    </label>
                    <div className="flex gap-2">
                      {FORMAT_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setFormat(opt.value)}
                          className={`flex-1 rounded-2xl border px-3 py-3 text-center text-xs font-bold transition-all duration-300 ${
                            format === opt.value
                              ? "border-primary/40 bg-primary/10 text-primary shadow-sm shadow-primary/10"
                              : "border-border/50 bg-card/30 text-muted-foreground hover:border-primary/20 hover:bg-card/50 hover:text-foreground"
                          }`}
                        >
                          <div>{opt.label}</div>
                          <div className="mt-0.5 text-[10px] font-medium opacity-50">{opt.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quality */}
                  <div className="space-y-3">
                    <label className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Gauge className="h-3.5 w-3.5" /> Quality
                      </span>
                      <span className="font-mono text-base font-black text-primary tabular-nums">{quality}%</span>
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={100}
                      value={quality}
                      onChange={(e) => setQuality(Number(e.target.value))}
                      className="w-full accent-primary"
                      disabled={format === "png"}
                    />
                    <div className="flex justify-between text-[10px] font-medium text-muted-foreground/60">
                      <span>Smaller file</span>
                      <span>Higher quality</span>
                    </div>
                    {format === "png" && (
                      <p className="text-[10px] font-medium text-accent">PNG is lossless — quality slider doesn't apply</p>
                    )}
                  </div>

                  {/* Resize */}
                  <div className="space-y-3">
                    <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <Maximize className="h-3.5 w-3.5" /> Max Dimension
                    </label>
                    <select
                      value={maxDimension}
                      onChange={(e) => setMaxDimension(Number(e.target.value))}
                      className="w-full rounded-2xl border border-border/50 bg-card/30 px-4 py-3 text-xs font-bold text-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all duration-300"
                    >
                      {RESIZE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stats row */}
          {images.length > 0 && (
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 animate-fade-in">
              {[
                { icon: Layers, label: "Images", value: String(stats.count), color: "text-primary" },
                { icon: Package, label: "Original", value: formatBytes(stats.totalOriginal), color: "text-muted-foreground" },
                { icon: ArrowRight, label: "Compressed", value: hasCompleted ? formatBytes(stats.totalCompressed) : "—", color: "text-success" },
                { icon: Zap, label: "Saved", value: hasCompleted ? `${stats.savedPct}%` : "—", color: "text-accent" },
              ].map((stat) => (
                <div key={stat.label} className="glass-card flex flex-col items-center p-6 text-center group hover:-translate-y-0.5 transition-transform duration-300">
                  <stat.icon className={`mb-2.5 h-4 w-4 ${stat.color} transition-transform duration-300 group-hover:scale-110`} />
                  <span className={`font-mono text-2xl font-black tabular-nums ${stat.color}`}>{stat.value}</span>
                  <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">{stat.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Progress bar */}
          {processing && (
            <div className="mt-8 glass-card p-6 animate-fade-in noise-texture">
              <div className="mb-4 flex items-center justify-between text-sm">
                <span className="flex items-center gap-2.5 font-bold">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
                  Processing...
                </span>
                <span className="font-mono text-base font-black text-primary tabular-nums">
                  {progress.current}/{progress.total}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-muted/50">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`,
                    background: 'var(--gradient-primary)',
                  }}
                />
              </div>
            </div>
          )}

          {/* Action buttons */}
          {images.length > 0 && !processing && (
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3 animate-fade-in">
              <button
                onClick={processAll}
                className="group inline-flex items-center gap-2.5 rounded-2xl px-10 py-4 text-sm font-extrabold text-primary-foreground shadow-xl shadow-primary/20 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 active:shadow-lg"
                style={{ background: 'var(--gradient-primary)' }}
              >
                <Zap className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" /> Compress All
              </button>

              {hasCompleted && (
                <button
                  onClick={downloadZip}
                  className="inline-flex items-center gap-2 rounded-2xl border border-success/20 bg-success/10 px-7 py-4 text-sm font-bold text-success transition-all duration-300 hover:bg-success hover:text-success-foreground hover:shadow-lg hover:shadow-success/20 hover:-translate-y-0.5"
                >
                  <Download className="h-4 w-4" /> Download ZIP
                </button>
              )}

              <button
                onClick={clearAll}
                className="inline-flex items-center gap-2 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm px-7 py-4 text-sm font-semibold text-muted-foreground transition-all duration-300 hover:bg-card hover:text-foreground hover:border-border"
              >
                <Trash2 className="h-4 w-4" /> Clear All
              </button>
            </div>
          )}

          {/* Image grid */}
          {images.length > 0 && (
            <div className="mt-10 animate-fade-in">
              <div className="mb-5 flex items-center gap-2.5">
                <h3 className="text-sm font-bold text-foreground">Image Queue</h3>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary tabular-nums">
                  {stats.count}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {images.map((img, i) => (
                  <div key={img.id} style={{ animationDelay: `${i * 60}ms` }} className="animate-fade-in-up opacity-0">
                    <ImageCard image={img} onRemove={removeImage} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state features */}
          {images.length === 0 && (
            <div className="mt-20 animate-fade-in">
              <div className="grid gap-5 sm:grid-cols-3">
                {[
                  {
                    icon: Zap,
                    title: "Lightning Fast",
                    desc: "Client-side processing — no uploads, no waiting, instant results.",
                    gradient: "from-primary/10 to-primary-glow/10",
                  },
                  {
                    icon: Shield,
                    title: "100% Private",
                    desc: "Your images never leave your device. Zero data collection.",
                    gradient: "from-success/10 to-success/5",
                  },
                  {
                    icon: Layers,
                    title: "Batch Processing",
                    desc: "Compress hundreds of images at once with one-click ZIP download.",
                    gradient: "from-accent/10 to-accent/5",
                  },
                ].map((f, i) => (
                  <div
                    key={f.title}
                    className="glass-card noise-texture p-8 text-center group hover:-translate-y-1 transition-all duration-500"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className={`mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${f.gradient} text-primary transition-all duration-500 group-hover:scale-110 group-hover:shadow-lg`}>
                      <f.icon className="h-6 w-6" />
                    </div>
                    <h3 className="mb-2 text-sm font-bold text-foreground">{f.title}</h3>
                    <p className="text-xs leading-relaxed text-muted-foreground">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-border/30 py-10 text-center">
          <p className="text-xs font-medium text-muted-foreground/40">
            Built with precision — all processing happens in your browser
          </p>
        </footer>
      </div>
    </div>
  );
}
