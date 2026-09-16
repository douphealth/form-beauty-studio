import { useState, useCallback, useRef } from "react";
import { MotionDiv, MotionSection, MotionNav, MotionA, MotionSpan, MotionP, MotionButton, MotionLi, AnimatePresence } from "@/lib/motion";
import { X, Download, ZoomIn, ZoomOut, ArrowLeftRight, Check } from "lucide-react";
import { type ImageFile, formatBytes, getCompressionRatio, downloadBlob } from "@/lib/image-utils";

interface ImagePreviewModalProps {
  image: ImageFile | null;
  onClose: () => void;
}

export default function ImagePreviewModal({ image, onClose }: ImagePreviewModalProps) {
  const [showCompressed, setShowCompressed] = useState(false);
  const [sliderPos, setSliderPos] = useState(50);
  const [compareMode, setCompareMode] = useState(false);
  const [zoom, setZoom] = useState(1);
  const sliderRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const ratio = image?.compressedSize != null
    ? getCompressionRatio(image.originalSize, image.compressedSize)
    : null;

  const updateSliderFromClient = useCallback((clientX: number) => {
    const el = sliderRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    setSliderPos(Math.max(0, Math.min(100, x)));
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    updateSliderFromClient(e.clientX);
  }, [updateSliderFromClient]);

  const handleTouchStart = useCallback(() => {
    draggingRef.current = true;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length > 0) {
      e.preventDefault();
      updateSliderFromClient(e.touches[0].clientX);
    }
  }, [updateSliderFromClient]);

  const handleTouchEnd = useCallback(() => {
    draggingRef.current = false;
  }, []);

  if (!image) return null;

  const isDone = image.status === "done" && image.compressedUrl;

  return (
    <AnimatePresence>
      <MotionDiv
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-2xl p-4"
        onClick={onClose}
      >
        <MotionDiv
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="glass-card relative max-h-[90vh] w-full max-w-4xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/30 px-6 py-4">
            <div className="min-w-0 flex-1">
              <p className="truncate font-mono text-xs text-muted-foreground">{image.file.name}</p>
              <div className="mt-1 flex items-center gap-3 text-xs">
                <span className="text-muted-foreground tabular-nums">{formatBytes(image.originalSize)}</span>
                {image.compressedSize != null && (
                  <>
                    <span className="text-muted-foreground/30">→</span>
                    <span className="font-bold text-success tabular-nums">{formatBytes(image.compressedSize)}</span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-success/10 px-2 py-0.5 text-[10px] font-bold text-success">
                      <Check className="h-2.5 w-2.5" strokeWidth={3} /> −{ratio}%
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 ml-4">
              {isDone && (
                <>
                  <button
                    onClick={() => setCompareMode(!compareMode)}
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-semibold transition-all duration-300 ${
                      compareMode
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "border border-border/40 text-muted-foreground hover:text-foreground hover:border-border/60"
                    }`}
                  >
                    <ArrowLeftRight className="h-3 w-3" /> Compare
                  </button>

                  {!compareMode && (
                    <button
                      onClick={() => setShowCompressed(!showCompressed)}
                      className="rounded-xl border border-border/40 px-3 py-2 text-[11px] font-semibold text-muted-foreground transition-all hover:text-foreground hover:border-border/60"
                    >
                      {showCompressed ? "Original" : "Compressed"}
                    </button>
                  )}
                </>
              )}

              <div className="flex items-center gap-1 rounded-xl border border-border/40 px-1 py-0.5">
                <button
                  onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                  aria-label="Zoom out"
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>
                <span className="min-w-[36px] text-center font-mono text-[10px] text-muted-foreground">{Math.round(zoom * 100)}%</span>
                <button
                  onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                  aria-label="Zoom in"
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
              </div>

              <button
                onClick={onClose}
                aria-label="Close preview"
                className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Image area */}
          <div className="relative overflow-auto bg-muted/20" style={{ maxHeight: "calc(90vh - 140px)" }}>
            {compareMode && isDone ? (
              <div
                ref={sliderRef}
                className="relative cursor-col-resize select-none touch-none"
                onMouseMove={handleMouseMove}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {/* Original (full width underneath) */}
                <img
                  src={image.previewUrl}
                  alt={`Original uncompressed version of ${image.file.name}`}
                  className="block w-full"
                  style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}
                  draggable={false}
                />
                {/* Compressed (clipped by slider) */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${sliderPos}%` }}
                >
                  <img
                    src={image.compressedUrl!}
                    alt={`Compressed version of ${image.file.name}`}
                    className="block w-full"
                    style={{
                      transform: `scale(${zoom})`,
                      transformOrigin: "center",
                      width: `${(100 / sliderPos) * 100}%`,
                      maxWidth: "none",
                    }}
                    draggable={false}
                  />
                </div>
                {/* Slider line */}
                <div
                  className="absolute top-0 bottom-0 z-10 w-0.5 bg-primary shadow-lg"
                  style={{ left: `${sliderPos}%` }}
                >
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl">
                    <ArrowLeftRight className="h-4 w-4" />
                  </div>
                </div>
                {/* Labels */}
                <div className="absolute left-3 top-3 z-10 rounded-lg bg-card/70 backdrop-blur-xl px-2.5 py-1 text-[10px] font-bold text-foreground">
                  Compressed
                </div>
                <div className="absolute right-3 top-3 z-10 rounded-lg bg-card/70 backdrop-blur-xl px-2.5 py-1 text-[10px] font-bold text-foreground">
                  Original
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center p-4">
                <img
                  src={showCompressed && isDone ? image.compressedUrl! : image.previewUrl}
                  alt={`${showCompressed ? "Compressed" : "Original"} preview of ${image.file.name}`}
                  className="max-w-full transition-transform duration-300"
                  style={{ transform: `scale(${zoom})` }}
                  draggable={false}
                />
              </div>
            )}
          </div>

          {/* Footer */}
          {isDone && image.compressedBlob && (
            <div className="border-t border-border/30 px-6 py-3 flex justify-end">
              <button
                onClick={() => downloadBlob(image.compressedBlob!, image.outputFilename)}
                className="btn-primary inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-bold text-primary-foreground"
              >
                <Download className="h-3.5 w-3.5" strokeWidth={2.5} /> Download
              </button>
            </div>
          )}
        </MotionDiv>
      </MotionDiv>
    </AnimatePresence>
  );
}
