"use client";

import { useSyncExternalStore } from "react";

/** Kalıcı bildirim merkezi — alert tetikleme, order fill, earnings vb. */
export type Notif = {
  id: string;
  kind: "alert" | "order" | "earnings" | "info";
  text: string;
  ts: number;
  read: boolean;
};

const KEY = "vela.notifs.v1";

// Yeni kullanıcı sadece karşılama bildirimiyle başlar — sahte "BUY 10 NVDA" /
// "AAPL earnings" demo bildirimleri artık yüklenmez (boş portföyle çelişiyordu).
const SEED: Notif[] = [
  { id: "n_welcome", kind: "info", text: "Finovela'ya hoş geldin — AI yatırım asistanın hazır.", ts: 0, read: false },
];

let cache: Notif[] | null = null;
const listeners = new Set<() => void>();

function load(): Notif[] {
  if (cache) return cache;
  if (typeof window === "undefined") return SEED;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as Notif[]) : SEED.map((n) => ({ ...n }));
  } catch {
    cache = SEED.map((n) => ({ ...n }));
  }
  return cache;
}

function save(next: Notif[]) {
  cache = next.slice(0, 50);
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(cache));
  listeners.forEach((l) => l());
}

export const notifStore = {
  get: load,
  push(kind: Notif["kind"], text: string) {
    const cur = load();
    // aynı metin son 1 dk içinde varsa tekrar ekleme (spam önle)
    if (cur.some((n) => n.text === text)) return;
    save([{ id: `n${Date.now()}_${cur.length}`, kind, text, ts: Date.now(), read: false }, ...cur]);
  },
  markAllRead() {
    save(load().map((n) => ({ ...n, read: true })));
  },
  clear() {
    save([]);
  },
};

export function useNotifications() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    load,
    () => SEED,
  );
}
