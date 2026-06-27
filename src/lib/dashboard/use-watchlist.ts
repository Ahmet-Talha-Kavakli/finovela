"use client";

import { useSyncExternalStore } from "react";
import { WATCHLIST } from "./data";

/** Kalıcı (localStorage) watchlist — ekle/çıkar, her yerde senkron. */
const KEY = "vela.watchlist.v1";
let cache: string[] | null = null;
const listeners = new Set<() => void>();

function load(): string[] {
  if (cache) return cache;
  if (typeof window === "undefined") return WATCHLIST;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as string[]) : [...WATCHLIST];
  } catch {
    cache = [...WATCHLIST];
  }
  return cache;
}

function save(next: string[]) {
  cache = next;
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
}

export function useWatchlist() {
  const list = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    load,
    () => WATCHLIST,
  );
  return {
    list,
    has: (sym: string) => list.includes(sym.toUpperCase()),
    toggle: (sym: string) => {
      const s = sym.toUpperCase();
      const cur = load();
      save(cur.includes(s) ? cur.filter((x) => x !== s) : [s, ...cur]);
    },
    remove: (sym: string) => save(load().filter((x) => x !== sym.toUpperCase())),
  };
}
