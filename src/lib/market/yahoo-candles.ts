// GERÇEK günlük/haftalık mum verisi — Yahoo Finance chart API (anahtarsız, ücretsiz).
// Finnhub ücretsiz tier /stock/candle'ı 403 ile engellediği için candle'lar burada.
// Hisse/ETF: çıplak sembol (AAPL). Kripto: BTC-USD biçimi. Forex/metal şimdilik kapsam dışı.
//
// Dönüş, projenin Candle tipiyle birebir aynı — sağlayıcı katmanı hiç değişmez.

import type { Candle, CandleResolution } from "./types";
import { getUniverseEntry } from "./universe";

// Yahoo, çıplak crypto sembolünü "-USD" ekiyle ister (BTC → BTC-USD).
function toYahooSymbol(symbol: string): string {
  const upper = symbol.toUpperCase();
  const entry = getUniverseEntry(symbol);
  if (entry.type === "crypto") return `${upper}-USD`;
  return upper;
}

// CandleResolution → Yahoo interval. Yahoo intraday'i sınırlı tutar; D/W/M yeterli.
function toYahooInterval(resolution: CandleResolution): string {
  switch (resolution) {
    case "W":
      return "1wk";
    case "M":
      return "1mo";
    case "60":
      return "60m";
    case "30":
    case "15":
    case "5":
      return "5m";
    case "1":
      return "1m";
    case "D":
    default:
      return "1d";
  }
}

interface YahooChartResponse {
  chart: {
    result?: {
      timestamp?: number[];
      meta?: { fiftyTwoWeekHigh?: number; fiftyTwoWeekLow?: number; regularMarketPrice?: number };
      indicators: {
        quote: {
          open?: (number | null)[];
          high?: (number | null)[];
          low?: (number | null)[];
          close?: (number | null)[];
          volume?: (number | null)[];
        }[];
      };
    }[];
    error?: unknown;
  };
}

/**
 * Yahoo'dan GERÇEK mumları getirir. from/to UNIX saniye.
 * Başarısız olursa null döner — çağıran taraf sentetik fallback'e düşebilir.
 */
export async function fetchYahooCandles(
  symbol: string,
  resolution: CandleResolution,
  from: number,
  to: number,
): Promise<Candle[] | null> {
  try {
    const ySym = toYahooSymbol(symbol);
    const interval = toYahooInterval(resolution);
    const url =
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ySym)}` +
      `?period1=${Math.floor(from)}&period2=${Math.floor(to)}&interval=${interval}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" },
      next: { revalidate: 300 }, // 5 dk önbellek — günlük mum sık değişmez
    });
    if (!res.ok) return null;
    const data = (await res.json()) as YahooChartResponse;
    const r = data.chart?.result?.[0];
    const ts = r?.timestamp;
    const q = r?.indicators?.quote?.[0];
    if (!r || !ts?.length || !q) return null;

    const out: Candle[] = [];
    for (let i = 0; i < ts.length; i++) {
      const close = q.close?.[i];
      const open = q.open?.[i];
      // Yahoo bazı barlarda null döndürebilir (henüz kapanmamış / tatil) → atla.
      if (close == null || open == null) continue;
      out.push({
        time: ts[i],
        open: +open.toFixed(4),
        high: +(q.high?.[i] ?? Math.max(open, close)).toFixed(4),
        low: +(q.low?.[i] ?? Math.min(open, close)).toFixed(4),
        close: +close.toFixed(4),
        volume: Math.max(0, Math.floor(q.volume?.[i] ?? 0)),
      });
    }
    return out.length ? out : null;
  } catch {
    return null;
  }
}

export interface YahooFundamentals {
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  price: number | null;
}

/**
 * GERÇEK 52-haftalık yüksek/düşük + spot — chart meta'sından (tek istek).
 * compare sayfasındaki uydurma RNG değerlerinin yerine geçer.
 */
export async function fetchYahooFundamentals(symbol: string): Promise<YahooFundamentals | null> {
  try {
    const ySym = toYahooSymbol(symbol);
    const url =
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ySym)}` +
      `?range=1d&interval=1d`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" },
      next: { revalidate: 900 }, // 15 dk — 52h yüksek/düşük yavaş değişir
    });
    if (!res.ok) return null;
    const data = (await res.json()) as YahooChartResponse;
    const meta = data.chart?.result?.[0]?.meta;
    if (!meta) return null;
    return {
      fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh ?? null,
      fiftyTwoWeekLow: meta.fiftyTwoWeekLow ?? null,
      price: meta.regularMarketPrice ?? null,
    };
  } catch {
    return null;
  }
}
