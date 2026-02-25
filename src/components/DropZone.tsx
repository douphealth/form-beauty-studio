import { useCallback, useRef, useState } from "react";
import { Upload, Image as ImageIcon, Sparkles, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { isAcceptedImage, createImageFile, validateFile, MAX_FILE_COUNT, type ImageFile } from "@/lib/image-utils";

interface DropZoneProps {
  onFilesAdded: (files: ImageFile[]) => void;
  hasFiles: boolean;
  currentCount?: number;
}

export default function DropZone({ onFilesAdded, hasFiles, currentCount = 0 }: DropZoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (fileList: FileList | File[]) => {
      const rawFiles = Array.from(fileList);
      const remaining = MAX_FILE_COUNT - currentCount;

      if (remaining <= 0) {
        toast.error(`Max ${MAX_FILE_COUNT} images allowed.`);
        return;
      }

      const capped = rawFiles.slice(0, remaining);
      if (capped.length < rawFiles.length) {
        toast.warning(`Only ${capped.length} of ${rawFiles.length} files added (limit: ${MAX_FILE_COUNT}).`);
      }

      const valid: ImageFile[] = [];
      for (const file of capped) {
        const error = validateFile(file);
        if (error) {
          toast.error(`${file.name}: ${error}`);
        } else {
          valid.push(createImageFile(file));
        }
      }

      if (valid.length > 0) {
        onFilesAdded(valid);
      }
    },
    [onFilesAdded, currentCount]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      className={`
        relative cursor-pointer overflow-hidden rounded-3xl border-2 border-dashed
        transition-all duration-700 ease-out group noise-texture
        ${hasFiles ? "p-8 md:p-10" : "p-12 md:p-20"}
        text-center
        ${dragging
          ? "border-primary bg-primary/[0.04] scale-[1.005] shadow-[var(--shadow-elevated)]"
          : hasFiles
            ? "border-success/30 bg-success/[0.02] hover:border-success/50 hover:shadow-lg"
            : "border-border/60 hover:border-primary/30 hover:shadow-[var(--shadow-glow)]"
        }
      `}
    >
      {/* Animated gradient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className={`absolute -left-32 -top-32 h-80 w-80 rounded-full bg-primary/[0.06] transition-all duration-1000 ${dragging ? 'scale-150 opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
          style={{ filter: 'blur(60px)', animation: 'blob 10s ease-in-out infinite' }} />
        <div className={`absolute -bottom-32 -right-32 h-64 w-64 rounded-full bg-accent/[0.06] transition-all duration-1000 ${dragging ? 'scale-150 opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
          style={{ filter: 'blur(60px)', animation: 'blob 10s ease-in-out infinite reverse' }} />
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />

      <div className="relative">
        <div className={`
          mx-auto mb-7 flex h-24 w-24 items-center justify-center rounded-[28px]
          transition-all duration-700 group-hover:scale-105 group-hover:-translate-y-1
          ${dragging ? 'scale-110 -translate-y-2' : ''}
          ${hasFiles
            ? "bg-success/10 text-success shadow-[0_0_40px_-10px_hsl(var(--success)/0.3)]"
            : "bg-primary/[0.08] text-primary shadow-[0_0_40px_-10px_hsl(var(--primary)/0.2)]"
          }
        `}>
          {hasFiles
            ? <ImageIcon className="h-10 w-10" />
            : dragging
              ? <ArrowDown className="h-10 w-10 animate-bounce-subtle" />
              : <Upload className="h-10 w-10" />
          }
        </div>

        <h2 className="mb-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {hasFiles ? "Add More Images" : "Drop Your Images Here"}
        </h2>
        <p className="mx-auto mb-7 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
          {hasFiles
            ? "Drag more files or click to browse"
            : "Drag & drop or click to select — everything runs locally, 100% private"
          }
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {["JPG", "PNG", "WebP", "GIF", "BMP", "TIFF"].map((fmt, i) => (
            <span
              key={fmt}
              className="rounded-full border border-border/60 bg-card/50 backdrop-blur-sm px-3.5 py-1.5 text-[11px] font-semibold text-muted-foreground transition-all duration-300 group-hover:border-primary/20 group-hover:text-foreground"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {fmt}
            </span>
          ))}
        </div>

        {!hasFiles && (
          <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-border/40 bg-card/30 backdrop-blur-sm px-4 py-2 text-xs text-muted-foreground/70">
            <Sparkles className="h-3.5 w-3.5 text-primary/60" />
            No uploads — everything stays on your device
          </div>
        )}
      </div>
    </div>
  );
}
