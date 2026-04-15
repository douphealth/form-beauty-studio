import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings2, ChevronDown, FileType, Gauge, Maximize } from "lucide-react";
import type { OutputFormat } from "@/lib/image-utils";

const FORMAT_OPTIONS: { value: OutputFormat; label: string; desc: string; icon: string }[] = [
  { value: "avif", label: "AVIF", desc: "Best quality/size", icon: "🏆" },
  { value: "webp", label: "WebP", desc: "Great compression", icon: "⚡" },
  { value: "jpeg", label: "JPEG", desc: "Universal", icon: "🌐" },
  { value: "png", label: "PNG", desc: "Lossless", icon: "💎" },
];

const RESIZE_OPTIONS = [
  { value: 0, label: "Original Size" },
  { value: 3840, label: "4K — 3840px" },
  { value: 2048, label: "2K — 2048px" },
  { value: 1920, label: "Full HD — 1920px" },
  { value: 1280, label: "HD — 1280px" },
  { value: 800, label: "Web — 800px" },
  { value: 480, label: "Thumbnail — 480px" },
];

interface CompressionSettingsProps {
  format: OutputFormat;
  quality: number;
  maxDimension: number;
  onFormatChange: (f: OutputFormat) => void;
  onQualityChange: (q: number) => void;
  onMaxDimensionChange: (d: number) => void;
  isOpen: boolean;
  onToggle: () => void;
}

function CompressionSettings({
  format, quality, maxDimension,
  onFormatChange, onQualityChange, onMaxDimensionChange,
  isOpen, onToggle,
}: CompressionSettingsProps) {
  return (
    <div className="mt-10">
      <button
        onClick={onToggle}
        className="mb-4 flex w-full items-center justify-between rounded-2xl border border-border/40 bg-card/30 backdrop-blur-sm px-5 py-3.5 text-sm font-semibold text-foreground transition-colors duration-300 hover:bg-card/50"
      >
        <span className="flex items-center gap-2.5">
          <Settings2 className="h-4 w-4 text-primary" strokeWidth={1.5} />
          Compression Settings
        </span>
        <motion.span animate={{ rotate: isOpen ? 180 : 0 }}>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </motion.span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="glass-card p-6 sm:p-8">
              <div className="grid gap-8 sm:grid-cols-3">
                {/* Format */}
                <div className="space-y-3">
                  <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
                    <FileType className="h-3.5 w-3.5" strokeWidth={1.5} /> Output Format
                  </label>
                  <div className="flex gap-2">
                    {FORMAT_OPTIONS.map((opt) => (
                      <motion.button
                        key={opt.value}
                        onClick={() => onFormatChange(opt.value)}
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.97 }}
                        className={`flex-1 rounded-xl border px-3 py-3.5 text-center transition-all duration-300 ${
                          format === opt.value
                            ? "border-primary/30 bg-primary/[0.06] text-primary shadow-sm"
                            : "border-border/40 bg-card/20 text-muted-foreground hover:border-border/60 hover:text-foreground"
                        }`}
                      >
                        <div className="text-lg leading-none mb-1.5">{opt.icon}</div>
                        <div className="text-sm font-bold">{opt.label}</div>
                        <div className="mt-0.5 text-[11px] font-medium opacity-50">{opt.desc}</div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Quality */}
                <div className="space-y-3">
                  <label className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
                    <span className="flex items-center gap-1.5">
                      <Gauge className="h-3.5 w-3.5" strokeWidth={1.5} /> Quality
                    </span>
                    <span className="font-mono text-lg font-black text-primary tabular-nums leading-none">{quality}%</span>
                  </label>
                  <div className="pt-2">
                    <input
                      type="range"
                      min={1}
                      max={100}
                      value={quality}
                      onChange={(e) => onQualityChange(Number(e.target.value))}
                      className="w-full"
                      disabled={format === "png"}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] font-medium text-muted-foreground/40">
                    <span>Smaller file</span>
                    <span>Higher quality</span>
                  </div>
                  {format === "png" && (
                    <p className="text-[11px] font-medium text-accent/70">PNG is lossless — quality doesn't apply</p>
                  )}
                </div>

                {/* Resize */}
                <div className="space-y-3">
                  <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
                    <Maximize className="h-3.5 w-3.5" strokeWidth={1.5} /> Max Dimension
                  </label>
                  <select
                    value={maxDimension}
                    onChange={(e) => onMaxDimensionChange(Number(e.target.value))}
                    className="w-full rounded-xl border border-border/40 bg-card/30 backdrop-blur-sm px-4 py-3.5 text-sm font-semibold text-foreground focus:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all duration-300"
                  >
                    {RESIZE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default memo(CompressionSettings);
