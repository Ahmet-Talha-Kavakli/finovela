// CoinGecko gerçek spot-kripto sağlayıcısı — anahtarsız ücretsiz tier.
// Yalnızca kripto sembollerini (BTC/ETH/SOL/XRP/ADA/DOGE/AVAX) çözer.
// Composite router kripto isteklerini buraya yönlendirir; başarısızlıkta
// universe basePrice'a çapalı deterministik sentetik veri döner (asla $0).

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

const BASE = "https://api.coingecko.com/api/v3";

// App sembol → CoinGecko id. universe.providerSymbol birincil kaynak;
// bilinmiyorsa isim lowercase fallback.
function coinId(symbol: string): string {
  const entry = getUniverseEntry(symbol);
  return entry.providerSymbol ?? entry.name.toLowerCase();
}

// CoinGecko simple/price yanıtı: { "<id>": { usd, usd_24h_change, usd_24h_vol } }
type SimplePrice = Record<
  string,
  { usd?: number; usd_24h_change?: number; usd_24h_vol?: number }
>;

async function cg<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { next: { revalidate: 30 } });
  if (!res.ok) throw new Error(`CoinGecko ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

/**
 * Bir kripto için gerçekçi, deterministik fiyat — universe basePrice etrafında
 * sembolden türeyen sabit günlük sapma. Canlı veri başarısız olursa kullanılır,
 * böylece BTC asla $0 görünmez (finnhub-provider ile aynı desen).
 */
function syntheticQuote(symbol: string): { price: number; changePct: number } {
  const base = getUniverseEntry(symbol).basePrice;
  let h = 0;
  for (const c of symbol.toUpperCase()) h = (h * 31 + c.charCodeAt(0)) % 1000;
  const changePct = +(((h % 90) - 35) / 10).toFixed(2); // -3.5 .. +5.4
  const price = +(base * (1 + changePct / 100)).toFixed(2);
  return { price, changePct };
}

// Canlı usd/değişim/hacim → tam Quote (OHLC simple/price'ta yok, türetilir).
function buildQuote(
  symbol: string,
  usd: number,
  changePct: number,
  volume: number,
): Quote {
  const entry = getUniverseEntry(symbol);
  const price = +usd.toFixed(usd < 1 ? 6 : 2);
  const prevClose = +(price / (1 + changePct / 100)).toFixed(price < 1 ? 6 : 2);
  const change = +(price - prevClose).toFixed(price < 1 ? 6 : 2);
  return {
    symbol: entry.symbol,
    name: entry.name,
    price,
    change,
    changePct: +changePct.toFixed(2),
    open: prevClose,
    high: +(Math.max(price, prevClose) * 1.01).toFixed(price < 1 ? 6 : 2),
    low: +(Math.min(price, prevClose) * 0.99).toFixed(price < 1 ? 6 : 2),
    prevClose,
    volume: Math.round(volume),
    marketCap: entry.marketCap,
    currency: "USD",
    sector: "Crypto",
  };
}

// Canlı veri yoksa basePrice çapalı sentetik Quote.
function fallbackQuote(symbol: string): Quote {
  const f = syntheticQuote(symbol);
  const entry = getUniverseEntry(symbol);
  const prev = +(f.price / (1 + f.changePct / 100)).toFixed(f.price < 1 ? 6 : 2);
  return {
    symbol: entry.symbol,
    name: entry.name,
    price: f.price,
    change: +(f.price - prev).toFixed(f.price < 1 ? 6 : 2),
    changePct: f.changePct,
    open: prev,
    high: +(f.price * 1.015).toFixed(f.price < 1 ? 6 : 2),
    low: +(prev * 0.985).toFixed(f.price < 1 ? 6 : 2),
    prevClose: prev,
    volume: 0,
    marketCap: entry.marketCap,
    currency: "USD",
    sector: "Crypto",
  };
}

export class CoinGeckoProvider implements Partial<MarketProvider> {
  name = "coingecko";

  async getQuote(symbol: string): Promise<Quote> {
    const id = coinId(symbol);
    try {
      const data = await cg<SimplePrice>(
        `/simple/price?ids=${encodeURIComponent(
          id,
        )}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`,
      );
      const row = data[id];
      if (row && typeof row.usd === "number" && row.usd > 0) {
        return buildQuote(
          symbol,
          row.usd,
          row.usd_24h_change ?? 0,
          row.usd_24h_vol ?? 0,
        );
      }
    } catch {
      /* fallback'e düş */
    }
    return fallbackQuote(symbol);
  }

  async getQuotes(symbols: string[]): Promise<Quote[]> {
    if (!symbols.length) return [];
    // BATCH: tüm id'leri tek çağrıda topla (rate-limit dostu).
    const idBySymbol = new Map(symbols.map((s) => [s, coinId(s)]));
    const ids = Array.from(new Set(idBySymbol.values()));
    try {
      const data = await cg<SimplePrice>(
        `/simple/price?ids=${encodeURIComponent(
          ids.join(","),
        )}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`,
      );
      return symbols.map((s) => {
        const row = data[idBySymbol.get(s)!];
        if (row && typeof row.usd === "number" && row.usd > 0) {
          return buildQuote(s, row.usd, row.usd_24h_change ?? 0, row.usd_24h_vol ?? 0);
        }
        return fallbackQuote(s);
      });
    } catch {
      // toplu çağrı patlarsa her sembol için sentetik'e düş.
      return symbols.map((s) => fallbackQuote(s));
    }
  }

  async getCandles(
    symbol: string,
    resolution: CandleResolution,
    from: number,
    to: number,
  ): Promise<Candle[]> {
    const id = coinId(symbol);
    // from/to (unix saniye) aralığından gün sayısı türet → 30/90/365.
    const spanDays = Math.max(1, Math.ceil((to - from) / 86400));
    const days = spanDays <= 30 ? 30 : spanDays <= 90 ? 90 : 365;
    try {
      const data = await cg<{
        prices: [number, number][];
        total_volumes?: [number, number][];
      }>(`/coins/${encodeURIComponent(id)}/market_chart?vs_currency=usd&days=${days}`);
      if (data.prices?.length) {
        const vols = data.total_volumes ?? [];
        return data.prices.map(([ms, price], i) => {
          const prev = i === 0 ? price : data.prices[i - 1][1];
          const close = +price.toFixed(price < 1 ? 6 : 2);
          const open = +prev.toFixed(prev < 1 ? 6 : 2);
          const hi = +(Math.max(open, close) * 1.004).toFixed(price < 1 ? 6 : 2);
          const lo = +(Math.min(open, close) * 0.996).toFixed(price < 1 ? 6 : 2);
          return {
            time: Math.floor(ms / 1000),
            open,
            high: hi,
            low: lo,
            close,
            volume: Math.round(vols[i]?.[1] ?? 0),
          };
        });
      }
    } catch {
      /* canlı seri başarısız → sentezle */
    }
    return this.synthCandles(symbol, resolution, from, to);
  }

  /** Canlı seri yoksa basePrice çapalı deterministik rastgele yürüyüş. */
  private synthCandles(
    symbol: string,
    resolution: CandleResolution,
    from: number,
    to: number,
  ): Candle[] {
    const last = getUniverseEntry(symbol).basePrice;
    const step =
      resolution === "D" ? 86400 : resolution === "W" ? 604800 : 3600;
    const n = Math.min(260, Math.max(30, Math.floor((to - from) / step)));
    let seed = 0;
    for (const c of symbol) seed = (seed * 31 + c.charCodeAt(0)) % 9973;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };
    const dp = last < 1 ? 6 : 2;
    const closes: number[] = [last];
    for (let i = 1; i < n; i++) {
      const drift = (rand() - 0.48) * 0.03;
      closes.push(closes[i - 1] / (1 + drift));
    }
    closes.reverse();
    const out: Candle[] = [];
    for (let i = 0; i < n; i++) {
      const close = +closes[i].toFixed(dp);
      const open = i === 0 ? close : +closes[i - 1].toFixed(dp);
      const hi = +(Math.max(open, close) * (1 + rand() * 0.015)).toFixed(dp);
      const lo = +(Math.min(open, close) * (1 - rand() * 0.015)).toFixed(dp);
      out.push({
        time: to - (n - 1 - i) * step,
        open,
        high: hi,
        low: lo,
        close,
        volume: Math.floor(1e7 + rand() * 9e8),
      });
    }
    return out;
  }

  async getProfile(symbol: string): Promise<CompanyProfile> {
    const entry = getUniverseEntry(symbol);
    return {
      symbol: entry.symbol,
      name: entry.name,
      description: `${entry.name} is a cryptocurrency.`,
      sector: "Crypto",
      industry: "Cryptocurrency",
      country: "Global",
      exchange: "Crypto",
      marketCap: entry.marketCap,
      shareOutstanding: 0,
    };
  }

  async getNews(): Promise<NewsItem[]> {
    // Kripto haberleri başka yerde ele alınır.
    return [];
  }

  async search(query: string): Promise<SearchResult[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return UNIVERSE.filter((e) => e.type === "crypto")
      .filter(
        (e) =>
          e.symbol.toLowerCase().includes(q) ||
          e.name.toLowerCase().includes(q),
      )
      .slice(0, 15)
      .map((e) => ({
        symbol: e.symbol,
        name: e.name,
        type: "crypto",
        exchange: "Crypto",
      }));
  }
}
