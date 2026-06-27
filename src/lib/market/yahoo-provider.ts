// Yahoo Finance sağlayıcısı — BIST (Borsa İstanbul) hisseleri için.
// Anahtarsız, TRY fiyatları doğrudan gelir (THYAO.IS gibi .IS sembolleri).
// Resmi değil; cache + sentetik fallback ile güvenli kullanılır.

import type {
  Candle,
  CandleResolution,
  CompanyProfile,
  MarketProvider,
  NewsItem,
  Quote,
  SearchResult,
} from "./types";
import { getUniverseEntry, UNIVERSE } from "./universe";

const CHART = "https://query1.finance.yahoo.com/v8/finance/chart";

// Yahoo bazen UA olmadan engelliyor — tarayıcı UA ile iste.
const HEADERS = {
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
};

function resBucket(resolution: CandleResolution): { interval: string; range: string } {
  switch (resolution) {
    case "1":
    case "5":
    case "15":
    case "30":
    case "60":
      return { interval: "60m", range: "1mo" };
    case "W":
      return { interval: "1wk", range: "2y" };
    case "M":
      return { interval: "1mo", range: "5y" };
    default:
      return { interval: "1d", range: "1y" };
  }
}

/** Sembolden deterministik sentetik fiyat (Yahoo erişilemezse). Asla 0 dönmez. */
function syntheticQuote(symbol: string): { price: number; changePct: number } {
  const base = getUniverseEntry(symbol).basePrice;
  let h = 0;
  for (const c of symbol.toUpperCase()) h = (h * 31 + c.charCodeAt(0)) % 1000;
  const changePct = +(((h % 70) - 28) / 10).toFixed(2); // -2.8 .. +4.1
  return { price: +(base * (1 + changePct / 100)).toFixed(2), changePct };
}

export class YahooProvider implements MarketProvider {
  name = "yahoo";

  private ysym(symbol: string): string {
    return getUniverseEntry(symbol).providerSymbol ?? `${symbol.toUpperCase()}.IS`;
  }

  async getQuote(symbol: string): Promise<Quote> {
    const entry = getUniverseEntry(symbol);
    try {
      const r = await fetch(`${CHART}/${this.ysym(symbol)}?interval=1d&range=5d`, {
        headers: HEADERS,
        next: { revalidate: 30 },
      });
      if (!r.ok) throw new Error(String(r.status));
      const j = (await r.json()) as {
        chart?: { result?: { meta?: { regularMarketPrice?: number; chartPreviousClose?: number; previousClose?: number; regularMarketDayHigh?: number; regularMarketDayLow?: number; regularMarketOpen?: number } }[] };
      };
      const meta = j.chart?.result?.[0]?.meta;
      const price = meta?.regularMarketPrice;
      if (!meta || price == null || !(price > 0)) throw new Error("no price");
      const prev = meta.chartPreviousClose ?? meta.previousClose ?? price;
      const change = +(price - prev).toFixed(2);
      const changePct = prev ? +((change / prev) * 100).toFixed(2) : 0;
      return {
        symbol: symbol.toUpperCase(),
        name: entry.name,
        price,
        change,
        changePct,
        open: meta.regularMarketOpen ?? prev,
        high: meta.regularMarketDayHigh ?? price,
        low: meta.regularMarketDayLow ?? price,
        prevClose: prev,
        volume: 0,
        marketCap: entry.marketCap,
        currency: entry.currency ?? "TRY",
        sector: entry.sector,
      };
    } catch {
      const f = syntheticQuote(symbol);
      const prev = +(f.price / (1 + f.changePct / 100)).toFixed(2);
      return {
        symbol: symbol.toUpperCase(),
        name: entry.name,
        price: f.price,
        change: +(f.price - prev).toFixed(2),
        changePct: f.changePct,
        open: prev,
        high: +(f.price * 1.012).toFixed(2),
        low: +(prev * 0.988).toFixed(2),
        prevClose: prev,
        volume: 0,
        marketCap: entry.marketCap,
        currency: entry.currency ?? "TRY",
        sector: entry.sector,
      };
    }
  }

  async getQuotes(symbols: string[]): Promise<Quote[]> {
    return Promise.all(symbols.map((s) => this.getQuote(s)));
  }

  async getCandles(
    symbol: string,
    resolution: CandleResolution,
    _from: number,
    to: number,
  ): Promise<Candle[]> {
    const { interval, range } = resBucket(resolution);
    try {
      const r = await fetch(`${CHART}/${this.ysym(symbol)}?interval=${interval}&range=${range}`, {
        headers: HEADERS,
        next: { revalidate: 60 },
      });
      if (!r.ok) throw new Error(String(r.status));
      const j = (await r.json()) as {
        chart?: { result?: { timestamp?: number[]; indicators?: { quote?: { open?: number[]; high?: number[]; low?: number[]; close?: number[]; volume?: number[] }[] } }[] };
      };
      const res = j.chart?.result?.[0];
      const t = res?.timestamp;
      const q = res?.indicators?.quote?.[0];
      if (t && q?.close) {
        const out: Candle[] = [];
        for (let i = 0; i < t.length; i++) {
          const close = q.close[i];
          if (close == null) continue;
          out.push({
            time: t[i],
            open: q.open?.[i] ?? close,
            high: q.high?.[i] ?? close,
            low: q.low?.[i] ?? close,
            close,
            volume: q.volume?.[i] ?? 0,
          });
        }
        if (out.length) return out;
      }
    } catch {
      /* sentetik fallback */
    }
    return this.synthCandles(symbol, resolution, to);
  }

  private async synthCandles(symbol: string, resolution: CandleResolution, to: number): Promise<Candle[]> {
    let last = getUniverseEntry(symbol).basePrice;
    try {
      const q = await this.getQuote(symbol);
      if (q.price > 0) last = q.price;
    } catch {
      /* basePrice */
    }
    const step = resolution === "W" ? 604800 : resolution === "M" ? 2592000 : 86400;
    const n = 180;
    let seed = 0;
    for (const c of symbol) seed = (seed * 31 + c.charCodeAt(0)) % 9973;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };
    const closes: number[] = [last];
    for (let i = 1; i < n; i++) closes.push(closes[i - 1] / (1 + (rand() - 0.48) * 0.022));
    closes.reverse();
    const out: Candle[] = [];
    for (let i = 0; i < n; i++) {
      const close = +closes[i].toFixed(2);
      const open = i === 0 ? close : +closes[i - 1].toFixed(2);
      out.push({
        time: to - (n - 1 - i) * step,
        open,
        high: +(Math.max(open, close) * (1 + rand() * 0.012)).toFixed(2),
        low: +(Math.min(open, close) * (1 - rand() * 0.012)).toFixed(2),
        close,
        volume: Math.floor(1e6 + rand() * 9e6),
      });
    }
    return out;
  }

  async getProfile(symbol: string): Promise<CompanyProfile> {
    const e = getUniverseEntry(symbol);
    return {
      symbol: symbol.toUpperCase(),
      name: e.name,
      description: `${e.name}, Borsa İstanbul'da işlem gören bir ${e.sector} şirketidir.`,
      sector: e.sector,
      industry: e.sector,
      country: "TR",
      exchange: "BIST",
      marketCap: e.marketCap,
      shareOutstanding: 0,
    };
  }

  async getNews(): Promise<NewsItem[]> {
    return [];
  }

  async search(query: string): Promise<SearchResult[]> {
    const q = query.toLowerCase();
    return UNIVERSE.filter(
      (u) => u.type === "bist" && (u.symbol.toLowerCase().includes(q) || u.name.toLowerCase().includes(q)),
    ).map((u) => ({ symbol: u.symbol, name: u.name, type: "bist", exchange: "BIST" }));
  }
}
