import { motion } from "framer-motion";
import { Download, X, Loader2, Check, AlertCircle } from "lucide-react";
import { type ImageFile, formatBytes, getCompressionRatio, downloadBlob } from "@/lib/image-utils";

interface ImageCardProps {
  image: ImageFile;
  onRemove: (id: string) => void;
  index: number;
}

export default function ImageCard({ image, onRemove, index }: ImageCardProps) {
  const ratio = image.compressedSize != null
    ? getCompressionRatio(image.originalSize, image.compressedSize)
    : null;

  const isProcessing = image.status === 'processing';
  const isDone = image.status === 'done';
  const isError = image.status === 'error';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, y: -10 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 30,
        delay: index * 0.04,
      }}
      className={`
        glass-card overflow-hidden group relative
        ${isProcessing ? 'ring-2 ring-primary/25 animate-pulse-glow' : ''}
        ${isDone ? 'ring-1 ring-success/15' : ''}
        ${isError ? 'ring-1 ring-destructive/15' : ''}
      `}
    >
      {/* Image preview */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted/30">
        <img
          src={image.previewUrl}
          alt={image.file.name}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.08]"
          loading="lazy"
          draggable={false}
        />

        {/* Hover gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-card/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        {/* Status badge */}
        <div className="absolute left-2.5 top-2.5 z-10">
          {image.status === 'pending' && (
            <span className="inline-flex items-center rounded-lg bg-card/70 backdrop-blur-xl px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
              Ready
            </span>
          )}
          {isProcessing && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-bold text-primary-foreground shadow-lg"
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
              className="inline-flex items-center gap-1 rounded-lg bg-success px-3 py-1.5 text-[10px] font-bold text-success-foreground shadow-lg"
            >
              <Check className="h-3 w-3" strokeWidth={3} /> −{ratio}%
            </motion.span>
          )}
          {isError && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-destructive px-3 py-1.5 text-[10px] font-bold text-destructive-foreground shadow-lg">
              <AlertCircle className="h-3 w-3" /> Failed
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
        <p className="truncate text-[11px] font-mono text-muted-foreground/70 leading-none">
          {image.file.name}
        </p>

        <div className="flex items-center gap-1.5 text-xs">
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
          <p className="text-[10px] text-destructive leading-relaxed">{image.error}</p>
        )}
      </div>
    </motion.div>
  );
}
