import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { Sparkles, Lock, Globe, Keyboard, CheckCircle2, Wand2 } from "lucide-react";
import JSZip from "jszip";
import { toast } from "sonner";
import DropZone from "@/components/DropZone";
import ImageCard from "@/components/ImageCard";
import ThemeToggle from "@/components/ThemeToggle";
import ImagePreviewModal from "@/components/ImagePreviewModal";
import Footer from "@/components/Footer";
import CompressionSettings from "@/components/CompressionSettings";
import StatsBar from "@/components/StatsBar";
import ActionButtons from "@/components/ActionButtons";
import ProgressBar from "@/components/ProgressBar";
import HeroFeatures from "@/components/HeroFeatures";
import PresetBar from "@/components/PresetBar";
import SelectionToolbar from "@/components/SelectionToolbar";
import { compressPool } from "@/lib/compress-pool";
import { PRESETS, getPreset, type PresetId } from "@/lib/presets";
import {
  type ImageFile, type OutputFormat, type CompressionOptions,
  formatBytes, getCompressionRatio, downloadBlob,
} from "@/lib/image-utils";

const AUTO_COMPRESS_KEY = "imageforge:auto-compress";
const PRESET_KEY = "imageforge:preset";

export default function Index() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [presetId, setPresetId] = useState<PresetId>(() => {
    const saved = localStorage.getItem(PRESET_KEY) as PresetId | null;
    return saved && PRESETS.some((p) => p.id === saved) ? saved : "web";
  });
  const initialPreset = getPreset(presetId) ?? PRESETS[0];
  const [format, setFormat] = useState<OutputFormat>(
    initialPreset.format === "auto" ? "webp" : initialPreset.format
  );
  const [autoPick, setAutoPick] = useState<boolean>(initialPreset.format === "auto");
  const [quality, setQuality] = useState(initialPreset.quality);
  const [maxDimension, setMaxDimension] = useState(initialPreset.maxDimension);
  const [autoCompress, setAutoCompress] = useState<boolean>(() => {
    return localStorage.getItem(AUTO_COMPRESS_KEY) === "true";
  });
  const [processing, setProcessing] = useState(false);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [previewImage, setPreviewImage] = useState<ImageFile | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const abortRef = useRef<AbortController | null>(null);
  const pausedRef = useRef(false);
  const imagesRef = useRef(images);
  imagesRef.current = images;

  // Persist preferences
  useEffect(() => { localStorage.setItem(AUTO_COMPRESS_KEY, String(autoCompress)); }, [autoCompress]);
  useEffect(() => { localStorage.setItem(PRESET_KEY, presetId); }, [presetId]);

  // Cleanup all object URLs on unmount
  useEffect(() => {
    return () => {
      imagesRef.current.forEach((img) => {
        URL.revokeObjectURL(img.previewUrl);
        if (img.compressedUrl) URL.revokeObjectURL(img.compressedUrl);
      });
    };
  }, []);

  // Apply preset
  const applyPreset = useCallback((id: PresetId) => {
    const p = getPreset(id);
    if (!p || id === "custom") return;
    setPresetId(id);
    if (p.format === "auto") {
      setAutoPick(true);
    } else {
      setAutoPick(false);
      setFormat(p.format);
    }
    setQuality(p.quality);
    setMaxDimension(p.maxDimension);
  }, []);

  // Detect "custom" if user manually changes settings
  const markCustom = useCallback(() => {
    setPresetId("custom");
  }, []);

  const handleFormatChange = useCallback((f: OutputFormat) => {
    setFormat(f);
    setAutoPick(false);
    markCustom();
  }, [markCustom]);

  const handleQualityChange = useCallback((q: number) => {
    setQuality(q);
    markCustom();
  }, [markCustom]);

  const handleMaxDimensionChange = useCallback((d: number) => {
    setMaxDimension(d);
    markCustom();
  }, [markCustom]);

  // Throttled progress update
  const pendingUpdatesRef = useRef<Map<number, ImageFile>>(new Map());
  const rafRef = useRef<number | null>(null);

  const flushUpdates = useCallback(() => {
    const updates = pendingUpdatesRef.current;
    if (updates.size === 0) return;
    const batch = new Map(updates);
    updates.clear();
    rafRef.current = null;
    setImages((prev) => {
      const next = [...prev];
      batch.forEach((img, idx) => { next[idx] = img; });
      return next;
    });
  }, []);

  const runCompression = useCallback(async (
    targetImages: ImageFile[],
    opts: { onlyRetry?: boolean } = {}
  ) => {
    if (targetImages.length === 0) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    pausedRef.current = false;
    setPaused(false);
    setProcessing(true);
    setProgress({ current: 0, total: targetImages.length });

    const options: CompressionOptions = {
      format,
      quality: quality / 100,
      maxDimension: maxDimension || null,
    };

    const results = await compressPool(
      targetImages,
      options,
      (update) => {
        // Find the index in current state by id
        const currentIdx = imagesRef.current.findIndex((i) => i.id === update.image.id);
        if (currentIdx >= 0) {
          pendingUpdatesRef.current.set(currentIdx, update.image);
        }
        setProgress({ current: update.completed, total: targetImages.length });
        if (!rafRef.current) {
          rafRef.current = requestAnimationFrame(flushUpdates);
        }
      },
      {
        signal: controller.signal,
        isPaused: () => pausedRef.current,
        autoPick,
        onlyRetry: opts.onlyRetry,
      },
    );

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    pendingUpdatesRef.current.clear();

    // Merge results back by id
    setImages((prev) => {
      const map = new Map(results.map((r) => [r.id, r]));
      return prev.map((img) => map.get(img.id) ?? img);
    });

    setProcessing(false);
    setPaused(false);

    if (controller.signal.aborted) {
      toast.warning("Compression cancelled");
      return;
    }

    const doneCount = results.filter((i) => i.status === "done").length;
    const failedCount = results.filter((i) => i.status === "error").length;
    if (doneCount > 0) {
      toast.success(`${doneCount} image${doneCount > 1 ? "s" : ""} compressed!`);
    }
    if (failedCount > 0) {
      toast.error(`${failedCount} failed — use Retry Failed to try again`);
    }
  }, [format, quality, maxDimension, autoPick, flushUpdates]);

  const processAll = useCallback(() => {
    return runCompression(imagesRef.current);
  }, [runCompression]);

  const retryFailed = useCallback(() => {
    const failed = imagesRef.current.filter(
      (i) => i.status === "error" || i.status === "cancelled"
    );
    if (failed.length === 0) {
      toast.info("Nothing to retry");
      return;
    }
    return runCompression(failed, { onlyRetry: true });
  }, [runCompression]);

  // Handle file additions — auto-compress new ones if enabled
  const handleFilesAdded = useCallback((newFiles: ImageFile[]) => {
    setImages((prev) => [...prev, ...newFiles]);
    toast.success(`${newFiles.length} image${newFiles.length > 1 ? "s" : ""} added`);
    if (autoCompress) {
      // Defer to let state settle
      setTimeout(() => runCompression(newFiles), 50);
    }
  }, [autoCompress, runCompression]);

  const removeImage = useCallback((id: string) => {
    setImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img) {
        URL.revokeObjectURL(img.previewUrl);
        if (img.compressedUrl) URL.revokeObjectURL(img.compressedUrl);
      }
      return prev.filter((i) => i.id !== id);
    });
    setSelected((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    abortRef.current?.abort();
    setImages((prev) => {
      prev.forEach((img) => {
        URL.revokeObjectURL(img.previewUrl);
        if (img.compressedUrl) URL.revokeObjectURL(img.compressedUrl);
      });
      return [];
    });
    setSelected(new Set());
  }, []);

  // Pause / cancel
  const pause = useCallback(() => {
    pausedRef.current = true;
    setPaused(true);
  }, []);
  const resume = useCallback(() => {
    pausedRef.current = false;
    setPaused(false);
  }, []);
  const cancel = useCallback(() => {
    abortRef.current?.abort();
    pausedRef.current = false;
    setPaused(false);
  }, []);

  // Selection handlers
  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelected(new Set(imagesRef.current.map((i) => i.id)));
  }, []);

  const clearSelection = useCallback(() => setSelected(new Set()), []);

  const applyToSelection = useCallback(() => {
    const ids = selected;
    if (ids.size === 0) return;
    setImages((prev) => prev.map((img) => ids.has(img.id) ? {
      ...img,
      override: {
        format: autoPick ? undefined : format,
        quality: quality / 100,
        maxDimension: maxDimension || null,
        auto: autoPick,
      },
    } : img));
    toast.success(`Applied current settings to ${ids.size} image${ids.size > 1 ? "s" : ""}`);
  }, [selected, format, quality, maxDimension, autoPick]);

  const autoPickSelection = useCallback(() => {
    const ids = selected;
    if (ids.size === 0) return;
    setImages((prev) => prev.map((img) => ids.has(img.id) ? {
      ...img,
      override: {
        ...img.override,
        auto: true,
        quality: quality / 100,
        maxDimension: maxDimension || null,
      },
    } : img));
    toast.success(`Auto-pick enabled for ${ids.size} image${ids.size > 1 ? "s" : ""}`);
  }, [selected, quality, maxDimension]);

  const deleteSelection = useCallback(() => {
    const ids = selected;
    if (ids.size === 0) return;
    setImages((prev) => {
      prev.forEach((img) => {
        if (ids.has(img.id)) {
          URL.revokeObjectURL(img.previewUrl);
          if (img.compressedUrl) URL.revokeObjectURL(img.compressedUrl);
        }
      });
      return prev.filter((img) => !ids.has(img.id));
    });
    setSelected(new Set());
    toast.success(`Removed ${ids.size} image${ids.size > 1 ? "s" : ""}`);
  }, [selected]);

  const downloadZip = useCallback(async () => {
    const completed = imagesRef.current.filter((i) => i.status === "done" && i.compressedBlob);
    if (completed.length === 0) return;
    const zip = new JSZip();
    completed.forEach((img) => zip.file(img.outputFilename, img.compressedBlob!));
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, `imageforge-${Date.now()}.zip`);
    toast.success("ZIP downloaded!");
  }, []);

  const downloadAllIndividually = useCallback(() => {
    const completed = imagesRef.current.filter((i) => i.status === "done" && i.compressedBlob);
    completed.forEach((img) => downloadBlob(img.compressedBlob!, img.outputFilename));
    toast.success(`${completed.length} files downloaded!`);
  }, []);

  const toggleSettings = useCallback(() => setSettingsOpen((o) => !o), []);

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
        clearSelection();
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "d") {
        e.preventDefault();
        downloadZip();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "a" && imagesRef.current.length > 0) {
        e.preventDefault();
        selectAll();
      }
      if ((e.key === " " || e.code === "Space") && processing) {
        e.preventDefault();
        if (pausedRef.current) resume(); else pause();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [processAll, downloadZip, selectAll, clearSelection, processing, pause, resume]);

  const stats = useMemo(() => {
    const totalOriginal = images.reduce((s, i) => s + i.originalSize, 0);
    const completed = images.filter((i) => i.status === "done" && i.compressedSize != null);
    const totalCompressed = completed.reduce((s, i) => s + (i.compressedSize || 0), 0);
    const savedPct = completed.length > 0 ? getCompressionRatio(totalOriginal, totalCompressed) : 0;
    const failedCount = images.filter((i) => i.status === "error" || i.status === "cancelled").length;
    return {
      count: images.length,
      totalOriginal,
      totalCompressed,
      savedPct,
      completedCount: completed.length,
      failedCount,
    };
  }, [images]);

  const hasCompleted = stats.completedCount > 0;

  return (
    <div className="min-h-screen bg-background transition-colors duration-700">
      <Helmet>
        <title>ImageForge — Enterprise Image Compression Studio</title>
        <meta name="description" content="Compress, convert, and resize images in WebP, AVIF, JPEG, and PNG. Free, private, runs entirely in your browser — no uploads, no accounts." />
        <link rel="canonical" href="https://imagealchemy.app/" />
        <meta property="og:title" content="ImageForge — Enterprise Image Compression Studio" />
        <meta property="og:description" content="Private, browser-based batch compression for WebP, AVIF, JPEG, and PNG with smart presets and auto-pick smallest format." />
        <meta property="og:url" content="https://imagealchemy.app/" />
      </Helmet>
      {/* Ambient orbs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="glow-orb absolute -left-48 -top-48 h-[700px] w-[700px] rounded-full bg-primary" />
        <div className="glow-orb absolute -bottom-48 -right-48 h-[600px] w-[600px] rounded-full bg-accent" style={{ animationDelay: '-8s' }} />
        <div className="glow-orb absolute left-1/3 top-1/2 h-[400px] w-[400px] rounded-full bg-success" style={{ animationDelay: '-14s' }} />
      </div>

      <div className="relative z-10">
        {/* Header */}
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
                  <span className="sr-only"> — Compression Studio</span>
                </h1>
                <p aria-hidden="true" className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Compression Studio
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Auto-compress toggle */}
              <button
                onClick={() => setAutoCompress((v) => !v)}
                className={`hidden items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all sm:inline-flex ${
                  autoCompress
                    ? "border-primary/40 bg-primary/[0.08] text-primary"
                    : "border-border/40 bg-card/30 text-muted-foreground hover:text-foreground"
                }`}
                title="Auto-compress newly added images"
              >
                <Wand2 className="h-3.5 w-3.5" strokeWidth={2} />
                Auto-compress {autoCompress ? "ON" : "OFF"}
              </button>

              <div className="hidden items-center gap-1.5 rounded-full border border-border/40 bg-card/30 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-muted-foreground/40 lg:inline-flex">
                <Keyboard className="h-3.5 w-3.5" />
                <kbd className="font-mono text-[10px]">⌘↵</kbd> Compress
                <span className="mx-1 h-3 w-px bg-border/30" />
                <kbd className="font-mono text-[10px]">Space</kbd> Pause
              </div>
              <div className="hidden items-center gap-1.5 rounded-full border border-border/40 bg-card/30 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-muted-foreground/60 sm:inline-flex">
                <Lock className="h-3.5 w-3.5" /> Private
                <span className="mx-1.5 h-3 w-px bg-border/50" />
                <Globe className="h-3.5 w-3.5" /> Browser-only
              </div>
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-16">
          <DropZone onFilesAdded={handleFilesAdded} hasFiles={images.length > 0} currentCount={images.length} />

          <AnimatePresence mode="wait">
            {images.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <h2 className="sr-only">Compression presets</h2>
                <PresetBar activeId={presetId} onSelect={applyPreset} />

                <h2 className="sr-only">Compression settings</h2>
                <CompressionSettings
                  format={format}
                  quality={quality}
                  maxDimension={maxDimension}
                  onFormatChange={handleFormatChange}
                  onQualityChange={handleQualityChange}
                  onMaxDimensionChange={handleMaxDimensionChange}
                  isOpen={settingsOpen}
                  onToggle={toggleSettings}
                  autoPick={autoPick}
                  onAutoPickChange={(v) => { setAutoPick(v); markCustom(); }}
                />

                <h2 className="sr-only">Batch statistics</h2>
                <StatsBar
                  count={stats.count}
                  totalOriginal={stats.totalOriginal}
                  totalCompressed={stats.totalCompressed}
                  savedPct={stats.savedPct}
                  hasCompleted={hasCompleted}
                />

                <ProgressBar
                  processing={processing}
                  current={progress.current}
                  total={progress.total}
                  paused={paused}
                  onPause={pause}
                  onResume={resume}
                  onCancel={cancel}
                />

                <ActionButtons
                  onCompress={processAll}
                  onDownloadZip={downloadZip}
                  onDownloadIndividual={downloadAllIndividually}
                  onClearAll={clearAll}
                  onRetryFailed={retryFailed}
                  hasCompleted={hasCompleted}
                  hasFailed={stats.failedCount > 0}
                  processing={processing}
                />

                {/* Image Grid */}
                <div className="mt-12">
                  <div className="mb-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h2 className="text-sm font-bold text-foreground">Image Queue</h2>
                      <motion.span
                        key={stats.count}
                        initial={{ scale: 0.5 }}
                        animate={{ scale: 1 }}
                        className="rounded-lg bg-primary/[0.08] px-2.5 py-1 font-mono text-xs font-bold text-primary tabular-nums"
                      >
                        {stats.count}
                      </motion.span>
                      <span className="hidden text-[11px] font-medium text-muted-foreground sm:inline">
                        ⇧/⌘+click to select
                      </span>
                    </div>
                    {hasCompleted && (
                      <span className="flex items-center gap-1.5 text-[11px] font-medium text-success">
                        <CheckCircle2 className="h-3 w-3" /> {stats.completedCount} done
                      </span>
                    )}
                  </div>

                  <SelectionToolbar
                    selectedCount={selected.size}
                    totalCount={images.length}
                    onSelectAll={selectAll}
                    onClearSelection={clearSelection}
                    onApplyToSelection={applyToSelection}
                    onDeleteSelection={deleteSelection}
                    onAutoPickSelection={autoPickSelection}
                  />

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    <AnimatePresence mode="popLayout">
                      {images.map((img, i) => (
                        <ImageCard
                          key={img.id}
                          image={img}
                          onRemove={removeImage}
                          onPreview={setPreviewImage}
                          index={i}
                          selected={selected.has(img.id)}
                          onToggleSelect={toggleSelect}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty State */}
          <AnimatePresence>
            {images.length === 0 && <HeroFeatures />}
          </AnimatePresence>
        </main>

        <Footer />
      </div>

      {previewImage && (
        <ImagePreviewModal image={previewImage} onClose={() => setPreviewImage(null)} />
      )}
    </div>
  );
}
