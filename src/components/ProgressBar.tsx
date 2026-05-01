import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pause, Play, X } from "lucide-react";

interface ProgressBarProps {
  processing: boolean;
  current: number;
  total: number;
  paused?: boolean;
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
}

function ProgressBar({ processing, current, total, paused, onPause, onResume, onCancel }: ProgressBarProps) {
  const pct = total > 0 ? (current / total) * 100 : 0;

  return (
    <AnimatePresence>
      {processing && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-8 overflow-hidden"
        >
          <div className="glass-card p-6">
            <div className="mb-4 flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2.5 font-semibold">
                {paused ? (
                  <Pause className="h-4 w-4 text-accent" strokeWidth={2.5} />
                ) : (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="h-4 w-4 rounded-full border-2 border-primary/20 border-t-primary"
                  />
                )}
                {paused ? "Paused" : "Compressing..."}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-primary tabular-nums">
                  {current}/{total}
                </span>
                {paused ? (
                  <button
                    onClick={onResume}
                    className="inline-flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary/20"
                  >
                    <Play className="h-3 w-3" strokeWidth={2.5} /> Resume
                  </button>
                ) : (
                  <button
                    onClick={onPause}
                    className="inline-flex items-center gap-1 rounded-lg border border-border/40 bg-card/40 px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-card/70 hover:text-foreground"
                  >
                    <Pause className="h-3 w-3" strokeWidth={2.5} /> Pause
                  </button>
                )}
                <button
                  onClick={onCancel}
                  className="inline-flex items-center gap-1 rounded-lg border border-destructive/30 bg-destructive/[0.06] px-2.5 py-1.5 text-xs font-bold text-destructive transition-colors hover:bg-destructive/15"
                >
                  <X className="h-3 w-3" strokeWidth={2.5} /> Cancel
                </button>
              </div>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted/50">
              <motion.div
                className="h-full rounded-full"
                style={{ background: paused ? 'hsl(var(--accent))' : 'var(--gradient-primary)' }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default memo(ProgressBar);
