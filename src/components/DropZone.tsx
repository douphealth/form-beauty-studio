import { useCallback, useRef, useState } from "react";
import { Upload, Image as ImageIcon } from "lucide-react";
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
        relative cursor-pointer rounded-2xl border-2 border-dashed p-8 md:p-12
        text-center transition-all duration-300 ease-out
        ${dragging
          ? "border-primary bg-primary/10 scale-[1.02]"
          : hasFiles
            ? "border-success/50 bg-success/5"
            : "border-border hover:border-primary/50 hover:bg-card/50"
        }
      `}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />

      <div className={`
        mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl
        transition-all duration-300
        ${hasFiles
          ? "bg-success/20 text-success"
          : "bg-primary/10 text-primary"
        }
      `}>
        {hasFiles ? <ImageIcon className="h-9 w-9" /> : <Upload className="h-9 w-9" />}
      </div>

      <h2 className="mb-2 text-xl font-bold text-foreground">
        {hasFiles ? "Add More Images" : "Drop Images Here"}
      </h2>
      <p className="mb-4 text-sm text-muted-foreground">
        {hasFiles
          ? "Drag more files or click to browse"
          : "Drag & drop or click to select — all processing runs locally in your browser"
        }
      </p>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {["JPG", "PNG", "WebP", "GIF", "BMP"].map((fmt) => (
          <span
            key={fmt}
            className="rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs font-semibold text-muted-foreground"
          >
            {fmt}
          </span>
        ))}
      </div>
    </div>
  );
}
