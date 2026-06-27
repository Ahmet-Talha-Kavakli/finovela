"use client";

import { useSyncExternalStore } from "react";

/**
 * Vela AI kalıcı hafızası — oturumlar arası (Tori/Public Alpha gibi).
 * Kullanıcı hakkında öğrenilen kalıcı gerçekler: risk tercihi, hedefler,
 * ilgi alanları, kısıtlar. Her sohbette system context'e enjekte edilir.
 * localStorage'da kalıcı.
 */
export type MemoryFact = {
  id: string;
  text: string;
  createdAt: number;
};

const KEY = "vela.aimemory.v1";

const SEED: MemoryFact[] = [
  { id: "m1", text: "Prefers a balanced risk profile, max ~60% in tech.", createdAt: 0 },
  { id: "m2", text: "Long-term investor — dislikes day-trading churn.", createdAt: 0 },
];

let cache: MemoryFact[] | null = null;
const listeners = new Set<() => void>();

function load(): MemoryFact[] {
  if (cache) return cache;
  if (typeof window === "undefined") return SEED;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as MemoryFact[]) : SEED.map((m) => ({ ...m }));
  } catch {
    cache = SEED.map((m) => ({ ...m }));
  }
  return cache;
}

function save(next: MemoryFact[]) {
  cache = next;
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
}

export const memoryStore = {
  get: load,
  subscribe(cb: () => void) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
  /** Yeni gerçek ekle (yinelenenleri kabaca eler). */
  remember(text: string) {
    const t = text.trim();
    if (!t) return;
    const cur = load();
    if (cur.some((m) => m.text.toLowerCase() === t.toLowerCase())) return;
    save([...cur, { id: `m${Date.now()}`, text: t, createdAt: Date.now() }]);
  },
  forget(id: string) {
    save(load().filter((m) => m.id !== id));
  },
  clear() {
    save([]);
  },
  /** System-prompt'a enjekte edilecek tek bloklu metin. */
  asContext(): string {
    const facts = load();
    if (facts.length === 0) return "";
    return facts.map((m) => `- ${m.text}`).join("\n");
  },
};

export function useAiMemory() {
  const list = useSyncExternalStore(memoryStore.subscribe, load, () => SEED);
  return {
    list,
    remember: memoryStore.remember,
    forget: memoryStore.forget,
    clear: memoryStore.clear,
  };
}
