/**
 * React binding for the Pro entitlement layer.
 *
 * Deliberately a hook rather than a context provider: the entitlement is read
 * from localStorage and verified with Web Crypto, and only two components need
 * it (the paywall and the Pro page). A provider would put a promise and a
 * re-render at the root of every page on the site to serve two leaf nodes.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  checkEntitlement,
  verifyLicenceKey,
  writeEntitlement,
  clearEntitlement,
  buildCheckoutUrl,
  PRO_CONFIG,
  type ProEntitlement,
  type ProStatus,
} from "../lib/pro";

export interface UsePro extends ProStatus {
  /** Activate with a key the user typed. Returns a human-readable error, or null on success. */
  activate: (key: string, source?: ProEntitlement["source"]) => Promise<string | null>;
  /** Forget the entitlement on this device. */
  deactivate: () => void;
  /** Stripe checkout URL, or "" when unconfigured. */
  checkoutUrl: string;
}

/**
 * Read + verify the entitlement once on mount.
 *
 * Verification is async (Web Crypto), so the first render reports
 * `checking: true`. UI that gates on Pro must therefore render a neutral state
 * rather than a "locked" state while checking, or a paying customer sees a
 * paywall flash on every page load.
 */
export function usePro(): UsePro {
  const [status, setStatus] = useState<ProStatus>({
    isPro: false,
    entitlement: null,
    // Start in the checking state. Correct for both SSR (where there is no
    // localStorage and the answer is always "not yet known") and the client.
    checking: true,
  });

  // Guards against a setState after unmount when verification resolves late.
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    checkEntitlement()
      .then((next) => {
        if (alive.current) setStatus(next);
      })
      .catch(() => {
        if (alive.current) setStatus({ isPro: false, entitlement: null, checking: false });
      });
    return () => {
      alive.current = false;
    };
  }, []);

  const activate = useCallback(async (key: string, source: ProEntitlement["source"] = "licence-key") => {
    const result = await verifyLicenceKey(key);
    if (!result.valid) return result.reason ?? "That key could not be verified.";

    const normalised = key.trim().toUpperCase().replace(/[^0-9A-Z]/g, "");
    const entitlement: ProEntitlement = {
      key: normalised,
      activatedAt: new Date().toISOString(),
      source,
      verified: true,
    };
    writeEntitlement(entitlement);
    setStatus({ isPro: true, entitlement, checking: false });
    return null;
  }, []);

  const deactivate = useCallback(() => {
    clearEntitlement();
    setStatus({ isPro: false, entitlement: null, checking: false });
  }, []);

  return {
    ...status,
    activate,
    deactivate,
    checkoutUrl: buildCheckoutUrl(),
  };
}

/** Exported so the paywall can show what it costs without importing pro.ts too. */
export { PRO_CONFIG };
