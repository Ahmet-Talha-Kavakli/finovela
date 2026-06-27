"use client";

import { useSyncExternalStore, useEffect, useState } from "react";
import { paperStore } from "./paper-store";
import { getUniverseEntry } from "@/lib/market/universe";

/** paper-store'u React'e bağlar (canlı holdings + cash + orders). */
export function usePaper() {
  return useSyncExternalStore(
    paperStore.subscribe,
    () => paperStore.get(),
    () => paperStore.getServerState(),
  );
}

export type LivePosition = {
  symbol: string;
  name: string;
  sector: string;
  shares: number;
  avgCost: number;
  price: number;
  changePct: number;
  value: number;
  cost: number;
  pl: number;
  plPct: number;
};

/** Canlı fiyatları /api/market'tan çeker; paper holdings ile birleştirir. */
export function useLivePortfolio() {
  const paper = usePaper();
  const [quotes, setQuotes] = useState<Record<string, { price: number; changePct: number }>>({});
  const symbols = paper.holdings.map((h) => h.symbol).join(",");

  useEffect(() => {
    let cancelled = false;
    if (!symbols) return;
    const poll = () => {
      fetch(`/api/market/quote?symbols=${symbols}`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((data: { quotes?: { symbol: string; price: number; changePct: number }[] }) => {
          if (cancelled || !data.quotes) return;
          const map: Record<string, { price: number; changePct: number }> = {};
          for (const q of data.quotes) map[q.symbol] = { price: q.price, changePct: q.changePct };
          setQuotes(map);
        })
        .catch(() => {});
    };
    poll();
    // Canlı tazeleme — 15 sn'de bir (gecikmeli veri hissini giderir).
    const id = setInterval(poll, 15000);
    // Sekme tekrar görünür olunca anında tazele.
    const onVis = () => {
      if (document.visibilityState === "visible") poll();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [symbols]);

  const positions: LivePosition[] = paper.holdings.map((h) => {
    const u = getUniverseEntry(h.symbol);
    const live = quotes[h.symbol];
    const price = live?.price ?? u.basePrice;
    const changePct = live?.changePct ?? 0;
    const value = price * h.shares;
    const cost = h.avgCost * h.shares;
    const pl = value - cost;
    return {
      symbol: h.symbol,
      name: u.name,
      sector: u.sector,
      shares: h.shares,
      avgCost: h.avgCost,
      price,
      changePct,
      value: +value.toFixed(2),
      cost: +cost.toFixed(2),
      pl: +pl.toFixed(2),
      plPct: cost ? +((pl / cost) * 100).toFixed(2) : 0,
    };
  });

  const invested = positions.reduce((s, p) => s + p.value, 0);
  const costBasis = positions.reduce((s, p) => s + p.cost, 0);
  // Günlük P&L = adet × (fiyat − önceki kapanış). changePct önceki kapanışa göre
  // olduğu için dünkü değeri baz almalıyız (bugünkü value'yu değil — o, P&L'i
  // price/prevClose oranı kadar şişirir). prevValue = value / (1 + pct/100).
  const dayPl = positions.reduce((s, p) => {
    const prevValue = p.value / (1 + p.changePct / 100);
    return s + (p.value - prevValue);
  }, 0);
  const summary = {
    total: +(invested + paper.cash).toFixed(2),
    invested: +invested.toFixed(2),
    cash: paper.cash,
    totalPl: +(invested - costBasis).toFixed(2),
    totalPlPct: costBasis ? +(((invested - costBasis) / costBasis) * 100).toFixed(2) : 0,
    dayPl: +dayPl.toFixed(2),
    dayPlPct: invested ? +((dayPl / invested) * 100).toFixed(2) : 0,
  };

  // Risk Score 1-10 (konsantrasyon + kripto ağırlığı + tek-isim yoğunluğu)
  const invSum = invested || 1;
  const top = positions.length
    ? Math.max(...positions.map((p) => p.value)) / invSum
    : 0; // en büyük pozisyonun ağırlığı
  const cryptoWeight =
    positions.filter((p) => p.sector === "Crypto").reduce((s, p) => s + p.value, 0) / invSum;
  // HHI (konsantrasyon): 0 (çok dağınık) → 1 (tek varlık)
  const hhi = positions.reduce((s, p) => s + Math.pow(p.value / invSum, 2), 0);
  const cashWeight = summary.total ? paper.cash / summary.total : 0;
  let score =
    2 +
    top * 4 + // tek pozisyon ağırlığı
    cryptoWeight * 4 + // kripto oynaklığı
    hhi * 3 - // konsantrasyon
    cashWeight * 2; // nakit riski düşürür
  score = Math.max(1, Math.min(10, Math.round(score)));
  const riskLabel = score <= 3 ? "Conservative" : score <= 6 ? "Balanced" : score <= 8 ? "Aggressive" : "High risk";

  return {
    positions,
    summary,
    orders: paper.orders,
    risk: { score, label: riskLabel, topWeight: +(top * 100).toFixed(0), cryptoWeight: +(cryptoWeight * 100).toFixed(0) },
    ready: Object.keys(quotes).length > 0,
  };
}
