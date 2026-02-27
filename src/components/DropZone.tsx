import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Image as ImageIcon, ArrowDown, Lock, Zap, Layers } from "lucide-react";
import { toast } from "sonner";
import { createImageFile, validateFile, MAX_FILE_COUNT, type ImageFile } from "@/lib/image-utils";

interface DropZoneProps {
  onFilesAdded: (files: ImageFile[]) => void;
  hasFiles: boolean;
  currentCount?: number;
}

export default function DropZone({ onFilesAdded, hasFiles, currentCount = 0 }: DropZoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

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
      if (valid.length > 0) onFilesAdded(valid);
    },
    [onFilesAdded, currentCount]
  );

  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    setDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setDragging(false);
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      dragCounter.current = 0;
      setDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const features = [
    { icon: Zap, text: "Instant" },
    { icon: Lock, text: "Private" },
    { icon: Layers, text: "Batch" },
  ];

  return (
    <motion.div
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      whileHover={{ scale: 1.003 }}
      whileTap={{ scale: 0.998 }}
      className={`
        relative cursor-pointer overflow-hidden rounded-3xl border-2 border-dashed
        transition-colors duration-500 group
        ${hasFiles ? "py-10 px-8 md:py-12" : "py-16 px-8 md:py-24"}
        text-center
        ${dragging
          ? "border-primary/60 bg-primary/[0.04]"
          : hasFiles
            ? "border-success/25 bg-success/[0.02] hover:border-success/40"
            : "border-border/50 hover:border-primary/25"
        }
      `}
    >
      {/* Mesh gradient background */}
      <div className="pointer-events-none absolute inset-0 mesh-bg opacity-60" />

      {/* Animated glow on drag */}
      <AnimatePresence>
        {dragging && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5 }}
            className="pointer-events-none absolute inset-0"
          >
            <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.08]"
              style={{ filter: 'blur(80px)' }} />
          </motion.div>
        )}
      </AnimatePresence>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => { e.target.files && handleFiles(e.target.files); e.target.value = ''; }}
      />

      <div className="relative z-10">
        {/* Icon */}
        <motion.div
          animate={dragging ? { scale: 1.15, y: -8 } : { scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className={`
            mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-3xl
            transition-colors duration-500
            ${hasFiles
              ? "bg-success/10 text-success"
              : "bg-primary/[0.07] text-primary"
            }
          `}
        >
          <AnimatePresence mode="wait">
            {hasFiles ? (
              <motion.div key="img" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                <ImageIcon className="h-9 w-9" strokeWidth={1.5} />
              </motion.div>
            ) : dragging ? (
              <motion.div key="arrow" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                <ArrowDown className="h-9 w-9 animate-bounce-subtle" strokeWidth={1.5} />
              </motion.div>
            ) : (
              <motion.div key="upload" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                <Upload className="h-9 w-9" strokeWidth={1.5} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Headline */}
        <h2 className="mb-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
          {hasFiles ? "Add More Images" : "Drop Your Images Here"}
        </h2>
        <p className="mx-auto mb-8 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
          {hasFiles
            ? "Drag more files or click to browse"
            : "Drag & drop or click to select — everything runs locally"
          }
        </p>

        {/* Format badges */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {["AVIF", "WebP", "JPG", "PNG", "GIF", "BMP", "TIFF"].map((fmt, i) => (
            <motion.span
              key={fmt}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className="rounded-full border border-border/50 bg-card/40 backdrop-blur-sm px-3.5 py-1.5 text-[11px] font-semibold text-muted-foreground transition-colors duration-300 group-hover:border-primary/15 group-hover:text-foreground/80"
            >
              {fmt}
            </motion.span>
          ))}
        </div>

        {/* Feature pills */}
        {!hasFiles && (
          <div className="mt-10 flex items-center justify-center gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.text}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
                className="flex items-center gap-2 text-xs font-medium text-muted-foreground/60"
              >
                <f.icon className="h-3.5 w-3.5 text-primary/50" strokeWidth={1.5} />
                {f.text}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
