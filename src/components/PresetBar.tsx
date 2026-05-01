import { memo } from "react";
import { motion } from "framer-motion";
import { PRESETS, type PresetId } from "@/lib/presets";

interface PresetBarProps {
  activeId: PresetId;
  onSelect: (id: PresetId) => void;
}

function PresetBar({ activeId, onSelect }: PresetBarProps) {
  return (
    <div className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
          Smart Presets
        </h3>
        {activeId === "custom" && (
          <span className="text-[11px] font-medium text-muted-foreground/50">Custom settings</span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {PRESETS.map((p) => {
          const active = p.id === activeId;
          return (
            <motion.button
              key={p.id}
              onClick={() => onSelect(p.id)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              className={`group relative rounded-2xl border px-2.5 py-3 text-center transition-all duration-300 ${
                active
                  ? "border-primary/40 bg-primary/[0.08] shadow-sm"
                  : "border-border/40 bg-card/30 hover:border-border/60"
              }`}
            >
              <div className="text-xl leading-none">{p.emoji}</div>
              <div className={`mt-1.5 text-xs font-bold ${active ? "text-primary" : "text-foreground"}`}>
                {p.label}
              </div>
              <div className="mt-0.5 text-[10px] font-medium text-muted-foreground/60 leading-tight">
                {p.description}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export default memo(PresetBar);
