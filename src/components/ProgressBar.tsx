import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ProgressBarProps {
  processing: boolean;
  current: number;
  total: number;
}

function ProgressBar({ processing, current, total }: ProgressBarProps) {
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
            <div className="mb-4 flex items-center justify-between text-sm">
              <span className="flex items-center gap-2.5 font-semibold">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="h-4 w-4 rounded-full border-2 border-primary/20 border-t-primary"
                />
                Compressing...
              </span>
              <span className="font-mono text-sm font-bold text-primary tabular-nums">
                {current}/{total}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted/50">
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'var(--gradient-primary)' }}
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
