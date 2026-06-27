"use client";

/**
 * Sidebar daralt/genişlet durumu — kalıcı (localStorage). Daraltılınca sadece
 * ikonlar görünür. İçerik padding'i <html data-sidebar="collapsed"> ile CSS'ten
 * ayarlanır (layout server component olduğu için).
 */

import { useSyncExternalStore } from "react";

const KEY = "vela.sidebar.collapsed";
let cache: boolean | null = null;
const listeners = new Set<() => void>();

function load(): boolean {
  if (cache !== null) return cache;
  if (typeof window === "undefined") return false;
  cache = localStorage.getItem(KEY) === "1";
  return cache;
}

function applyHtmlAttr(collapsed: boolean) {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-sidebar", collapsed ? "collapsed" : "expanded");
  }
}

export const sidebarStore = {
  get: load,
  toggle() {
    const next = !load();
    cache = next;
    if (typeof window !== "undefined") localStorage.setItem(KEY, next ? "1" : "0");
    applyHtmlAttr(next);
    listeners.forEach((l) => l());
  },
};

export function useSidebarCollapsed() {
  const collapsed = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    load,
    () => false,
  );
  return { collapsed, toggle: sidebarStore.toggle };
}
