"use client";

/**
 * Vela Kullanıcı Profili store'u — onboarding sihirbazının çıktısı.
 * Risk profili + hedefler + deneyim + para yatırma yöntemi + başlangıç tutarı.
 * Kalıcı (localStorage `vela.profile.v1` → sync-engine ile DB'ye yansır).
 *
 * Risk profili use-brain ile bağlıdır: seçilen profile göre Brain'in
 * güven bütçesi (maxTradePct/maxPositionPct) varsayılanları ayarlanır.
 */

import { useSyncExternalStore } from "react";

export type RiskProfile = "conservative" | "balanced" | "aggressive";

export type Profile = {
  name: string;
  email: string;
  country: string;
  risk: RiskProfile | null;
  goals: string[];
  experience: string;
  fundingMethod: string | null;
  initialAmount: number;
  onboardingCompleted: boolean;
  completedAt: number; // epoch ms — 0 = tamamlanmadı
};

const KEY = "vela.profile.v1";

const DEFAULT: Profile = {
  name: "",
  email: "",
  country: "",
  risk: null,
  goals: [],
  experience: "",
  fundingMethod: null,
  initialAmount: 0,
  onboardingCompleted: false,
  completedAt: 0,
};

// Donmuş SSR snapshot (hydration güvenli).
const SSR: Profile = Object.freeze({ ...DEFAULT });

let cache: Profile | null = null;
const listeners = new Set<() => void>();

function load(): Profile {
  if (cache) return cache;
  if (typeof window === "undefined") return SSR;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? { ...DEFAULT, ...(JSON.parse(raw) as Partial<Profile>) } : { ...DEFAULT };
  } catch {
    cache = { ...DEFAULT };
  }
  return cache;
}

function save(next: Profile) {
  cache = next;
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  // Sync-engine DB'den taze veri uygularsa cache'i temizle.
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

export const RISK_LABELS: Record<RiskProfile, string> = {
  conservative: "Temkinli",
  balanced: "Dengeli",
  aggressive: "Agresif",
};

export const profileStore = {
  get: load,
  update(patch: Partial<Profile>) {
    save({ ...load(), ...patch });
  },
  /** Onboarding'i tamamla — tüm seçimleri tek seferde kaydeder. */
  complete(data: Omit<Profile, "onboardingCompleted" | "completedAt">) {
    save({ ...data, onboardingCompleted: true, completedAt: Date.now() });
  },
  reset() {
    save({ ...DEFAULT });
  },
};

export function useProfile() {
  const profile = useSyncExternalStore(subscribe, load, () => SSR);
  return {
    profile,
    update: profileStore.update,
    complete: profileStore.complete,
    reset: profileStore.reset,
  };
}
