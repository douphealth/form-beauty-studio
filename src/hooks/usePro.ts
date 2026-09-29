import { useCallback, useEffect, useRef, useState } from "react";
import {
  checkEntitlement,
  createCheckoutSession,
  exchangeLegacyLicence,
  redeemCheckoutSession,
  readEntitlement,
  clearEntitlement,
  type ProStatus,
} from "../lib/pro";

export interface UsePro extends ProStatus {
  activate: (key: string) => Promise<string | null>;
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

  const activate = useCallback(async (key: string) => {
    const error = await exchangeLegacyLicence(key);
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
