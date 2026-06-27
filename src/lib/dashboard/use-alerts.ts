"use client";

import { useSyncExternalStore, useEffect } from "react";
import { notifStore } from "./use-notifications";
import { paperStore } from "./paper-store";
import { securityStore } from "./use-security";

/** Bir bildirim tercihi açık mı? (kapalıysa ilgili bildirim üretilmez) */
function notifEnabled(key: "priceAlerts" | "dailyBrief" | "earnings" | "automation"): boolean {
  try {
    return securityStore.get().notif[key];
  } catch {
    return true; // store okunamazsa varsayılan: açık
  }
}

/** Kalıcı (localStorage) fiyat alarmları — oluştur / aç-kapa / sil. */
export type Alert = {
  id: string;
  symbol: string;
  condition: "above" | "below";
  price: number;
  status: "active" | "triggered";
  createdAt: number;
};

const KEY = "vela.alerts.v1";

/** Tohum alarmlar — module-top'ta Date.now() ÇAĞIRMA, sabit createdAt kullan. */
const SEED: Alert[] = [
  { id: "al1", symbol: "NVDA", condition: "above", price: 220, status: "active", createdAt: 0 },
  { id: "al2", symbol: "TSLA", condition: "below", price: 350, status: "active", createdAt: 0 },
  { id: "al3", symbol: "AAPL", condition: "above", price: 260, status: "triggered", createdAt: 0 },
];

let cache: Alert[] | null = null;
const listeners = new Set<() => void>();

function load(): Alert[] {
  if (cache) return cache;
  if (typeof window === "undefined") return SEED;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as Alert[]) : SEED.map((a) => ({ ...a }));
  } catch {
    cache = SEED.map((a) => ({ ...a }));
  }
  return cache;
}

function save(next: Alert[]) {
  cache = next;
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
}

export function useAlerts() {
  const list = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    load,
    () => SEED,
  );

  return {
    list,
    create(symbol: string, condition: Alert["condition"], price: number) {
      const sym = symbol.trim().toUpperCase();
      if (!sym || !Number.isFinite(price) || price <= 0) return;
      const cur = load();
      const a: Alert = {
        id: `al${Date.now()}`,
        symbol: sym,
        condition,
        price,
        status: "active",
        createdAt: Date.now(),
      };
      save([a, ...cur]);
    },
    toggle(id: string) {
      save(
        load().map((a) =>
          a.id === id
            ? { ...a, status: a.status === "active" ? "triggered" : "active" }
            : a,
        ),
      );
    },
    remove(id: string) {
      save(load().filter((a) => a.id !== id));
    },
  };
}

/** Tetiklenen alert'i işaretle + bildirim düş. */
function trigger(id: string, text: string) {
  const cur = load();
  const a = cur.find((x) => x.id === id);
  if (!a || a.status === "triggered") return;
  save(cur.map((x) => (x.id === id ? { ...x, status: "triggered" as const } : x)));
  notifStore.push("alert", text);
}

/**
 * Alert motoru — aktif alarmların sembollerini canlı fiyatla yoklar,
 * koşul sağlanınca tetikler + bildirim düşer. Dashboard layout'unda 1 kez çalışır.
 */
export function useAlertEngine() {
  useEffect(() => {
    let stop = false;
    async function tick() {
      const active = load().filter((a) => a.status === "active");
      let pendingSyms: string[] = [];
      try {
        pendingSyms = (paperStore.get().pendingOrders ?? []).map((o) => o.symbol);
      } catch {
        /* eski sürüm */
      }
      const allSymbols = [
        ...new Set(
          [...active.map((a) => a.symbol), ...pendingSyms].filter(Boolean),
        ),
      ];
      if (allSymbols.length === 0) return;
      try {
        const res = await fetch(`/api/market/quote?symbols=${allSymbols.join(",")}`);
        if (!res.ok) return;
        const data = (await res.json()) as { quotes?: { symbol: string; price: number }[] };
        const priceBy = new Map((data.quotes ?? []).map((q) => [q.symbol, q.price]));

        // 0) bekleyen gelişmiş emirler (limit/stop/take-profit/trailing/OCO)
        try {
          paperStore.evaluatePending(Object.fromEntries(priceBy));
        } catch {
          /* eski paper-store sürümü — geç */
        }

        // 1) fiyat alarmları — yalnız "Fiyat alarmları" tercihi açıksa.
        //    Kapalıysa alarm tetiklenmez ve status korunur (tercih tekrar
        //    açıldığında koşul hâlâ sağlanıyorsa tetiklenebilir).
        if (notifEnabled("priceAlerts")) {
          for (const a of active) {
            const p = priceBy.get(a.symbol);
            if (p == null) continue;
            const hit = a.condition === "above" ? p >= a.price : p <= a.price;
            if (hit) {
              trigger(
                a.id,
                `${a.symbol} ${a.condition === "above" ? "rose above" : "dropped below"} $${a.price} (now $${p.toFixed(2)})`,
              );
            }
          }
        }

        // NOT: Otomasyon yürütme artık AYRI motorda (use-automation-engine.ts) —
        // bütçe kontrolü + karar defteri + cooldown ile. Çift tetiklemeyi önlemek
        // için buradan kaldırıldı; bu motor sadece alarm + bekleyen emir yürütür.
      } catch {
        /* sessiz geç */
      }
    }
    tick();
    const iv = setInterval(() => {
      if (!stop) tick();
    }, 20000); // 20 sn'de bir
    return () => {
      stop = true;
      clearInterval(iv);
    };
  }, []);
}
