"use client";

import { useEffect, useState } from "react";

/**
 * Verilen semboller için GERÇEK sparkline serilerini (son ~30 gün kapanış) toplu çeker.
 * Sparkline mini-grafiklerini seed-sahte yerine gerçek fiyat geçmişiyle besler.
 * Dönüş: { [symbol]: number[] }. Henüz yüklenmemiş semboller eksik kalır → Sparkline
 * data prop'u undefined alıp temsili fallback'e düşer (zarif).
 *
 * Modül-içi cache: aynı semboller için tekrar tekrar fetch yapılmaz (sayfa içi paylaşım).
 */
const memCache = new Map<string, number[]>();

export function useSparklines(symbols: string[]): Record<string, number[]> {
  const key = [...new Set(symbols.map((s) => s.toUpperCase()))].sort().join(",");
  // tick — fetch tamamlanınca artırılır, render'ı tetikler (state cache'ten türetilir).
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!key) return;
    const wanted = key.split(",");
    const missing = wanted.filter((s) => !memCache.has(s));
    if (missing.length === 0) return; // hepsi cache'te — render zaten cache'ten okur
    let cancelled = false;
    fetch(`/api/market/sparklines?symbols=${encodeURIComponent(missing.join(","))}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { series?: Record<string, number[]> }) => {
        if (cancelled || !d.series) return;
        for (const [s, arr] of Object.entries(d.series)) memCache.set(s, arr);
        setTick((t) => t + 1); // yeniden render → aşağıdaki türev cache'ten dolar
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [key]);

  // Render-türevi: state tutmaz, her render'da cache'ten okunur (lint-temiz, tutarlı).
  const out: Record<string, number[]> = {};
  for (const s of key.split(",").filter(Boolean)) {
    const c = memCache.get(s);
    if (c) out[s] = c;
  }
  return out;
}
