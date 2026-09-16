import { useState } from "react";
import { MotionDiv, MotionSpan, AnimatePresence } from "@/lib/motion";
import { ChevronDown } from "lucide-react";
import type { ContentEntry } from "../../content/types";

export default function FAQAccordion({ faqs, className = "" }: { faqs: ContentEntry["faqs"]; className?: string }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className={className} aria-labelledby="faq-heading">
      <h2 id="faq-heading" className="mb-6 text-xl font-bold text-foreground sm:text-2xl">
        Frequently asked questions
      </h2>
      <div className="flex flex-col gap-3">
        {faqs.map((faq, i) => {
          const isOpen = open === i;
          const panelId = "faq-panel-" + i;
          const btnId = "faq-btn-" + i;
          return (
            <div key={i} className="glass-card overflow-hidden">
              <h3 style={{ margin: 0 }}>
                <button
                  id={btnId}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-primary/[0.02] sm:px-6"
                >
                  <span className="text-sm font-semibold text-foreground sm:text-base">{faq.question}</span>
                  <MotionSpan animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="shrink-0 text-muted-foreground">
                    <ChevronDown className="h-4 w-4" strokeWidth={2} />
                  </MotionSpan>
                </button>
              </h3>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <MotionDiv
                    id={panelId}
                    role="region"
                    aria-labelledby={btnId}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground sm:px-6">{faq.answer}</div>
                  </MotionDiv>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}
