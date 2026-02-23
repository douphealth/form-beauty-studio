import { Download, X, Loader2, Check, AlertCircle } from "lucide-react";
import { type ImageFile, formatBytes, getCompressionRatio, downloadBlob } from "@/lib/image-utils";

interface ImageCardProps {
  image: ImageFile;
  onRemove: (id: string) => void;
}

export default function ImageCard({ image, onRemove }: ImageCardProps) {
  const ratio = image.compressedSize != null
    ? getCompressionRatio(image.originalSize, image.compressedSize)
    : null;

  return (
    <div className={`
      glass-card overflow-hidden animate-scale-in transition-all duration-200 group
      ${image.status === 'processing' ? 'ring-1 ring-primary/50 animate-pulse-glow' : ''}
      ${image.status === 'done' ? 'ring-1 ring-success/40' : ''}
      ${image.status === 'error' ? 'ring-1 ring-destructive/40' : ''}
    `}>
      {/* Image preview */}
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        <img
          src={image.previewUrl}
          alt={image.file.name}
          className="h-full w-full object-cover"
          loading="lazy"
        />

        {/* Status badge */}
        <div className="absolute left-2 top-2">
          {image.status === 'pending' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-bold text-accent-foreground uppercase">
              Pending
            </span>
          )}
          {image.status === 'processing' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold text-primary-foreground uppercase">
              <Loader2 className="h-3 w-3 animate-spin" /> Processing
            </span>
          )}
          {image.status === 'done' && ratio !== null && (
            <span className="inline-flex items-center gap-1 rounded-full bg-success px-2.5 py-0.5 text-[10px] font-bold text-success-foreground uppercase">
              <Check className="h-3 w-3" /> -{ratio}%
            </span>
          )}
          {image.status === 'error' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-destructive px-2.5 py-0.5 text-[10px] font-bold text-destructive-foreground uppercase">
              <AlertCircle className="h-3 w-3" /> Error
            </span>
          )}
        </div>

        {/* Remove button */}
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(image.id); }}
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-destructive/90 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Info */}
      <div className="p-3 space-y-1">
        <p className="truncate text-[11px] text-muted-foreground font-mono">
          {image.file.name}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {formatBytes(image.originalSize)}
          </span>
          {image.compressedSize != null && (
            <>
              <span className="text-xs text-muted-foreground">→</span>
              <span className="text-xs font-bold text-success">
                {formatBytes(image.compressedSize)}
              </span>
            </>
          )}
        </div>

        {/* Download button when done */}
        {image.status === 'done' && image.compressedBlob && (
          <button
            onClick={() => downloadBlob(image.compressedBlob!, image.outputFilename)}
            className="mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary/10 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
          >
            <Download className="h-3.5 w-3.5" /> Download
          </button>
        )}

        {image.status === 'error' && image.error && (
          <p className="text-[10px] text-destructive">{image.error}</p>
        )}
      </div>
    </div>
  );
}
