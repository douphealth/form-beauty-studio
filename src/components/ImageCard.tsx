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
      glass-card overflow-hidden animate-scale-in group
      ${image.status === 'processing' ? 'ring-2 ring-primary/40 animate-pulse-glow' : ''}
      ${image.status === 'done' ? 'ring-1 ring-success/30' : ''}
      ${image.status === 'error' ? 'ring-1 ring-destructive/30' : ''}
    `}>
      {/* Image preview */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={image.previewUrl}
          alt={image.file.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Status badge */}
        <div className="absolute left-2 top-2">
          {image.status === 'pending' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted/90 backdrop-blur-sm px-2.5 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Pending
            </span>
          )}
          {image.status === 'processing' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/90 backdrop-blur-sm px-2.5 py-1 text-[10px] font-bold text-primary-foreground uppercase tracking-wider">
              <Loader2 className="h-3 w-3 animate-spin" /> Processing
            </span>
          )}
          {image.status === 'done' && ratio !== null && (
            <span className="inline-flex items-center gap-1 rounded-full bg-success/90 backdrop-blur-sm px-2.5 py-1 text-[10px] font-bold text-success-foreground uppercase tracking-wider">
              <Check className="h-3 w-3" /> -{ratio}%
            </span>
          )}
          {image.status === 'error' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-destructive/90 backdrop-blur-sm px-2.5 py-1 text-[10px] font-bold text-destructive-foreground uppercase tracking-wider">
              <AlertCircle className="h-3 w-3" /> Error
            </span>
          )}
        </div>

        {/* Remove button */}
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(image.id); }}
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm text-muted-foreground opacity-0 transition-all hover:bg-destructive hover:text-destructive-foreground group-hover:opacity-100"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Info */}
      <div className="p-3 space-y-1.5">
        <p className="truncate text-[11px] text-muted-foreground font-mono">
          {image.file.name}
        </p>

        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {formatBytes(image.originalSize)}
          </span>
          {image.compressedSize != null && (
            <>
              <span className="text-muted-foreground/40">→</span>
              <span className="font-semibold text-success">
                {formatBytes(image.compressedSize)}
              </span>
            </>
          )}
        </div>

        {/* Download button when done */}
        {image.status === 'done' && image.compressedBlob && (
          <button
            onClick={() => downloadBlob(image.compressedBlob!, image.outputFilename)}
            className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary/10 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
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
