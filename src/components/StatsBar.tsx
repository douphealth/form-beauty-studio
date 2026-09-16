import { memo } from "react";
import { MotionDiv, MotionSection, MotionNav, MotionA, MotionSpan, MotionP, MotionButton, MotionLi } from "@/lib/motion";
import { Layers, Package, ArrowRight, Zap } from "lucide-react";
import { formatBytes } from "@/lib/image-utils";

interface StatsBarProps {
  count: number;
  totalOriginal: number;
  totalCompressed: number;
  savedPct: number;
  hasCompleted: boolean;
}

const stagger = {
  container: { transition: { staggerChildren: 0.06 } },
  item: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { type: "spring", stiffness: 300, damping: 25 },
  },
};

function StatsBar({ count, totalOriginal, totalCompressed, savedPct, hasCompleted }: StatsBarProps) {
  const items = [
    { icon: Layers, label: "Images", value: String(count), color: "text-primary" },
    { icon: Package, label: "Original", value: formatBytes(totalOriginal), color: "text-muted-foreground" },
    { icon: ArrowRight, label: "Compressed", value: hasCompleted ? formatBytes(totalCompressed) : "—", color: "text-success" },
    { icon: Zap, label: "Saved", value: hasCompleted ? `${savedPct}%` : "—", color: "text-primary" },
  ];

  return (
    <MotionDiv
      className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4"
      variants={stagger.container}
      initial="initial"
      animate="animate"
    >
      {items.map((stat) => (
        <MotionDiv
          key={stat.label}
          variants={stagger.item}
          className="glass-card flex flex-col items-center py-6 px-4 text-center group"
        >
          <stat.icon className={`mb-2.5 h-4 w-4 ${stat.color} opacity-60`} strokeWidth={1.5} />
          <MotionSpan
            key={stat.value}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`font-mono text-xl font-black tabular-nums leading-none ${stat.color}`}
          >
            {stat.value}
          </MotionSpan>
          <span className="mt-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50">{stat.label}</span>
        </MotionDiv>
      ))}
    </MotionDiv>
  );
}

export default memo(StatsBar);
