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
      glass-card overflow-hidden animate-scale-in group relative noise-texture
      ${image.status === 'processing' ? 'ring-2 ring-primary/30 animate-pulse-glow' : ''}
      ${image.status === 'done' ? 'ring-1 ring-success/20' : ''}
      ${image.status === 'error' ? 'ring-1 ring-destructive/20' : ''}
    `}>
      {/* Image preview */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted/50">
        <img
          src={image.previewUrl}
          alt={image.file.name}
          className="h-full w-full object-cover transition-all duration-700 ease-out group-hover:scale-110"
          loading="lazy"
        />

        {/* Cinematic overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-0 transition-all duration-500 group-hover:opacity-100" />

        {/* Status badge */}
        <div className="absolute left-2.5 top-2.5">
          {image.status === 'pending' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-card/80 backdrop-blur-xl px-2.5 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
              Ready
            </span>
          )}
          {image.status === 'processing' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary backdrop-blur-xl px-3 py-1.5 text-[10px] font-bold text-primary-foreground uppercase tracking-widest shadow-lg">
              <Loader2 className="h-3 w-3 animate-spin" /> Working
            </span>
          )}
          {image.status === 'done' && ratio !== null && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success backdrop-blur-xl px-3 py-1.5 text-[10px] font-bold text-success-foreground uppercase tracking-widest shadow-lg">
              <Check className="h-3 w-3" /> -{ratio}%
            </span>
          )}
          {image.status === 'error' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive backdrop-blur-xl px-3 py-1.5 text-[10px] font-bold text-destructive-foreground uppercase tracking-widest shadow-lg">
              <AlertCircle className="h-3 w-3" /> Error
            </span>
          )}
        </div>

        {/* Remove button */}
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(image.id); }}
          className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-card/60 backdrop-blur-xl text-muted-foreground opacity-0 transition-all duration-300 hover:bg-destructive hover:text-destructive-foreground hover:scale-110 group-hover:opacity-100"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Info */}
      <div className="p-3.5 space-y-2">
        <p className="truncate text-[11px] text-muted-foreground font-mono leading-none">
          {image.file.name}
        </p>

        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-medium">
            {formatBytes(image.originalSize)}
          </span>
          {image.compressedSize != null && (
            <>
              <span className="text-border">→</span>
              <span className="font-bold text-success">
                {formatBytes(image.compressedSize)}
              </span>
            </>
          )}
        </div>

        {/* Download button when done */}
        {image.status === 'done' && image.compressedBlob && (
          <button
            onClick={() => downloadBlob(image.compressedBlob!, image.outputFilename)}
            className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary/10 py-2.5 text-xs font-bold text-primary transition-all duration-300 hover:bg-primary hover:text-primary-foreground hover:shadow-lg"
          >
            <Download className="h-3.5 w-3.5" /> Download
          </button>
        )}

        {image.status === 'error' && image.error && (
          <p className="text-[10px] text-destructive leading-relaxed">{image.error}</p>
        )}
      </div>
    </div>
  );
}
