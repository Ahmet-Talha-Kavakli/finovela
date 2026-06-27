"use client";

/**
 * Vela Brain ayarları (Blok 3) — otonom yönetici kontrol paneli.
 * Yetki seviyesi + güven bütçesi + kill switch. Kalıcı (vela.brain.v1 → DB sync).
 *
 * Yetki:
 *  - "full"     : Tam yetki — onay almadan uygular (bütçe sınırları içinde).
 *  - "semi"     : Yarım yetki — son işlemde onay ister.
 *  - "advisory" : Yetkisiz — sadece öneri/sohbet, asla uygulamaz.
 */

import { useSyncExternalStore } from "react";
import { RISK_BUDGET } from "@/lib/brain/guard";

export type Authority = "full" | "semi" | "advisory";

export type BrainSettings = {
  authority: Authority;
  killSwitch: boolean; // true = tüm otonom durur (her şeyden üstün)
  maxTradePct: number; // tek işlemde portföyün max %'si
  maxDailyTrades: number; // günde max otonom işlem
  maxPositionPct: number; // tek varlık max ağırlık
  requirePinOver: number; // bu tutar üstü işlemde PIN iste
};

const KEY = "vela.brain.v1";

const DEFAULT: BrainSettings = {
  authority: "advisory",
  killSwitch: false,
  maxTradePct: 5,
  maxDailyTrades: 5,
  maxPositionPct: 25,
  requirePinOver: 1000,
};

const SSR: BrainSettings = Object.freeze({ ...DEFAULT });

let cache: BrainSettings | null = null;
const listeners = new Set<() => void>();

function load(): BrainSettings {
  if (cache) return cache;
  if (typeof window === "undefined") return SSR;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? { ...DEFAULT, ...(JSON.parse(raw) as Partial<BrainSettings>) } : { ...DEFAULT };
  } catch {
    cache = { ...DEFAULT };
  }
  return cache;
}

function save(next: BrainSettings) {
  cache = next;
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(next));
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

// Güven-bütçesi mantığı + risk varsayılanları SAF modülde (client+server ortak).
// Tek doğru kaynak: src/lib/brain/guard.ts — buradan re-export edilir.
export { checkBudget } from "@/lib/brain/guard";
export { RISK_BUDGET };
export type { BudgetCheck } from "@/lib/brain/guard";

export const brainStore = {
  get: load,
  update(patch: Partial<BrainSettings>) {
    save({ ...load(), ...patch });
  },
  setAuthority(authority: Authority) {
    save({ ...load(), authority });
  },
  toggleKillSwitch() {
    const cur = load();
    save({ ...cur, killSwitch: !cur.killSwitch });
  },
  /** Onboarding'de seçilen risk profilini Brain bütçesine uygular. */
  applyRiskProfile(risk: "conservative" | "balanced" | "aggressive") {
    save({ ...load(), ...RISK_BUDGET[risk] });
  },
};

export function useBrain() {
  const settings = useSyncExternalStore(subscribe, load, () => SSR);
  return {
    settings,
    update: brainStore.update,
    setAuthority: brainStore.setAuthority,
    toggleKillSwitch: brainStore.toggleKillSwitch,
    applyRiskProfile: brainStore.applyRiskProfile,
  };
}

export const AUTHORITY_LABELS: Record<Authority, { title: string; desc: string }> = {
  full: {
    title: "Tam Yetki",
    desc: "Finovela en doğru kararları senden onay almadan uygular, planlar ve yürütür — güven bütçesi sınırları içinde.",
  },
  semi: {
    title: "Yarım Yetki",
    desc: "Finovela planlar ve hazırlar, ama son işlemi gerçekleştirmeden önce onayını ister.",
  },
  advisory: {
    title: "Yetkisiz (Danışman)",
    desc: "Finovela sadece sohbet eder ve öneri sunar; hiçbir işlemi kendi başına yapmaz.",
  },
};
