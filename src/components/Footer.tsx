import { MotionDiv, MotionSection, MotionNav, MotionA, MotionSpan, MotionP, MotionButton, MotionLi } from "@/lib/motion";
import {
  Sparkles, ExternalLink, Heart, Globe, Code2, Rocket, Shield, Star,
} from "lucide-react";

const CREATOR_SITES = [
  { name: "GearUpToFit", url: "https://gearuptofit.com" },
  { name: "AffiliateMarketingForSuccess", url: "https://affiliatemarketingforsuccess.com" },
  { name: "MysticalDigits", url: "https://mysticaldigits.com" },
  { name: "FrenchyFab", url: "https://frenchyfab.com" },
  { name: "MiceGoneGuide", url: "https://micegoneguide.com" },
  { name: "GearUpToGrow", url: "https://gearuptogrow.com" },
  { name: "PlantasticHaven", url: "https://plantastichaven.com" },
  { name: "EfficientGPTPrompts", url: "https://efficientgptprompts.com" },
  { name: "OutdoorMisting", url: "https://outdoormisting.com" },
];

const TRUST_ITEMS = [
  { icon: Shield, text: "100% Private" },
  { icon: Rocket, text: "Zero Upload" },
  { icon: Code2, text: "Open Architecture" },
  { icon: Star, text: "Enterprise Grade" },
];

export default function Footer() {
  return (
    <footer className="relative mt-20 overflow-hidden border-t border-border/20">
      {/* Subtle gradient backdrop */}
      <div className="pointer-events-none absolute inset-0 mesh-bg opacity-40" />

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-4 border-b border-border/15 py-8 sm:gap-8">
          {TRUST_ITEMS.map((item, i) => (
            <MotionDiv
              key={item.text}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="flex items-center gap-2 text-xs font-medium text-muted-foreground/50"
            >
              <item.icon className="h-3.5 w-3.5 text-primary/40" strokeWidth={1.5} />
              {item.text}
            </MotionDiv>
          ))}
        </div>

        {/* Main footer content */}
        <div className="grid gap-10 py-12 sm:grid-cols-[1fr_auto_1fr] sm:gap-16">
          {/* Brand */}
          <MotionDiv
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl text-primary-foreground shadow-md"
                style={{ background: "var(--gradient-primary)" }}
              >
                <Sparkles className="h-4 w-4" strokeWidth={2} />
              </div>
              <div>
                <span className="gradient-text text-sm font-bold tracking-tight">ImageAlchemy</span>
                <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-muted-foreground/40">
                  Compression Studio
                </p>
              </div>
            </div>
            <p className="max-w-xs text-xs leading-relaxed text-muted-foreground/50">
              Professional-grade image compression that runs entirely in your browser. 
              No uploads, no servers, no compromises. Your images stay private — always.
            </p>
            <div className="mt-5 flex gap-4">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/30 bg-card/20 px-3 py-1.5 text-[10px] font-medium text-muted-foreground/40">
                <Globe className="h-3 w-3" /> Browser-Only
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/30 bg-card/20 px-3 py-1.5 text-[10px] font-medium text-muted-foreground/40">
                <Shield className="h-3 w-3" /> Zero Tracking
              </span>
            </div>
          </MotionDiv>

          {/* Divider */}
          <div className="hidden w-px bg-border/15 sm:block" />

          {/* Creator */}
          <MotionDiv
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/30">
              Created by
            </p>
            <h3 className="mb-1 text-base font-bold text-foreground sm:text-lg">
              Alexios Papaioannou
            </h3>
            <p className="mb-5 text-xs text-muted-foreground/50">
              Digital entrepreneur & full-stack creator
            </p>

            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/30">
              Portfolio
            </p>
            <div className="flex flex-wrap gap-1.5">
              {CREATOR_SITES.map((site, i) => (
                <MotionA
                  key={site.name}
                  href={site.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.15 + i * 0.03 }}
                  whileHover={{ y: -2, scale: 1.03 }}
                  className="group inline-flex items-center gap-1 rounded-lg border border-border/30 bg-card/20 backdrop-blur-sm px-2.5 py-1.5 text-[10px] font-medium text-muted-foreground/50 transition-all duration-300 hover:border-primary/20 hover:text-primary/70 hover:bg-primary/[0.03]"
                >
                  {site.name}
                  <ExternalLink className="h-2.5 w-2.5 opacity-0 transition-opacity group-hover:opacity-100" />
                </MotionA>
              ))}
            </div>
          </MotionDiv>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-border/10 py-6 sm:flex-row">
          <p className="text-[10px] text-muted-foreground/25">
            © {new Date().getFullYear()} ImageAlchemy. All processing happens locally in your browser.
          </p>
          <p className="flex items-center gap-1 text-[10px] text-muted-foreground/25">
            Crafted with <Heart className="h-2.5 w-2.5 text-destructive/40" /> by Alexios Papaioannou
          </p>
        </div>
      </div>
    </footer>
  );
}
