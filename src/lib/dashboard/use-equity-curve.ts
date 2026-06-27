"use client";

// GERÇEK portföy değeri eğrisi — mevcut holdings'in günlük candle'larından
// (her gün: Σ shares × o günün kapanışı + nakit) hesaplanır. Sahte sinüs değil.
// Benchmark: SPY (S&P 500 ETF) gerçek candle'ı, başlangıçta portföye normalize.
//
// Holding yoksa veya candle alınamazsa düz çizgi (mevcut toplam) döner — yanıltıcı
// uydurma performans ASLA gösterilmez.

import { useEffect, useState } from "react";
import { usePaper } from "@/lib/dashboard/use-portfolio";

export type EquityPoint = { t: number; v: number };

const RANGE_DAYS: Record<string, number> = {
  "1A": 30,
  "3A": 90,
  "6A": 180,
  "1Y": 365,
  // YTD ayrı hesaplanır (yıl başından) — burada yok.
};

async function fetchCandles(symbol: string, fromSec: number, toSec: number) {
  try {
    const res = await fetch(
      `/api/market/candles?symbol=${encodeURIComponent(symbol)}&resolution=D&from=${fromSec}&to=${toSec}`,
      { cache: "no-store" },
    );
    const data = (await res.json()) as { candles?: { time: number; close: number }[] };
    return data.candles ?? [];
  } catch {
    return [];
  }
}

export function useEquityCurve(rangeKey: string = "1Y") {
  const paper = usePaper();
  const [curve, setCurve] = useState<EquityPoint[]>([]);
  // AreaChart benchmark'ı number[] bekler ve curve ile AYNI uzunlukta olmalı
  // (aynı x-eksenine hizalı). Bu yüzden SPY'ı curve noktalarına eşleyip değer dizisi veririz.
  const [benchmark, setBenchmark] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  // holdings imzası — değişince yeniden hesapla.
  const sig = paper.holdings.map((h) => `${h.symbol}:${h.shares}`).join("|") + `|${paper.cash}`;

  useEffect(() => {
    let cancelled = false;
    const toSec = Math.floor(Date.now() / 1000);
    // YTD GERÇEKTEN yıl başından hesaplanır (sabit 365 gün değil).
    let fromSec: number;
    if (rangeKey === "YTD") {
      const now = new Date();
      fromSec = Math.floor(new Date(now.getFullYear(), 0, 1).getTime() / 1000);
    } else {
      const days = RANGE_DAYS[rangeKey] ?? 365;
      fromSec = toSec - days * 86400;
    }

    void (async () => {
      setLoading(true);
      const holdings = paper.holdings.filter((h) => h.shares > 0);

      // Holding yoksa düz çizgi (nakit sabit).
      if (holdings.length === 0) {
        if (!cancelled) {
          const flat: EquityPoint[] = [
            { t: fromSec * 1000, v: paper.cash },
            { t: toSec * 1000, v: paper.cash },
          ];
          setCurve(flat);
          setBenchmark([]);
          setLoading(false);
        }
        return;
      }

      // Her holding için günlük candle çek (paralel).
      const series = await Promise.all(
        holdings.map(async (h) => ({
          shares: h.shares,
          candles: await fetchCandles(h.symbol, fromSec, toSec),
        })),
      );
      // SPY benchmark
      const spy = await fetchCandles("SPY", fromSec, toSec);
      if (cancelled) return;

      // Ortak tarih ekseni: en çok veri içeren holding'in zamanları.
      const base = series.reduce(
        (best, s) => (s.candles.length > best.length ? s.candles : best),
        [] as { time: number; close: number }[],
      );
      if (base.length === 0) {
        // Candle yok → bugünkü canlı toplamı düz çizgi göster (sahte geçmiş yok).
        const total = paper.cash;
        setCurve([
          { t: fromSec * 1000, v: total },
          { t: toSec * 1000, v: total },
        ]);
        setBenchmark([]);
        setLoading(false);
        return;
      }

      // Her holding için tarih→kapanış haritası (hızlı erişim).
      const maps = series.map((s) => {
        const m = new Map<number, number>();
        for (const c of s.candles) m.set(dayKey(c.time), c.close);
        return { shares: s.shares, m };
      });

      // Her tarih için portföy değeri = Σ shares × kapanış + nakit.
      const points: EquityPoint[] = [];
      let lastClose = new Map<number, number>(); // sembol idx → son bilinen kapanış
      for (const c of base) {
        const dk = dayKey(c.time);
        let val = paper.cash;
        maps.forEach((hm, idx) => {
          const close = hm.m.get(dk) ?? lastClose.get(idx);
          if (close != null) {
            val += hm.shares * close;
            lastClose.set(idx, close);
          }
        });
        points.push({ t: c.time * 1000, v: +val.toFixed(2) });
      }

      // Benchmark: SPY'ı portföyün başlangıç değerine normalize et + curve'ün
      // HER noktasına hizala (number[], aynı uzunluk). SPY tarih→kapanış haritası.
      let bench: number[] = [];
      if (spy.length > 1 && points.length > 0) {
        const startV = points[0].v;
        const spyStart = spy[0].close;
        const spyMap = new Map<number, number>();
        for (const c of spy) spyMap.set(dayKey(c.time), c.close);
        let lastSpy = spyStart;
        bench = points.map((p) => {
          const dk = dayKey(Math.floor(p.t / 1000));
          const close = spyMap.get(dk) ?? lastSpy;
          lastSpy = close;
          return +((close / spyStart) * startV).toFixed(2);
        });
      }

      if (!cancelled) {
        setCurve(points);
        setBenchmark(bench);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig, rangeKey]);

  return { curve, benchmark, loading };
}

/** Unix saniyeyi gün anahtarına indir (saat farkını yok say). */
function dayKey(timeSec: number): number {
  return Math.floor(timeSec / 86400);
}
