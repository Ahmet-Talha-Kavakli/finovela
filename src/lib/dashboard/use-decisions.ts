"use client";

/**
 * AI Karar Defteri (Blok 3) — Vela'nın yaptığı/önerdiği her aksiyon + NEDEN + veri.
 * "Tam yetki"yi güvenilir kılan radikal şeffaflık katmanı.
 *
 * Kalıcı: localStorage `vela.decisions.v1` (anlık) + DB'ye best-effort POST.
 * (DB ayrı tablo: decision_log — analitik/denetim için.)
 */

import { useSyncExternalStore } from "react";

export type DecisionKind = "trade" | "rebalance" | "alert" | "insight" | "blocked";

export type Decision = {
  id: string;
  ts: number;
  kind: DecisionKind;
  action: string; // ne yapıldı (insan-okur)
  rationale: string; // NEDEN
  goalRef?: string; // hangi hedefe bağlı
  authority?: string; // o anki yetki
  executed: boolean; // uygulandı mı / öneri mi
  snapshot?: Record<string, unknown>; // o anki ilgili veri
};

const KEY = "vela.decisions.v1";
const MAX = 200;

const SSR: Decision[] = Object.freeze([]) as unknown as Decision[];

let cache: Decision[] | null = null;
const listeners = new Set<() => void>();

function load(): Decision[] {
  if (cache) return cache;
  if (typeof window === "undefined") return SSR;
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    // DB sync'ten bozuk/eski şekil (obje) gelmiş olabilir → her zaman array garanti et.
    cache = Array.isArray(parsed) ? (parsed as Decision[]) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function save(next: Decision[]) {
  cache = next.slice(0, MAX);
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(cache));
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onRehydrate = () => {
    cache = null;
    cb();
  };
  if (typeof window !== "undefined") window.addEventListener("vela:rehydrate", onRehydrate);
  return () => {
    listeners.delete(cb);
    if (typeof window !== "undefined") window.removeEventListener("vela:rehydrate", onRehydrate);
  };
}

export const decisionStore = {
  get: load,
  /** Yeni karar kaydı ekle (defterin başına). DB'ye de best-effort yaz. */
  log(d: Omit<Decision, "id" | "ts">): Decision {
    const entry: Decision = {
      ...d,
      id: `d_${Date.now()}_${load().length}`,
      ts: Date.now(),
    };
    save([entry, ...load()]);
    // DB'ye denetim kaydı (başarısız olursa localStorage zaten tutuyor).
    if (typeof window !== "undefined") {
      void fetch("/api/decisions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: entry.id,
          ts: entry.ts,
          kind: entry.kind,
          action: entry.action,
          rationale: entry.rationale,
          goalRef: entry.goalRef ?? null,
          authority: entry.authority ?? null,
          executed: entry.executed ? 1 : 0,
          snapshot: entry.snapshot ? JSON.stringify(entry.snapshot) : null,
        }),
      }).catch(() => {});
    }
    return entry;
  },
  clear() {
    save([]);
  },
};

export function useDecisions() {
  const decisions = useSyncExternalStore(subscribe, load, () => SSR);
  return { decisions, log: decisionStore.log, clear: decisionStore.clear };
}
