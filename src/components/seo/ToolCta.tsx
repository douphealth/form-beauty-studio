import { Link } from "react-router-dom";
import { MotionDiv, MotionSection, MotionNav, MotionA, MotionSpan, MotionP, MotionButton, MotionLi } from "@/lib/motion";
import { ArrowRight, Upload, Shield, Zap } from "lucide-react";

interface CtaProps {
  title?: string;
  description?: string;
  format?: "webp" | "avif" | "jpeg" | "png" | "auto";
  actionLabel?: string;
  className?: string;
}

export default function ToolCta({
  title = "Compress your images now — free and private",
  description = "Drop your files and ImageForge compresses them in your browser. No uploads, no accounts, no limits. Batch process hundreds at once and download a ZIP.",
  format = "auto",
  actionLabel = "Open the compressor",
  className = "",
}: CtaProps) {
  const to = "/?preset=" + format;
  return (
    <MotionSection
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5 }}
      className={"relative overflow-hidden rounded-3xl border border-border/30 p-8 sm:p-12 " + className}
    >
      <div className="pointer-events-none absolute inset-0 mesh-bg opacity-70" />
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-2xl">
          <h2 className="text-xl font-bold text-foreground sm:text-2xl">{title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground/80 sm:text-base">{description}</p>
        </div>
        <div className="flex shrink-0 flex-col gap-3">
          <Link
            to={to}
            className="group inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Upload className="h-4 w-4" />
            {actionLabel}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <div className="flex items-center gap-4 text-xs text-muted-foreground/60">
            <span className="inline-flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> 100% private</span>
            <span className="inline-flex items-center gap-1.5"><Zap className="h-3.5 w-3.5" /> No signup</span>
          </div>
        </div>
      </div>
    </MotionSection>
  );
}
