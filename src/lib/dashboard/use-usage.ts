"use client";

/**
 * useUsage — istemci tarafı kredi/kullanım kancası.
 * /api/usage GET'i çeker → { plan, used, limit, remaining }.
 * limit/remaining: -1 = sınırsız (server serializeLimit'ten).
 *
 * Tazeleme stratejisi:
 *  - mount'ta bir kez,
 *  - pencere odağa gelince (focus),
 *  - periyodik (60 sn),
 *  - 'vela:usage-changed' window event'i ile (chat gönderimi sonrası tetiklenir).
 */

import { useCallback, useEffect, useRef, useState } from "react";

export type Usage = {
  plan: "free" | "pro" | "unlimited";
  used: number;
  limit: number; // -1 = sınırsız
  remaining: number; // -1 = sınırsız
  unlimited: boolean;
  loading: boolean;
};

const DEFAULT: Usage = {
  plan: "free",
  used: 0,
  limit: 20,
  remaining: 20,
  unlimited: false,
  loading: true,
};

/** Kullanım değiştiğinde (örn. chat sonrası) dinleyicileri tetikle. */
export function notifyUsageChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("vela:usage-changed"));
  }
}

export function useUsage(): Usage & { refresh: () => void } {
  const [usage, setUsage] = useState<Usage>(DEFAULT);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/usage", { cache: "no-store" });
      const d = await res.json();
      if (!mounted.current || !d?.ok) return;
      const limit = typeof d.aiChat?.limit === "number" ? d.aiChat.limit : 20;
      const remaining = typeof d.aiChat?.remaining === "number" ? d.aiChat.remaining : 20;
      setUsage({
        plan: d.plan ?? "free",
        used: d.aiChat?.used ?? 0,
        limit,
        remaining,
        unlimited: limit === -1,
        loading: false,
      });
    } catch {
      if (mounted.current) setUsage((u) => ({ ...u, loading: false }));
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    refresh(); // eslint-disable-line react-hooks/set-state-in-effect -- async fetch; setState yalnız resolve sonrası
    const onFocus = () => refresh();
    const onChanged = () => refresh();
    window.addEventListener("focus", onFocus);
    window.addEventListener("vela:usage-changed", onChanged);
    const t = window.setInterval(refresh, 60_000);
    return () => {
      mounted.current = false;
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("vela:usage-changed", onChanged);
      window.clearInterval(t);
    };
  }, [refresh]);

  return { ...usage, refresh };
}
