import { memo } from "react";
import { motion } from "framer-motion";
import { Download, X, Loader2, Check, AlertCircle, CircleSlash, Sparkles } from "lucide-react";
import { type ImageFile, formatBytes, getCompressionRatio, downloadBlob } from "@/lib/image-utils";

interface ImageCardProps {
  image: ImageFile;
  onRemove: (id: string) => void;
  onPreview?: (image: ImageFile) => void;
  index: number;
  selected?: boolean;
  onToggleSelect?: (id: string, e: React.MouseEvent) => void;
}

function ImageCard({ image, onRemove, onPreview, index, selected, onToggleSelect }: ImageCardProps) {
  const ratio = image.compressedSize != null
    ? getCompressionRatio(image.originalSize, image.compressedSize)
    : null;

  const isProcessing = image.status === 'processing';
  const isDone = image.status === 'done';
  const isError = image.status === 'error';
  const isCancelled = image.status === 'cancelled';
  const hasOverride = !!image.override;

  const staggerDelay = Math.min(index * 0.04, 0.6);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, y: -10 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 30,
        delay: staggerDelay,
      }}
      className={`
        glass-card overflow-hidden group relative
        ${isProcessing ? 'ring-2 ring-primary/25 animate-pulse-glow' : ''}
        ${isDone ? 'ring-1 ring-success/15' : ''}
        ${isError ? 'ring-1 ring-destructive/15' : ''}
        ${isCancelled ? 'ring-1 ring-muted-foreground/20 opacity-70' : ''}
        ${selected ? 'ring-2 ring-primary/60' : ''}
      `}
    >
      {/* Image preview */}
      <div
        className="relative aspect-[4/3] overflow-hidden bg-muted/30 cursor-pointer"
        onClick={(e) => {
          if (e.shiftKey || e.metaKey || e.ctrlKey) {
            onToggleSelect?.(image.id, e);
          } else {
            onPreview?.(image);
          }
        }}
      >
        <img
          src={image.previewUrl}
          alt={`Preview of uploaded image, ${formatBytes(image.originalSize)}`}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.08]"
          loading="lazy"
          decoding="async"
          draggable={false}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-card/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        {/* Selection checkbox */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleSelect?.(image.id, e); }}
          className={`absolute left-2.5 bottom-2.5 z-10 flex h-6 w-6 items-center justify-center rounded-md border-2 backdrop-blur-md transition-all ${
            selected
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border/60 bg-card/50 text-transparent opacity-0 group-hover:opacity-100 hover:border-primary"
          }`}
          aria-label={selected ? "Deselect image" : "Select image"}
        >
          {selected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
        </button>

        {/* Status badge */}
        <div className="absolute left-2.5 top-2.5 z-10 flex flex-col gap-1.5">
          {image.status === 'pending' && (
             <span className="inline-flex items-center rounded-lg bg-card/70 backdrop-blur-xl px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
              Ready
            </span>
          )}
          {isProcessing && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold text-primary-foreground shadow-lg"
              style={{ background: 'var(--gradient-primary)' }}
            >
              <Loader2 className="h-3 w-3 animate-spin" /> Compressing
            </motion.span>
          )}
          {isDone && ratio !== null && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500 }}
              className="inline-flex items-center gap-1 rounded-lg bg-success px-3 py-1.5 text-[11px] font-bold text-success-foreground shadow-lg"
            >
              <Check className="h-3 w-3" strokeWidth={3} /> −{ratio}%
            </motion.span>
          )}
          {isError && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-destructive px-3 py-1.5 text-[11px] font-bold text-destructive-foreground shadow-lg">
              <AlertCircle className="h-3 w-3" /> Failed
            </span>
          )}
          {isCancelled && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-muted px-3 py-1.5 text-[11px] font-bold text-muted-foreground shadow-lg">
              <CircleSlash className="h-3 w-3" /> Cancelled
            </span>
          )}
          {hasOverride && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-accent/90 px-2 py-0.5 text-[10px] font-bold text-accent-foreground shadow">
              <Sparkles className="h-2.5 w-2.5" /> custom
            </span>
          )}
          {isDone && image.chosenFormat && image.override?.auto && (
            <span className="inline-flex items-center rounded-lg bg-card/80 backdrop-blur-xl px-2 py-0.5 text-[10px] font-bold uppercase text-foreground shadow">
              {image.chosenFormat}
            </span>
          )}
        </div>

        {/* Remove button */}
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(image.id); }}
          className="absolute right-2.5 top-2.5 z-10 flex h-7 w-7 items-center justify-center rounded-lg bg-card/50 backdrop-blur-xl text-muted-foreground opacity-0 transition-all duration-300 hover:bg-destructive hover:text-destructive-foreground group-hover:opacity-100"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2.5} />
        </button>

        {/* Download overlay when done */}
        {isDone && image.compressedBlob && (
          <button
            onClick={(e) => { e.stopPropagation(); downloadBlob(image.compressedBlob!, image.outputFilename); }}
            className="absolute inset-x-3 bottom-3 z-10 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold text-primary-foreground opacity-0 transition-all duration-300 group-hover:opacity-100"
            style={{ background: 'var(--gradient-primary)' }}
          >
            <Download className="h-3.5 w-3.5" strokeWidth={2.5} /> Download
          </button>
        )}
      </div>

      {/* Info footer */}
      <div className="relative z-10 p-3.5 space-y-1.5">
        <p className="truncate text-xs font-mono text-muted-foreground/70 leading-none">
          {image.file.name}
        </p>

        <div className="flex items-center gap-1.5 text-sm">
          <span className="text-muted-foreground font-medium tabular-nums">
            {formatBytes(image.originalSize)}
          </span>
          {image.compressedSize != null && (
            <>
              <span className="text-muted-foreground/30">→</span>
              <span className="font-bold text-success tabular-nums">
                {formatBytes(image.compressedSize)}
              </span>
            </>
          )}
        </div>

        {isError && image.error && (
          <p className="text-[11px] text-destructive leading-relaxed">{image.error}</p>
        )}
      </div>
    </motion.div>
  );
}

export default memo(ImageCard, (prev, next) => {
  return (
    prev.image.id === next.image.id &&
    prev.image.status === next.image.status &&
    prev.image.compressedSize === next.image.compressedSize &&
    prev.image.override === next.image.override &&
    prev.image.chosenFormat === next.image.chosenFormat &&
    prev.selected === next.selected &&
    prev.index === next.index
  );
});
