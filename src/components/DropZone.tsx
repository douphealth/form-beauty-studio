import { useCallback, useRef, useState } from "react";
import { Upload, Image as ImageIcon, Sparkles } from "lucide-react";
import { isAcceptedImage, createImageFile, type ImageFile } from "@/lib/image-utils";

interface DropZoneProps {
  onFilesAdded: (files: ImageFile[]) => void;
  hasFiles: boolean;
}

export default function DropZone({ onFilesAdded, hasFiles }: DropZoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (fileList: FileList | File[]) => {
      const files = Array.from(fileList).filter(isAcceptedImage);
      if (files.length > 0) {
        onFilesAdded(files.map(createImageFile));
      }
    },
    [onFilesAdded]
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
        p-10 md:p-16 text-center transition-all duration-500 ease-out group
        ${dragging
          ? "border-primary bg-primary/5 scale-[1.01] shadow-lg"
          : hasFiles
            ? "border-success/40 bg-success/5 hover:border-success/60"
            : "border-border hover:border-primary/40 hover:shadow-lg"
        }
      `}
    >
      {/* Ambient gradient background */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
        <div className="absolute -left-20 -top-20 h-60 w-60 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-accent/5 blur-3xl" />
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
          mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl
          transition-all duration-500 group-hover:scale-110
          ${hasFiles
            ? "bg-success/10 text-success"
            : "bg-primary/10 text-primary"
          }
        `}>
          {hasFiles
            ? <ImageIcon className="h-9 w-9" />
            : <Upload className="h-9 w-9" />
          }
        </div>

        <h2 className="mb-2 text-2xl font-bold text-foreground">
          {hasFiles ? "Add More Images" : "Drop Your Images Here"}
        </h2>
        <p className="mx-auto mb-6 max-w-md text-sm text-muted-foreground">
          {hasFiles
            ? "Drag more files or click to browse"
            : "Drag & drop or click to select — everything runs locally in your browser, 100% private"
          }
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {["JPG", "PNG", "WebP", "GIF", "BMP"].map((fmt) => (
            <span
              key={fmt}
              className="rounded-full border border-border bg-muted/50 px-3 py-1 text-[11px] font-medium text-muted-foreground transition-colors group-hover:border-primary/20"
            >
              {fmt}
            </span>
          ))}
        </div>

        {!hasFiles && (
          <div className="mt-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground/60">
            <Sparkles className="h-3 w-3" />
            No uploads — everything stays on your device
          </div>
        )}
      </div>
    </div>
  );
}
