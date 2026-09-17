import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  ArrowRight, Check, AlertTriangle, Info, XCircle, Loader2, ShieldCheck,
  Gauge, Image as ImageIcon, Layers, Clock, Download, Copy, Sparkles, Zap,
  TrendingDown, CircleDollarSign, KeyRound, Mail,
} from "lucide-react";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import { MotionDiv } from "../lib/motion";
import { usePro } from "../hooks/usePro";
import { AUDIT_CONFIGURED, PRO_BENEFITS, PRO_CONFIG, PRO_PRICE_DISPLAY } from "../lib/pro";
import {
  runAudit, normaliseTargetUrl, formatBytes, toMarkdown,
  FOUR_G_BYTES_PER_SEC,
  type AuditResult, type AuditFinding, type AuditSeverity, type AuditProgress,
} from "../lib/audit";

const SEVERITY_STYLES: Record<AuditSeverity, { ring: string; bg: string; text: string; icon: typeof AlertTriangle; label: string }> = {
  critical: { ring: "border-red-500/30", bg: "bg-red-500/[0.06]", text: "text-red-600 dark:text-red-400", icon: XCircle, label: "Critical" },
  warning: { ring: "border-amber-500/30", bg: "bg-amber-500/[0.06]", text: "text-amber-600 dark:text-amber-400", icon: AlertTriangle, label: "Warning" },
  info: { ring: "border-sky-500/25", bg: "bg-sky-500/[0.05]", text: "text-sky-600 dark:text-sky-400", icon: Info, label: "Opportunity" },
  good: { ring: "border-emerald-500/30", bg: "bg-emerald-500/[0.06]", text: "text-emerald-600 dark:text-emerald-400", icon: Check, label: "Passing" },
};

export default function Pro() {
  const { isPro, checking, activate } = usePro();
  const [params] = useSearchParams();

  // A returning buyer arrives with ?session_id=… from Stripe. We cannot verify
  // the session server-side without a backend, so the success page asks for the
  // licence key that was emailed with the receipt. That is honest about what we
  // can and cannot confirm, and it means the entitlement is a real signed key
  // rather than a URL parameter anyone could fabricate.
  const sessionId = params.get("session_id");
  const [keyInput, setKeyInput] = useState("");
  const [keyError, setKeyError] = useState<string | null>(null);
  const [activating, setActivating] = useState(false);

  const handleActivate = useCallback(async () => {
    setActivating(true);
    setKeyError(null);
    const err = await activate(keyInput);
    setKeyError(err);
    setActivating(false);
  }, [activate, keyInput]);

  if (checking) {
    return (
      <Shell title="Website Image Audit — ImageAlchemy Pro">
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </Shell>
    );
  }

  if (!isPro) {
    return (
      <Shell title="Website Image Audit — ImageAlchemy Pro">
        <Paywall
          justPaid={Boolean(sessionId)}
          keyInput={keyInput}
          setKeyInput={setKeyInput}
          keyError={keyError}
          activating={activating}
          onActivate={handleActivate}
        />
      </Shell>
    );
  }

  return (
    <Shell title="Website Image Audit — ImageAlchemy Pro">
      <AuditWorkspace />
    </Shell>
  );
}

/** Shared page chrome so the three states (loading / paywall / workspace) match. */
function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta
          name="description"
          content="Audit any web page's images: every file measured, every wasted byte quantified, with a prioritised fix list. One-time purchase, no subscription."
        />
        {/* The Pro page is a purchase surface, not editorial content. Indexing it
            would put a paywall in search results for informational queries, which
            is a poor experience and dilutes the tool pages that should rank. */}
        <meta name="robots" content="noindex,follow" />
      </Helmet>

      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="glow-orb absolute -left-48 -top-48 h-[700px] w-[700px] rounded-full bg-primary" />
        <div className="glow-orb absolute -bottom-48 -right-48 h-[600px] w-[600px] rounded-full bg-accent" style={{ animationDelay: "-8s" }} />
      </div>

      <div className="relative z-10">
        <SiteHeader />
        <main className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">{children}</main>
        <SiteFooter />
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Paywall
// ─────────────────────────────────────────────────────────────────────────────

function Paywall({
  justPaid, keyInput, setKeyInput, keyError, activating, onActivate,
}: {
  justPaid: boolean;
  keyInput: string;
  setKeyInput: (v: string) => void;
  keyError: string | null;
  activating: boolean;
  onActivate: () => void;
}) {
  const checkoutUrl = useMemo(() => {
    try {
      const base = PRO_CONFIG.checkoutUrl;
      if (!base) return "";
      const u = new URL(base);
      u.searchParams.set(
        "success_url",
        `${window.location.origin}${PRO_CONFIG.successPath}?session_id={CHECKOUT_SESSION_ID}`,
      );
      return u.toString();
    } catch {
      return "";
    }
  }, []);

  return (
    <div className="mx-auto max-w-3xl">
      <MotionDiv
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.06] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          ImageAlchemy Pro
        </span>
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
          Find every wasted byte
          <br />
          <span className="gradient-text">on any website</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground/80">
          The compressor shrinks the files you have. The audit tells you which files you
          <em> shouldn't have</em> — measured, ranked by cost, with the fix written out.
        </p>
      </MotionDiv>

      {justPaid && (
        <MotionDiv
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-10 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] p-6 text-left"
        >
          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div>
              <p className="font-semibold text-foreground">Payment received — one last step.</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Your licence key is in the receipt Stripe emailed you. Paste it below to unlock
                Pro on this device. It works offline and never expires.
              </p>
            </div>
          </div>
        </MotionDiv>
      )}

      {/* Benefits */}
      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        {PRO_BENEFITS.map((b, i) => (
          <MotionDiv
            key={b.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.05 * i }}
            className="glass-card p-5"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/[0.08]">
              <Check className="h-4 w-4 text-primary" strokeWidth={2.5} />
            </div>
            <p className="mt-3 font-semibold text-foreground">{b.title}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground/85">{b.body}</p>
          </MotionDiv>
        ))}
        <MotionDiv
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.25 }}
          className="glass-card flex flex-col justify-center p-5"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/[0.1]">
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
          </div>
          <p className="mt-3 font-semibold text-foreground">Your images still never leave your device</p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground/85">
            The audit fetches public web pages. It never uploads, stores or inspects your files —
            the compression tool stays 100% local, Pro or not.
          </p>
        </MotionDiv>
      </div>

      {/* Purchase / activation */}
      <MotionDiv
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="glass-card mt-10 overflow-hidden p-7 sm:p-9"
      >
        <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.14em] text-muted-foreground/70">
              One-time payment
            </p>
            <p className="mt-1 flex items-baseline gap-2">
              <span className="text-4xl font-bold tracking-tight text-foreground">{PRO_PRICE_DISPLAY}</span>
              <span className="text-sm text-muted-foreground">once, forever</span>
            </p>
            <p className="mt-2 text-sm text-muted-foreground/80">
              No subscription, no account, no expiry.
            </p>
          </div>

          {checkoutUrl ? (
            <a
              href={checkoutUrl}
              className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl px-7 py-4 text-base font-semibold text-primary-foreground shadow-lg transition-transform hover:scale-[1.02]"
              style={{ background: "var(--gradient-primary)" }}
            >
              <CircleDollarSign className="h-5 w-5" />
              Get Pro
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
          ) : (
            // Not an error state for the visitor — they simply cannot buy yet.
            // Better to say so plainly than to render a dead button.
            <div className="rounded-xl border border-border/60 bg-muted/40 px-5 py-4 text-sm text-muted-foreground">
              Checkout is not configured on this deployment yet.
            </div>
          )}
        </div>

        <div className="my-7 h-px bg-border/50" />

        <details className="group" open={justPaid}>
          <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-foreground">
            <KeyRound className="h-4 w-4 text-primary" />
            Already bought Pro? Enter your licence key
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-open:rotate-90" />
          </summary>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              inputMode="text"
              autoComplete="off"
              spellCheck={false}
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") onActivate(); }}
              placeholder="ACHM-XXXXX-XXXXX-XX"
              aria-label="Licence key"
              className="min-w-0 flex-1 rounded-xl border border-border/60 bg-background/60 px-4 py-3 font-mono text-sm tracking-wider text-foreground placeholder:text-muted-foreground/40 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="button"
              onClick={onActivate}
              disabled={activating || keyInput.trim().length < 8}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
              style={{ background: "var(--gradient-primary)" }}
            >
              {activating ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              Activate
            </button>
          </div>
          {keyError && (
            <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
              {keyError}
            </p>
          )}
        </details>
      </MotionDiv>

      <p className="mt-8 text-center text-sm text-muted-foreground/70">
        Prefer to try it first?{" "}
        <Link to="/" className="font-medium text-primary underline-offset-4 hover:underline">
          Compress images free, forever
        </Link>{" "}
        — no Pro required.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// The audit workspace
// ─────────────────────────────────────────────────────────────────────────────

function AuditWorkspace() {
  const [target, setTarget] = useState("");
  const [progress, setProgress] = useState<AuditProgress | null>(null);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Abort an in-flight audit if the user navigates away, so a slow remote page
  // does not keep a request open after the workspace is gone.
  useEffect(() => () => abortRef.current?.abort(), []);

  const run = useCallback(async () => {
    const normalised = normaliseTargetUrl(target);
    if (!normalised) {
      setError("Enter a full web address, for example: imagealchemy.app or https://example.com/pricing");
      return;
    }
    setError(null);
    setResult(null);
    setProgress({ stage: "fetching", message: "Starting…" });

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const r = await runAudit(normalised, {
        proxyBase: PRO_CONFIG.auditProxyUrl,
        onProgress: setProgress,
        signal: controller.signal,
      });
      setResult(r);
      if (r.pageError) setError(r.pageError);
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return;
      setError("The audit could not run. Check your connection and try again.");
    } finally {
      setProgress(null);
    }
  }, [target]);

  if (!AUDIT_CONFIGURED) {
    return (
      <div className="glass-card mx-auto max-w-xl p-8 text-center">
        <AlertTriangle className="mx-auto h-6 w-6 text-amber-500" />
        <p className="mt-4 font-semibold text-foreground">The audit service is not configured</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Deploy <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">workers/audit-proxy</code> and set{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">VITE_AUDIT_PROXY_URL</code>. See{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">docs/STRIPE-SETUP.md</code>.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.06] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          Pro
        </span>
        <h1 className="mt-5 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Website Image Audit
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground/80">
          Enter any public page. Every image it loads gets measured, and you get the fix list.
        </p>
      </div>

      {/* Input */}
      <div className="mx-auto mt-9 max-w-2xl">
        <div className="glass-card flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
          <input
            type="url"
            inputMode="url"
            autoComplete="url"
            spellCheck={false}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !progress) run(); }}
            placeholder="imagealchemy.app"
            aria-label="Page URL to audit"
            className="min-w-0 flex-1 rounded-xl border border-transparent bg-background/40 px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/40 focus:border-primary/30 focus:bg-background/70 focus:outline-none"
          />
          {progress ? (
            <button
              type="button"
              onClick={() => abortRef.current?.abort()}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-border/60 px-6 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              Cancel
            </button>
          ) : (
            <button
              type="button"
              onClick={run}
              disabled={target.trim().length < 3}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Gauge className="h-4 w-4" />
              Run audit
            </button>
          )}
        </div>

        {progress && (
          <div className="mt-4 flex items-center gap-3 px-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
            <span>{progress.message}</span>
          </div>
        )}

        {error && (
          <div role="alert" className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/[0.06] px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
            {error}
          </div>
        )}
      </div>

      {result && !result.pageError && result.images.length > 0 && <Report result={result} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Report
// ─────────────────────────────────────────────────────────────────────────────

function Report({ result }: { result: AuditResult }) {
  const [copied, setCopied] = useState<"none" | "md" | "csv">("none");
  const measured = result.measurements.filter((m) => m.ok && m.bytes);
  const worst = [...measured].sort((a, b) => (b.bytes ?? 0) - (a.bytes ?? 0)).slice(0, 12);

  const transferSeconds = result.totalBytes / FOUR_G_BYTES_PER_SEC;
  const savingSeconds = result.avoidableBytes / FOUR_G_BYTES_PER_SEC;

  const copy = useCallback(async (kind: "md" | "csv") => {
    const text =
      kind === "md"
        ? toMarkdown(result)
        : [
            "url,bytes,content_type,cache_control,modern_format",
            ...measured.map((m) =>
              [m.url, m.bytes, m.contentType ?? "", `"${m.cacheControl ?? ""}"`, m.modern].join(","),
            ),
          ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied("none"), 2200);
    } catch {
      setCopied("none");
    }
  }, [result, measured]);

  const download = useCallback(() => {
    const blob = new Blob([toMarkdown(result)], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const host = (() => { try { return new URL(result.finalUrl).hostname; } catch { return "site"; } })();
    a.href = url;
    a.download = `image-audit-${host}-${new Date(result.fetchedAt).toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [result]);

  return (
    <MotionDiv
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mt-12"
    >
      {/* ── Headline ─────────────────────────────────────────────────────── */}
      <div className="glass-card overflow-hidden">
        <div className="border-b border-border/40 px-6 py-5 sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
            Audit result
          </p>
          <p className="mt-1 truncate font-mono text-sm text-foreground" title={result.finalUrl}>
            {result.finalUrl}
          </p>
        </div>

        <div className="grid gap-px bg-border/40 sm:grid-cols-2 lg:grid-cols-4">
          <ScorePanel score={result.score.total} grade={result.score.grade} />
          <Metric
            icon={ImageIcon}
            label="Images found"
            value={String(result.images.length)}
            sub={`${measured.length} measured`}
          />
          <Metric
            icon={Layers}
            label="Total image weight"
            value={formatBytes(result.totalBytes)}
            sub={`≈ ${transferSeconds.toFixed(1)}s on 4G`}
          />
          <Metric
            icon={TrendingDown}
            label="Avoidable"
            value={formatBytes(result.avoidableBytes)}
            sub={result.totalBytes > 0 ? `${Math.round((result.avoidableBytes / result.totalBytes) * 100)}% of image bytes` : "—"}
            highlight={result.avoidableBytes > 0}
          />
        </div>

        {result.avoidableBytes > 0 && (
          <div className="flex items-center gap-3 border-t border-border/40 bg-emerald-500/[0.04] px-6 py-4 sm:px-8">
            <Clock className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <p className="text-sm text-muted-foreground">
              Acting on the findings below removes{" "}
              <strong className="font-semibold text-foreground">{formatBytes(result.avoidableBytes)}</strong>{" "}
              — about{" "}
              <strong className="font-semibold text-foreground">{savingSeconds.toFixed(1)} seconds</strong>{" "}
              of download time for every visitor on a 4G connection.
            </p>
          </div>
        )}
      </div>

      {/* ── Subscores ────────────────────────────────────────────────────── */}
      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        <SubScore label="Image weight" value={result.score.weight} />
        <SubScore label="Format" value={result.score.format} />
        <SubScore label="Delivery" value={result.score.delivery} />
        <SubScore label="Markup" value={result.score.markup} />
      </div>

      {/* ── Findings ─────────────────────────────────────────────────────── */}
      <div className="mt-10">
        <h2 className="text-lg font-bold text-foreground">Findings</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ordered by what they cost you. Each one names the files it applies to.
        </p>

        <div className="mt-5 space-y-3">
          {result.findings
            .slice()
            .sort((a, b) => severityRank(a.severity) - severityRank(b.severity))
            .map((f) => (
              <FindingCard key={f.id} finding={f} />
            ))}
        </div>
      </div>

      {/* ── Heaviest files ───────────────────────────────────────────────── */}
      {worst.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-bold text-foreground">Heaviest images</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The {worst.length} files doing the most damage, largest first.
          </p>
          <div className="glass-card mt-5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border/40 bg-muted/30">
                  <tr className="text-xs uppercase tracking-wider text-muted-foreground/70">
                    <th className="px-5 py-3 font-semibold">File</th>
                    <th className="px-4 py-3 text-right font-semibold">Size</th>
                    <th className="px-4 py-3 font-semibold">Format</th>
                    <th className="hidden px-4 py-3 font-semibold sm:table-cell">Cache</th>
                  </tr>
                </thead>
                <tbody>
                  {worst.map((m) => (
                    <tr key={m.url} className="border-b border-border/20 last:border-0">
                      <td className="max-w-[280px] px-5 py-3">
                        <span className="block truncate font-mono text-xs text-foreground" title={m.url}>
                          {fileName(m.url)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-xs tabular-nums text-foreground">
                        {formatBytes(m.bytes ?? 0)}
                      </td>
                      <td className="px-4 py-3">
                        <FormatBadge contentType={m.contentType} modern={m.modern} />
                      </td>
                      <td className="hidden px-4 py-3 sm:table-cell">
                        <span className={m.cacheControl?.includes("immutable") ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}>
                          {m.cacheControl?.includes("immutable") ? "immutable" : m.cacheControl ? "short" : "none"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Export ───────────────────────────────────────────────────────── */}
      <div className="mt-10 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={download}
          className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-transform hover:scale-[1.02]"
          style={{ background: "var(--gradient-primary)" }}
        >
          <Download className="h-4 w-4" />
          Download Markdown report
        </button>
        <button
          type="button"
          onClick={() => copy("md")}
          className="inline-flex items-center gap-2 rounded-xl border border-border/60 px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary/30 hover:bg-primary/[0.04]"
        >
          {copied === "md" ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
          {copied === "md" ? "Copied" : "Copy as Markdown"}
        </button>
        <button
          type="button"
          onClick={() => copy("csv")}
          className="inline-flex items-center gap-2 rounded-xl border border-border/60 px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary/30 hover:bg-primary/[0.04]"
        >
          {copied === "csv" ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
          {copied === "csv" ? "Copied" : "Copy as CSV"}
        </button>
      </div>
    </MotionDiv>
  );
}

function severityRank(s: AuditSeverity): number {
  return { critical: 0, warning: 1, info: 2, good: 3 }[s];
}

function fileName(url: string): string {
  try {
    const u = new URL(url);
    const last = u.pathname.split("/").filter(Boolean).pop() ?? u.hostname;
    return decodeURIComponent(last);
  } catch {
    return url;
  }
}

function ScorePanel({ score, grade }: { score: number; grade: string }) {
  // Score drives the colour: a green 92 and a red 31 should be legible at a
  // glance, which is the entire purpose of a score.
  const tone =
    score >= 80 ? "text-emerald-600 dark:text-emerald-400"
    : score >= 60 ? "text-amber-600 dark:text-amber-400"
    : "text-red-600 dark:text-red-400";

  return (
    <div className="flex flex-col justify-center bg-card/60 px-6 py-6">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
        Overall score
      </p>
      <p className="mt-2 flex items-baseline gap-2">
        <span className={`text-4xl font-bold tabular-nums tracking-tight ${tone}`}>{score}</span>
        <span className="text-sm text-muted-foreground">/ 100</span>
        <span className={`ml-1 rounded-lg px-2 py-0.5 text-sm font-bold ${tone} bg-current/10`}>{grade}</span>
      </p>
    </div>
  );
}

function Metric({
  icon: Icon, label, value, sub, highlight,
}: {
  icon: typeof Gauge;
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <div className="bg-card/60 px-6 py-6">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-muted-foreground/60" />
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">{label}</p>
      </div>
      <p className={`mt-2 text-2xl font-bold tabular-nums tracking-tight ${highlight ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}>
        {value}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground/70">{sub}</p>
    </div>
  );
}

function SubScore({ label, value }: { label: string; value: number }) {
  const tone =
    value >= 80 ? "bg-emerald-500" : value >= 60 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="glass-card p-4">
      <div className="flex items-baseline justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">{label}</p>
        <p className="text-sm font-bold tabular-nums text-foreground">{value}</p>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${tone} transition-[width] duration-700 ease-out`}
          style={{ width: `${Math.max(2, value)}%` }}
        />
      </div>
    </div>
  );
}

function FindingCard({ finding }: { finding: AuditFinding }) {
  const style = SEVERITY_STYLES[finding.severity];
  const Icon = style.icon;

  return (
    <div className={`rounded-2xl border ${style.ring} ${style.bg} p-5 sm:p-6`}>
      <div className="flex items-start gap-4">
        <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${style.text}`} strokeWidth={2.2} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3 className="font-semibold text-foreground">{finding.title}</h3>
            <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${style.text} bg-current/10`}>
              {style.label}
            </span>
            {finding.potentialSavingBytes != null && finding.potentialSavingBytes > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                <Zap className="h-3 w-3" />
                {formatBytes(finding.potentialSavingBytes)} saveable
              </span>
            )}
          </div>

          {/* A detail containing newlines is a file list, not prose. Render it as one. */}
          {finding.detail.includes("\n") ? (
            <ul className="mt-3 space-y-1">
              {finding.detail.split("\n").map((line, i) => (
                <li key={i} className="font-mono text-xs leading-relaxed text-muted-foreground">
                  {line}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{finding.detail}</p>
          )}

          <div className="mt-3.5 rounded-xl border border-border/40 bg-background/40 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">How to fix</p>
            <p className="mt-1.5 text-sm leading-relaxed text-foreground/85">{finding.fix}</p>
          </div>

          {finding.images.length > 0 && (
            <details className="mt-3">
              <summary className="cursor-pointer text-xs font-semibold text-muted-foreground hover:text-foreground">
                {finding.images.length} file{finding.images.length === 1 ? "" : "s"} affected
              </summary>
              <ul className="mt-2 space-y-0.5">
                {finding.images.slice(0, 40).map((u) => (
                  <li key={u} className="truncate font-mono text-[11px] text-muted-foreground/70" title={u}>
                    {u}
                  </li>
                ))}
                {finding.images.length > 40 && (
                  <li className="text-[11px] text-muted-foreground/60">
                    …and {finding.images.length - 40} more (all in the exported report)
                  </li>
                )}
              </ul>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}

function FormatBadge({ contentType, modern }: { contentType: string | null; modern: boolean }) {
  const label = (contentType ?? "unknown").replace("image/", "").toUpperCase();
  return (
    <span
      className={
        "rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold " +
        (modern
          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          : "bg-amber-500/10 text-amber-700 dark:text-amber-400")
      }
    >
      {label}
    </span>
  );
}
