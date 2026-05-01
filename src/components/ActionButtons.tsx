import { memo } from "react";
import { motion } from "framer-motion";
import { Zap, Download, Trash2, FileDown, RotateCw } from "lucide-react";

interface ActionButtonsProps {
  onCompress: () => void;
  onDownloadZip: () => void;
  onDownloadIndividual: () => void;
  onClearAll: () => void;
  onRetryFailed?: () => void;
  hasCompleted: boolean;
  hasFailed?: boolean;
  processing: boolean;
}

function ActionButtons({
  onCompress, onDownloadZip, onDownloadIndividual, onClearAll, onRetryFailed,
  hasCompleted, hasFailed, processing,
}: ActionButtonsProps) {
  if (processing) return null;

  return (
    <motion.div
      className="mt-10 flex flex-wrap items-center justify-center gap-3"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <motion.button
        onClick={onCompress}
        whileHover={{ y: -2, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="btn-primary group inline-flex items-center gap-2.5 rounded-2xl px-10 py-4 text-sm font-bold text-primary-foreground"
      >
        <Zap className="h-4 w-4 transition-transform group-hover:scale-110" strokeWidth={2} />
        Compress All
        <kbd className="hidden rounded-md bg-primary-foreground/20 px-1.5 py-0.5 font-mono text-[9px] sm:inline">⌘↵</kbd>
      </motion.button>

      {hasFailed && (
        <motion.button
          onClick={onRetryFailed}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="inline-flex items-center gap-2 rounded-2xl border border-accent/30 bg-accent/[0.08] px-5 py-4 text-sm font-bold text-accent transition-all duration-300 hover:bg-accent hover:text-accent-foreground"
        >
          <RotateCw className="h-4 w-4" strokeWidth={2} /> Retry Failed
        </motion.button>
      )}

      {hasCompleted && (
        <>
          <motion.button
            onClick={onDownloadZip}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 rounded-2xl border border-success/20 bg-success/[0.06] px-7 py-4 text-sm font-bold text-success transition-all duration-300 hover:bg-success hover:text-success-foreground hover:shadow-lg"
          >
            <Download className="h-4 w-4" strokeWidth={2} /> Download ZIP
            <kbd className="hidden rounded-md bg-success/10 px-1.5 py-0.5 font-mono text-[9px] sm:inline">⌘⇧D</kbd>
          </motion.button>

          <motion.button
            onClick={onDownloadIndividual}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 rounded-2xl border border-border/40 bg-card/30 backdrop-blur-sm px-5 py-4 text-sm font-semibold text-muted-foreground transition-all duration-300 hover:bg-card/60 hover:text-foreground"
          >
            <FileDown className="h-4 w-4" strokeWidth={1.5} /> Individual
          </motion.button>
        </>
      )}

      <motion.button
        onClick={onClearAll}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.98 }}
        className="inline-flex items-center gap-2 rounded-2xl border border-border/40 bg-card/30 backdrop-blur-sm px-7 py-4 text-sm font-semibold text-muted-foreground transition-all duration-300 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20"
      >
        <Trash2 className="h-4 w-4" strokeWidth={1.5} /> Clear All
      </motion.button>
    </motion.div>
  );
}

export default memo(ActionButtons);
