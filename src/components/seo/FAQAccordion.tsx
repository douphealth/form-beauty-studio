import { useId, useState } from "react";
import { MotionSpan } from "@/lib/motion";
import { ChevronDown } from "lucide-react";
import type { ContentEntry } from "../../content/types";

/**
 * FAQ block.
 *
 * IMPORTANT ARCHITECTURAL NOTE — answered answers must never be mounted
 * conditionally. An earlier version wrapped the answer panel in
 * `{isOpen && <motion.div>…}` behind AnimatePresence, which meant only the
 * single expanded answer (index 0) existed in the served HTML. Every other
 * FAQPage `acceptedAnswer` in the JSON-LD then described text that was absent
 * from the document, so crawlers and answer engines saw schema claiming
 * content the page did not contain. scripts/verify-crawl.mjs now fails the
 * build on exactly that mismatch.
 *
 * So: all answers are ALWAYS rendered. Collapsing is done with CSS only —
 * `grid-template-rows: 0fr -> 1fr`, which animates smoothly, needs no JS, and
 * degrades to fully readable text if scripting or CSS is unavailable. Keep it
 * that way.
 */
export default function FAQAccordion({ faqs, className = "" }: { faqs: ContentEntry["faqs"]; className?: string }) {
  const [open, setOpen] = useState<number | null>(0);
  // Scoped per instance so the ids stay unique if a page ever renders two FAQ blocks.
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  return (
    <section className={className} aria-labelledby={`faq-heading-${uid}`}>
      <h2 id={`faq-heading-${uid}`} className="mb-6 text-xl font-bold text-foreground sm:text-2xl">
        Frequently asked questions
      </h2>
      <div className="flex flex-col gap-3">
        {faqs.map((faq, i) => {
          const isOpen = open === i;
          const panelId = `faq-panel-${uid}-${i}`;
          const btnId = `faq-btn-${uid}-${i}`;
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
                  <MotionSpan
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="shrink-0 text-muted-foreground"
                  >
                    <ChevronDown className="h-4 w-4" strokeWidth={2} />
                  </MotionSpan>
                </button>
              </h3>
              {/* Always in the DOM. `aria-hidden` + `hidden` only when collapsed,
                  and `hidden` is lifted on the client after mount so the CSS
                  grid animation can run. Crawlers that do not execute JS still
                  read the full answer text. */}
              <div
                id={panelId}
                role="region"
                aria-labelledby={btnId}
                data-state={isOpen ? "open" : "closed"}
                className="faq-panel"
              >
                <div className="overflow-hidden">
                  <div className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground sm:px-6">
                    {faq.answer}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
