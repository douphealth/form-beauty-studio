import { memo } from "react";
import { MotionDiv, MotionSection, MotionNav, MotionA, MotionSpan, MotionP, MotionButton, MotionLi, AnimatePresence } from "@/lib/motion";
import { CheckSquare, Square, Trash2, Wand2, X } from "lucide-react";

interface SelectionToolbarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onApplyToSelection: () => void;
  onDeleteSelection: () => void;
  onAutoPickSelection: () => void;
}

function SelectionToolbar({
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  onApplyToSelection,
  onDeleteSelection,
  onAutoPickSelection,
}: SelectionToolbarProps) {
  const allSelected = selectedCount === totalCount && totalCount > 0;

  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <MotionDiv
          initial={{ opacity: 0, y: -8, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -8, height: 0 }}
          className="mb-4 overflow-hidden"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-primary/20 bg-primary/[0.04] px-4 py-2.5">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <CheckSquare className="h-4 w-4" strokeWidth={2} />
              {selectedCount} selected
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={allSelected ? onClearSelection : onSelectAll}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border/40 bg-card/40 px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-card/70 hover:text-foreground"
              >
                {allSelected ? <Square className="h-3.5 w-3.5" /> : <CheckSquare className="h-3.5 w-3.5" />}
                {allSelected ? "Deselect all" : "Select all"}
              </button>
              <button
                onClick={onApplyToSelection}
                className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/[0.08] px-2.5 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary/15"
              >
                <Wand2 className="h-3.5 w-3.5" strokeWidth={2} />
                Apply current settings
              </button>
              <button
                onClick={onAutoPickSelection}
                className="inline-flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/[0.08] px-2.5 py-1.5 text-xs font-bold text-accent transition-colors hover:bg-accent/15"
                title="Encode WebP+AVIF+JPEG and keep smallest"
              >
                🪄 Auto-pick
              </button>
              <button
                onClick={onDeleteSelection}
                className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/[0.06] px-2.5 py-1.5 text-xs font-bold text-destructive transition-colors hover:bg-destructive/15"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                Delete
              </button>
              <button
                onClick={onClearSelection}
                className="inline-flex items-center justify-center rounded-lg border border-border/40 bg-card/40 p-1.5 text-muted-foreground transition-colors hover:bg-card/70"
                aria-label="Clear selection"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </MotionDiv>
      )}
    </AnimatePresence>
  );
}

export default memo(SelectionToolbar);
