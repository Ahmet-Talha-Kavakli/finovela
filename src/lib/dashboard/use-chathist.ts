"use client";

/**
 * Sohbet geçmişi panelini daralt/genişlet durumu — kalıcı (localStorage).
 * Ana uygulama sidebar'ından (use-sidebar.ts) BAĞIMSIZ; ayrı anahtar kullanır.
 */

import { useSyncExternalStore } from "react";

const KEY = "vela.chathist.collapsed";
let cache: boolean | null = null;
const listeners = new Set<() => void>();

function load(): boolean {
  if (cache !== null) return cache;
  if (typeof window === "undefined") return false;
  cache = localStorage.getItem(KEY) === "1";
  return cache;
}

export const chatHistStore = {
  get: load,
  toggle() {
    const next = !load();
    cache = next;
    if (typeof window !== "undefined") localStorage.setItem(KEY, next ? "1" : "0");
    listeners.forEach((l) => l());
  },
};

export function useChatHistCollapsed() {
  const collapsed = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    load,
    () => false,
  );
  return { collapsed, toggle: chatHistStore.toggle };
}
