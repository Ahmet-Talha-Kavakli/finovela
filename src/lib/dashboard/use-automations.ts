"use client";

import { useSyncExternalStore } from "react";
import { AUTOMATIONS, type Automation } from "./data";
import { UNIVERSE } from "@/lib/market/universe";

// Tüm evren sembolleri (uzun olanlar önce → GRAMALTIN, USDTRY önce eşleşsin).
const KNOWN_SYMBOLS = UNIVERSE.map((u) => u.symbol).sort((a, b) => b.length - a.length);

/** Kalıcı otomasyon ajanları — oluştur / aç-kapa / sil. */
const KEY = "vela.automations.v1";
let cache: Automation[] | null = null;
const listeners = new Set<() => void>();

function load(): Automation[] {
  if (cache) return cache;
  if (typeof window === "undefined") return AUTOMATIONS;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as Automation[]) : AUTOMATIONS.map((a) => ({ ...a }));
  } catch {
    cache = AUTOMATIONS.map((a) => ({ ...a }));
  }
  return cache;
}

function save(next: Automation[]) {
  cache = next;
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
}

/** Sade-dil kuraldan kategori tahmin et (mini niyet sınıflandırma). */
function classify(rule: string): Automation["category"] {
  const r = rule.toLowerCase();
  if (/(sweep|cash|dividend|drip|deposit|reinvest)/.test(r)) return "Cash";
  if (/(stop|hedge|protect|rebalance|risk|trailing)/.test(r)) return "Risk";
  return "Trading";
}

export function useAutomations() {
  const list = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    load,
    () => AUTOMATIONS,
  );

  return {
    list,
    create(rule: string, name?: string) {
      const trimmed = rule.trim();
      if (!trimmed) return;
      const cur = load();
      const a: Automation = {
        id: `a${Date.now()}`,
        name: name?.trim() || titleFrom(trimmed),
        rule: trimmed,
        status: "active",
        category: classify(trimmed),
        lastRun: "Just created",
      };
      save([a, ...cur]);
    },
    toggle(id: string) {
      save(load().map((a) => (a.id === id ? { ...a, status: a.status === "active" ? "paused" : "active" } : a)));
    },
    remove(id: string) {
      save(load().filter((a) => a.id !== id));
    },
  };
}

function titleFrom(rule: string): string {
  const words = rule.split(" ").slice(0, 4).join(" ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/* ---- OTOMASYON YÜRÜTME (gerçek) ---- */

/** Sade-dil kuraldan tetikli niyet çıkar (stop-loss / dip-buy / indikatör). */
export type ParsedRule =
  | { kind: "stop"; symbol: string; price: number; sharesPct: number }
  | { kind: "buydip"; symbol: string; price: number; amount: number }
  | { kind: "rsi"; symbol: string; level: number; dir: "below" | "above"; side: "BUY" | "SELL"; amount: number }
  | { kind: "macd"; symbol: string; dir: "bullish" | "bearish"; side: "BUY" | "SELL"; amount: number }
  | { kind: "bollinger"; symbol: string; band: "lower" | "upper"; side: "BUY" | "SELL"; amount: number }
  | { kind: "none" };

export function parseRule(rule: string): ParsedRule {
  const r = rule.toLowerCase();
  // Önce evrendeki bilinen sembolleri ara (GRAMALTIN, USDTRY, THYAO gibi 2-9 harf
  // çok-varlık sembolleri dahil), bulunamazsa genel 2-5 harf yakalamasına düş.
  const upper = rule.toUpperCase();
  let sym: string | undefined =
    KNOWN_SYMBOLS.find((s) => new RegExp(`\\b${s}\\b`).test(upper)) ??
    rule.match(/\b([A-Z]{2,5})\b/)?.[1];
  if (!sym) return { kind: "none" };
  sym = sym.toUpperCase();
  // Tutar: yatırılacak miktar para işaretiyle gelir ($500, ₺1.000, 1000$, 1000₺).
  // İşaretsiz sayılar (RSI seviyesi, fiyat eşiği) tutar olarak ALINMAZ.
  const amtMatch =
    r.match(/[$₺]\s?(\d{1,3}(?:[.,]\d{3})*|\d{2,7})/) ?? // $500 / ₺1.000
    r.match(/(\d{1,3}(?:[.,]\d{3})*|\d{2,7})\s?[$₺]/) ?? // 500$ / 1.000₺
    r.match(/(\d{2,7})\s?(?:dolar|lira|tl)\b/); // 500 dolar / 1000 lira
  const amount = amtMatch ? parseFloat(amtMatch[1].replace(/[.,]/g, "")) : 200;

  // RSI tetikleyici: "buy NVDA when RSI drops below 30" / "RSI 70 üstüne çıkınca sat"
  const rsiM = r.match(/rsi[^0-9]{0,12}(\d{1,3})/);
  if (rsiM) {
    const level = parseFloat(rsiM[1]);
    const dir: "below" | "above" = /(above|over|üst|geç|exceed)/.test(r) ? "above" : "below";
    const side: "BUY" | "SELL" = /\b(sell|sat|trim|reduce)\b/.test(r) ? "SELL" : "BUY";
    return { kind: "rsi", symbol: sym, level, dir, side, amount };
  }

  // MACD tetikleyici: "buy NVDA on MACD bullish crossover" / "sell on bearish MACD cross"
  if (/macd/.test(r)) {
    const dir: "bullish" | "bearish" = /(bear|down|negative|sell|sat|cross\s*down)/.test(r) ? "bearish" : "bullish";
    const side: "BUY" | "SELL" = dir === "bearish" || /\b(sell|sat|trim|reduce)\b/.test(r) ? "SELL" : "BUY";
    return { kind: "macd", symbol: sym, dir, side, amount };
  }

  // Bollinger tetikleyici: "buy AMD when it touches the lower Bollinger band"
  if (/bollinger|band/.test(r)) {
    const band: "lower" | "upper" = /(upper|üst|top|high)/.test(r) ? "upper" : "lower";
    const side: "BUY" | "SELL" = band === "upper" || /\b(sell|sat|trim|reduce)\b/.test(r) ? "SELL" : "BUY";
    return { kind: "bollinger", symbol: sym, band, side, amount };
  }

  // Fiyat eşiği: kuraldaki tüm sayıları al, tutar olarak yakalananı çıkar,
  // kalan en büyük makul sayıyı eşik kabul et (çok-varlık + TR binlik destekli).
  const nums = (r.match(/\d{1,3}(?:[.,]\d{3})*(?:\.\d+)?|\d{2,7}(?:\.\d+)?/g) ?? [])
    .map((s) => parseFloat(s.replace(/\.(?=\d{3}\b)/g, "").replace(",", "")))
    .filter((n) => Number.isFinite(n));
  const candidates = amtMatch ? nums.filter((n) => n !== amount) : nums;
  const price = (candidates.length ? candidates : nums).sort((a, b) => b - a)[0] ?? NaN;
  if (!Number.isFinite(price)) return { kind: "none" };
  if (/\b(sell|stop|drops? below|düşerse|altına)\b/.test(r)) {
    return { kind: "stop", symbol: sym, price, sharesPct: 1 };
  }
  if (/\b(buy|add|al|pullback|dip|düşüş)\b/.test(r)) {
    return { kind: "buydip", symbol: sym, price, amount };
  }
  return { kind: "none" };
}

/** Aktif, fiyat-tetikli otomasyonları döndür (motor için). */
export function getExecutableAutomations(): { id: string; rule: string; parsed: ParsedRule }[] {
  return load()
    .filter((a) => a.status === "active")
    .map((a) => ({ id: a.id, rule: a.rule, parsed: parseRule(a.rule) }))
    .filter((a) => a.parsed.kind !== "none");
}

/** Otomasyonu "çalıştı" olarak işaretle (tekrar tetiklenmesin). */
export function markAutomationRun(id: string, note: string) {
  save(load().map((a) => (a.id === id ? { ...a, status: "paused" as const, lastRun: note } : a)));
}
