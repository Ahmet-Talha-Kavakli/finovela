"use client";

/**
 * Copy-trading store — takip + aktif kopyalama durumu KALICI (localStorage).
 * paper-store ile aynı desen: useSyncExternalStore + vela:rehydrate.
 *
 * "Kopyalama" gerçekten paper-store'a pozisyon yazar (copy-trader-profile.startCopy);
 * bu store yalnız KİMİ takip/kopyaladığını ve ayarları (tutar, stop-loss) tutar ki
 * sayfa yenilenince durum kaybolmasın ve lider tablosunda "Kopyalanıyor" rozeti çıksın.
 */

import { useSyncExternalStore } from "react";

export type CopyEntry = {
  handle: string; // "@quantsarah"
  name: string;
  amount: number; // ayrılan tutar (USD)
  stopLoss: number; // %
  startedAt: number;
};

export type CopyState = {
  following: string[]; // takip edilen handle'lar (@ ile)
  copying: CopyEntry[]; // aktif kopyalananlar
};

const KEY = "vela.copy.v1";

function seed(): CopyState {
  return { following: [], copying: [] };
}

const SSR: CopyState = Object.freeze(seed()) as CopyState;

let cache: CopyState | null = null;
const listeners = new Set<() => void>();

function load(): CopyState {
  if (cache) return cache;
  if (typeof window === "undefined") return SSR;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? { ...seed(), ...(JSON.parse(raw) as Partial<CopyState>) } : seed();
  } catch {
    cache = seed();
  }
  return cache;
}

function save(next: CopyState) {
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

export const copyStore = {
  get: load,
  isFollowing(handle: string): boolean {
    return load().following.includes(handle);
  },
  isCopying(handle: string): boolean {
    return load().copying.some((c) => c.handle === handle);
  },
  getCopy(handle: string): CopyEntry | undefined {
    return load().copying.find((c) => c.handle === handle);
  },
  toggleFollow(handle: string) {
    const s = load();
    const following = s.following.includes(handle)
      ? s.following.filter((h) => h !== handle)
      : [...s.following, handle];
    save({ ...s, following });
  },
  /** Kopyalamayı kaydet (pozisyon yansıtması ayrıca paper-store'a yazılır). */
  startCopy(entry: CopyEntry) {
    const s = load();
    const copying = [entry, ...s.copying.filter((c) => c.handle !== entry.handle)];
    // kopyalanan otomatik takibe de eklenir
    const following = s.following.includes(entry.handle) ? s.following : [...s.following, entry.handle];
    save({ ...s, copying, following });
  },
  stopCopy(handle: string) {
    const s = load();
    save({ ...s, copying: s.copying.filter((c) => c.handle !== handle) });
  },
};

export function useCopy(): CopyState {
  return useSyncExternalStore(subscribe, load, () => SSR);
}
