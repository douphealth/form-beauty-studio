import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Lock, Globe, Keyboard, CheckCircle2 } from "lucide-react";
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
import { compressPool } from "@/lib/compress-pool";
import {
  type ImageFile, type OutputFormat, type CompressionOptions,
  formatBytes, getCompressionRatio, downloadBlob,
} from "@/lib/image-utils";

export default function Index() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [format, setFormat] = useState<OutputFormat>("webp");
  const [quality, setQuality] = useState(80);
  const [maxDimension, setMaxDimension] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [previewImage, setPreviewImage] = useState<ImageFile | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const imagesRef = useRef(images);
  imagesRef.current = images;

  // Cleanup all object URLs on unmount
  useEffect(() => {
    return () => {
      imagesRef.current.forEach((img) => {
        URL.revokeObjectURL(img.previewUrl);
        if (img.compressedUrl) URL.revokeObjectURL(img.compressedUrl);
      });
    };
  }, []);

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
    setImages((prev) => {
      prev.forEach((img) => {
        URL.revokeObjectURL(img.previewUrl);
        if (img.compressedUrl) URL.revokeObjectURL(img.compressedUrl);
      });
      return [];
    });
  }, []);

  // Throttled progress update — batch updates to reduce re-renders
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
      batch.forEach((img, idx) => {
        next[idx] = img;
      });
      return next;
    });
  }, []);

  const processAll = useCallback(async () => {
    const currentImages = imagesRef.current;
    if (currentImages.length === 0) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setProcessing(true);
    setProgress({ current: 0, total: currentImages.length });

    const options: CompressionOptions = {
      format,
      quality: quality / 100,
      maxDimension: maxDimension || null,
    };

    const results = await compressPool(
      currentImages,
      options,
      (update) => {
        // Batch updates via rAF to avoid per-image re-renders
        pendingUpdatesRef.current.set(update.index, update.image);
        setProgress({ current: update.completed, total: currentImages.length });

        if (!rafRef.current) {
          rafRef.current = requestAnimationFrame(flushUpdates);
        }
      },
      controller.signal,
    );

    // Final flush
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    pendingUpdatesRef.current.clear();

    setImages(results);
    setProcessing(false);
    const doneCount = results.filter((i) => i.status === "done").length;
    toast.success(`${doneCount} image${doneCount > 1 ? "s" : ""} compressed!`);
  }, [format, quality, maxDimension, flushUpdates]);

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

  return (
    <div className="min-h-screen bg-background transition-colors duration-700">
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
                </h1>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60">
                  Compression Studio
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-1.5 rounded-full border border-border/40 bg-card/30 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-muted-foreground/40 lg:inline-flex">
                <Keyboard className="h-3.5 w-3.5" />
                <kbd className="font-mono text-[10px]">⌘↵</kbd> Compress
                <span className="mx-1 h-3 w-px bg-border/30" />
                <kbd className="font-mono text-[10px]">⌘⇧D</kbd> ZIP
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
                <CompressionSettings
                  format={format}
                  quality={quality}
                  maxDimension={maxDimension}
                  onFormatChange={setFormat}
                  onQualityChange={setQuality}
                  onMaxDimensionChange={setMaxDimension}
                  isOpen={settingsOpen}
                  onToggle={toggleSettings}
                />

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
                />

                <ActionButtons
                  onCompress={processAll}
                  onDownloadZip={downloadZip}
                  onDownloadIndividual={downloadAllIndividually}
                  onClearAll={clearAll}
                  hasCompleted={hasCompleted}
                  processing={processing}
                />

                {/* Image Grid */}
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
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
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
