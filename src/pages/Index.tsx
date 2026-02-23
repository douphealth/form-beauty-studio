import { useState, useCallback, useMemo } from "react";
import {
  Zap, Download, Trash2, Settings2, Layers, Gauge,
  Maximize, FileType, Package, ArrowRight, Shield, Cpu
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
    <div className="min-h-screen bg-background transition-colors duration-500">
      {/* Ambient background orbs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-primary/[0.04] blur-[100px] animate-float" />
        <div className="absolute -bottom-32 -right-32 h-[400px] w-[400px] rounded-full bg-accent/[0.04] blur-[80px] animate-float" style={{ animationDelay: '-3s' }} />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-2xl">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/60 text-lg font-black text-primary-foreground shadow-lg">
                ⚡
              </div>
              <div>
                <h1 className="text-lg font-extrabold tracking-tight">
                  <span className="gradient-text">ImageForge</span>
                </h1>
                <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                  Compression Studio
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="hidden items-center gap-1.5 rounded-full border border-success/20 bg-success/5 px-3 py-1 text-[11px] font-medium text-success sm:inline-flex">
                <Shield className="h-3 w-3" /> Private
              </span>
              <span className="hidden items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-medium text-primary sm:inline-flex">
                <Cpu className="h-3 w-3" /> Local
              </span>
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
          {/* Drop zone */}
          <DropZone onFilesAdded={handleFilesAdded} hasFiles={images.length > 0} />

          {/* Settings panel */}
          {images.length > 0 && (
            <div className="mt-8 animate-fade-in">
              <div className="glass-card p-5 sm:p-7">
                <div className="mb-5 flex items-center gap-2.5 text-sm font-bold text-foreground">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                    <Settings2 className="h-4 w-4 text-primary" />
                  </div>
                  Compression Settings
                </div>

                <div className="grid gap-8 sm:grid-cols-3">
                  {/* Format */}
                  <div className="space-y-3">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                      <FileType className="h-3.5 w-3.5" /> Output Format
                    </label>
                    <div className="flex gap-2">
                      {FORMAT_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setFormat(opt.value)}
                          className={`flex-1 rounded-xl border px-3 py-2.5 text-center text-xs font-semibold transition-all duration-200 ${
                            format === opt.value
                              ? "border-primary bg-primary/10 text-primary shadow-sm"
                              : "border-border bg-muted/30 text-muted-foreground hover:border-primary/30 hover:bg-muted/50"
                          }`}
                        >
                          <div>{opt.label}</div>
                          <div className="mt-0.5 text-[10px] opacity-50">{opt.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quality */}
                  <div className="space-y-3">
                    <label className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Gauge className="h-3.5 w-3.5" /> Quality
                      </span>
                      <span className="font-mono text-sm font-bold text-primary">{quality}%</span>
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
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Smaller file</span>
                      <span>Higher quality</span>
                    </div>
                    {format === "png" && (
                      <p className="text-[10px] text-accent">PNG is lossless — quality slider doesn't apply</p>
                    )}
                  </div>

                  {/* Resize */}
                  <div className="space-y-3">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                      <Maximize className="h-3.5 w-3.5" /> Max Dimension
                    </label>
                    <select
                      value={maxDimension}
                      onChange={(e) => setMaxDimension(Number(e.target.value))}
                      className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-xs font-semibold text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
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
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 animate-fade-in">
              {[
                { icon: Layers, label: "Images", value: String(stats.count), color: "text-primary" },
                { icon: Package, label: "Original", value: formatBytes(stats.totalOriginal), color: "text-muted-foreground" },
                { icon: ArrowRight, label: "Compressed", value: hasCompleted ? formatBytes(stats.totalCompressed) : "—", color: "text-success" },
                { icon: Zap, label: "Saved", value: hasCompleted ? `${stats.savedPct}%` : "—", color: "text-accent" },
              ].map((stat) => (
                <div key={stat.label} className="glass-card flex flex-col items-center p-5 text-center">
                  <stat.icon className={`mb-2 h-4 w-4 ${stat.color}`} />
                  <span className={`font-mono text-xl font-bold ${stat.color}`}>{stat.value}</span>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{stat.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Progress bar */}
          {processing && (
            <div className="mt-6 glass-card p-5 animate-fade-in">
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-semibold">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
                  Processing...
                </span>
                <span className="font-mono font-bold text-primary">
                  {progress.current}/{progress.total}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500 ease-out"
                  style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}

          {/* Action buttons */}
          {images.length > 0 && !processing && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 animate-fade-in">
              <button
                onClick={processAll}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-primary/80 px-8 py-3.5 text-sm font-bold text-primary-foreground shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
              >
                <Zap className="h-4 w-4" /> Compress All
              </button>

              {hasCompleted && (
                <button
                  onClick={downloadZip}
                  className="inline-flex items-center gap-2 rounded-2xl border border-success/20 bg-success/10 px-6 py-3.5 text-sm font-bold text-success transition-all duration-200 hover:bg-success/15"
                >
                  <Download className="h-4 w-4" /> Download ZIP
                </button>
              )}

              <button
                onClick={clearAll}
                className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-6 py-3.5 text-sm font-semibold text-muted-foreground transition-all duration-200 hover:bg-muted/50"
              >
                <Trash2 className="h-4 w-4" /> Clear All
              </button>
            </div>
          )}

          {/* Image grid */}
          {images.length > 0 && (
            <div className="mt-8 animate-fade-in">
              <div className="mb-4 flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground">Image Queue</h3>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                  {stats.count}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {images.map((img) => (
                  <ImageCard key={img.id} image={img} onRemove={removeImage} />
                ))}
              </div>
            </div>
          )}

          {/* Empty state features */}
          {images.length === 0 && (
            <div className="mt-16 animate-fade-in">
              <div className="grid gap-5 sm:grid-cols-3">
                {[
                  {
                    icon: Zap,
                    title: "Lightning Fast",
                    desc: "Client-side processing — no uploads, no waiting, instant results.",
                  },
                  {
                    icon: Shield,
                    title: "100% Private",
                    desc: "Your images never leave your device. Zero data collection.",
                  },
                  {
                    icon: Layers,
                    title: "Batch Processing",
                    desc: "Compress hundreds of images at once with one-click ZIP download.",
                  },
                ].map((f) => (
                  <div key={f.title} className="glass-card p-7 text-center group">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                      <f.icon className="h-5 w-5" />
                    </div>
                    <h3 className="mb-1.5 text-sm font-bold text-foreground">{f.title}</h3>
                    <p className="text-xs leading-relaxed text-muted-foreground">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-border/60 py-8 text-center">
          <p className="text-xs text-muted-foreground/60">
            Built with precision. All processing happens in your browser — your images never leave your device.
          </p>
        </footer>
      </div>
    </div>
  );
}
