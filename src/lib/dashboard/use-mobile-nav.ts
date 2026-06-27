"use client";

import { useSyncExternalStore } from "react";

/** Mobil sidebar aç/kapa — paylaşılan basit store (topbar hamburger ↔ sidebar drawer). */
let open = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export const mobileNav = {
  toggle() { open = !open; emit(); },
  close() { open = false; emit(); },
};

export function useMobileNav() {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => open,
    () => false,
  );
}
