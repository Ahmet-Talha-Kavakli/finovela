"use client";

/**
 * Vela opsiyon pozisyon defteri — gerçek çalışan paper opsiyon ledger'ı.
 * localStorage'da kalıcı (vela.options.v1); React'te useSyncExternalStore ile dinlenir.
 * Açılan strateji bacakları burada pozisyona dönüşür; canlı P/L Black-Scholes ile mark edilir.
 */

import { notifStore } from "./use-notifications";

export type OptionPosition = {
  id: string;
  underlying: string;
  type: "call" | "put";
  side: "long" | "short";
  strike: number;
  expiry: string; // gösterim etiketi (örn. "Jul 18")
  expiryDte: number; // açılışta kalan gün — mark için kullanılır
  contracts: number;
  premium: number; // bacak başına ödenen/alınan prim (hisse başına, * 100 = kontrat)
  iv: number; // açılıştaki örtük oynaklık (0-1)
  opened: number; // timestamp
};

const KEY = "vela.options.v1";
const RATE = 0.043; // risksiz faiz — sayfadaki BS ile tutarlı

// Abramowitz–Stegun normal CDF — options/page.tsx ile aynı yaklaşım.
function normCdf(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp((-x * x) / 2);
  let p =
    d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  if (x > 0) p = 1 - p;
  return p;
}

/** Black-Scholes teorik opsiyon fiyatı (hisse başına). */
export function bsPrice(spot: number, strike: number, tYears: number, vol: number, call: boolean): number {
  if (tYears <= 0) {
    return call ? Math.max(spot - strike, 0) : Math.max(strike - spot, 0);
  }
  const d1 = (Math.log(spot / strike) + (RATE + (vol * vol) / 2) * tYears) / (vol * Math.sqrt(tYears));
  const d2 = d1 - vol * Math.sqrt(tYears);
  const price = call
    ? spot * normCdf(d1) - strike * Math.exp(-RATE * tYears) * normCdf(d2)
    : strike * Math.exp(-RATE * tYears) * normCdf(-d2) - spot * normCdf(-d1);
  return Math.max(price, 0);
}

/**
 * Pozisyonun anlık piyasa değeri ve P/L'i (toplam dolar, kontrat = 100 hisse).
 * markPrice = underlying anlık fiyatı.
 */
export function markPosition(pos: OptionPosition, markPrice: number): { mark: number; pl: number } {
  // Basitlik için zaman değerini açılış DTE'sinden hesaplarız (demo paper-trade).
  const tYears = Math.max(pos.expiryDte, 0) / 365;
  const theo = bsPrice(markPrice, pos.strike, tYears, pos.iv, pos.type === "call");
  const mult = 100 * pos.contracts;
  // long: mevcut değer - ödenen prim; short: alınan prim - mevcut değer.
  const sign = pos.side === "long" ? 1 : -1;
  const mark = +(theo * mult).toFixed(2);
  const pl = +(sign * (theo - pos.premium) * mult).toFixed(2);
  return { mark, pl };
}

type OptionsState = { positions: OptionPosition[] };

let state: OptionsState | null = null;
const listeners = new Set<() => void>();

function load(): OptionsState {
  if (state) return state;
  if (typeof window === "undefined") return { positions: [] };
  try {
    const raw = localStorage.getItem(KEY);
    state = raw ? (JSON.parse(raw) as OptionsState) : { positions: [] };
  } catch {
    state = { positions: [] };
  }
  return state;
}

function persist() {
  if (typeof window !== "undefined" && state) {
    localStorage.setItem(KEY, JSON.stringify(state));
  }
  listeners.forEach((l) => l());
}

export const optionsStore = {
  get(): OptionsState {
    return load();
  },
  subscribe(cb: () => void) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
  list(): OptionPosition[] {
    return load().positions;
  },
  /** Yeni opsiyon pozisyonu aç (id + opened otomatik). */
  openPosition(p: Omit<OptionPosition, "id" | "opened">): OptionPosition {
    const s = load();
    const pos: OptionPosition = { ...p, id: `op${Date.now()}_${s.positions.length}`, opened: Date.now() };
    s.positions.unshift(pos);
    persist();
    return pos;
  },
  /**
   * Pozisyonu kapat — anlık P/L'i defterden düşer, bildirim atar.
   * markPrice verilirse gerçekleşen P/L hesaplanıp bildirilir.
   */
  closePosition(id: string, markPrice?: number): { ok: boolean } {
    const s = load();
    const pos = s.positions.find((x) => x.id === id);
    if (!pos) return { ok: false };
    s.positions = s.positions.filter((x) => x.id !== id);
    if (markPrice != null) {
      const { pl } = markPosition(pos, markPrice);
      notifStore.push(
        "order",
        `Closed ${pos.side} ${pos.type} ${pos.underlying} ${pos.strike} · ${pl >= 0 ? "+" : "-"}$${Math.abs(pl).toFixed(2)} · paper`,
      );
    } else {
      notifStore.push("order", `Closed ${pos.side} ${pos.type} ${pos.underlying} ${pos.strike} · paper`);
    }
    persist();
    return { ok: true };
  },
  reset() {
    state = { positions: [] };
    persist();
  },
};
