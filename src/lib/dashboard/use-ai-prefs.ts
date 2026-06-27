"use client";

/**
 * Vela AI tercihleri — sohbet modeli (kademe) + yanıt tonu.
 * Kalıcı (vela.aiprefs.v1). use-brain.ts deseniyle birebir aynı external store.
 *
 * Model kademeleri (kullanıcıya dostça ad gösterilir, gerçek model id sunucuda eşlenir):
 *  - "vela-1"   → hızlı/ucuz
 *  - "vela-1.1" → dengeli (VARSAYILAN — hızlı ilk yanıt + yüksek kalite; Opus
 *                 varsayılanken ilk token 20-30sn sürüyor "donma" gibi algılanıyordu)
 *  - "vela-1.2" → en yetenekli (kullanıcı seçerse; en yavaş)
 *
 * Ton:
 *  - "balanced"     → Dengeli (varsayılan, sistem tonunu değiştirmez)
 *  - "concise"      → Kısa ve net
 *  - "professional" → Profesyonel
 *  - "warm"         → Sıcak ve samimi
 */

import { useSyncExternalStore } from "react";

export type ModelTier = "vela-1" | "vela-1.1" | "vela-1.2";
export type Tone = "balanced" | "concise" | "professional" | "warm";

export type AiPrefs = {
  tier: ModelTier;
  tone: Tone;
};

const KEY = "vela.aiprefs.v1";

const DEFAULT: AiPrefs = {
  tier: "vela-1.1",
  tone: "balanced",
};

const SSR: AiPrefs = Object.freeze({ ...DEFAULT });

const VALID_TIERS: ModelTier[] = ["vela-1", "vela-1.1", "vela-1.2"];
const VALID_TONES: Tone[] = ["balanced", "concise", "professional", "warm"];

let cache: AiPrefs | null = null;
const listeners = new Set<() => void>();

function sanitize(p: Partial<AiPrefs>): AiPrefs {
  return {
    tier: VALID_TIERS.includes(p.tier as ModelTier) ? (p.tier as ModelTier) : DEFAULT.tier,
    tone: VALID_TONES.includes(p.tone as Tone) ? (p.tone as Tone) : DEFAULT.tone,
  };
}

function load(): AiPrefs {
  if (cache) return cache;
  if (typeof window === "undefined") return SSR;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? sanitize(JSON.parse(raw) as Partial<AiPrefs>) : { ...DEFAULT };
  } catch {
    cache = { ...DEFAULT };
  }
  return cache;
}

function save(next: AiPrefs) {
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

export const aiPrefsStore = {
  get: load,
  setTier(tier: ModelTier) {
    save(sanitize({ ...load(), tier }));
  },
  setTone(tone: Tone) {
    save(sanitize({ ...load(), tone }));
  },
};

export function useAiPrefs() {
  const prefs = useSyncExternalStore(subscribe, load, () => SSR);
  return {
    prefs,
    setTier: aiPrefsStore.setTier,
    setTone: aiPrefsStore.setTone,
  };
}

/** Kademe → kullanıcıya gösterilen dostça ad. */
export const TIER_LABELS: Record<ModelTier, string> = {
  "vela-1": "Finovela 1",
  "vela-1.1": "Finovela 1.1",
  "vela-1.2": "Finovela 1.2",
};

/** Kademe → kısa açıklama (UI dropdown için). */
export const TIER_DESC: Record<ModelTier, string> = {
  "vela-1": "Hızlı",
  "vela-1.1": "Dengeli",
  "vela-1.2": "En yetenekli",
};

/** Ton → kullanıcıya gösterilen ad. */
export const TONE_LABELS: Record<Tone, string> = {
  balanced: "Dengeli",
  concise: "Kısa ve net",
  professional: "Profesyonel",
  warm: "Sıcak ve samimi",
};
