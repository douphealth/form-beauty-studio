import { useCallback, useEffect, useRef, useState } from "react";
import {
  checkEntitlement,
  createCheckoutSession,
  exchangeLegacyLicence,
  parseRestoreInput,
  redeemCheckoutSession,
  readEntitlement,
  clearEntitlement,
  type ProStatus,
} from "../lib/pro";

export interface UsePro extends ProStatus {
  /** Restore purchase from a restore code, restore link or legacy licence key. */
  activate: (input: string) => Promise<string | null>;
  redeemCheckout: (sessionId: string) => Promise<string | null>;
  startCheckout: () => Promise<string | null>;
  deactivate: () => void;
}

export function usePro(): UsePro {
  const [status, setStatus] = useState<ProStatus>({
    isPro: false,
    entitlement: null,
    checking: true,
  });
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    checkEntitlement()
      .then((next) => {
        if (alive.current) setStatus(next);
      })
      .catch(() => {
        if (alive.current) {
          setStatus({ isPro: false, entitlement: readEntitlement(), checking: false });
        }
      });
    return () => {
      alive.current = false;
    };
  }, []);

  // Restore purchase: a restore code or link is re-verified with Stripe; anything
  // else is treated as a legacy ACHM licence key.
  const activate = useCallback(async (input: string) => {
    const parsed = parseRestoreInput(input);
    const error =
      parsed.kind === "session"
        ? await redeemCheckoutSession(parsed.sessionId)
        : await exchangeLegacyLicence(parsed.key);
    if (!error && alive.current) {
      setStatus({ isPro: true, entitlement: readEntitlement(), checking: false });
    }
    return error;
  }, []);

  const redeemCheckout = useCallback(async (sessionId: string) => {
    const error = await redeemCheckoutSession(sessionId);
    if (!error && alive.current) {
      setStatus({ isPro: true, entitlement: readEntitlement(), checking: false });
    }
    return error;
  }, []);

  const startCheckout = useCallback(async () => {
    const result = await createCheckoutSession();
    if ("error" in result) return result.error;
    if (typeof window === "undefined") return "Checkout is only available in the browser.";
    window.location.assign(result.url);
    return null;
  }, []);

  const deactivate = useCallback(() => {
    clearEntitlement();
    setStatus({ isPro: false, entitlement: null, checking: false });
  }, []);

  return {
    ...status,
    activate,
    redeemCheckout,
    startCheckout,
    deactivate,
  };
}
