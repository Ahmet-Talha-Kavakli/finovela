// Finnhub gerçek-veri sağlayıcısı. Key gelince MARKET_PROVIDER=finnhub.
// Ücretsiz tier: quote, candle (stock), profile2, company-news, search.
// Mock ile birebir aynı arayüz → frontend hiç değişmez.

import type {
  Candle,
  CandleResolution,
  CompanyProfile,
  EarningsEvent,
  MarketProvider,
  NewsItem,
  Quote,
  SearchResult,
} from "./types";
import { getUniverseEntry } from "./universe";
import { fetchYahooCandles } from "./yahoo-candles";

const BASE = "https://finnhub.io/api/v1";

// Finnhub kripto'yu çıplak sembolle (BTC) DESTEKLEMEZ — borsa-önekli sembol ister.
// Ücretsiz tier crypto quote'u da güvenilmez döndürebilir; o yüzden hem doğru
// sembolü deneriz hem de geçersiz/0 dönerse universe basePrice'a düşeriz.
const CRYPTO_SYMBOL: Record<string, string> = {
  BTC: "BINANCE:BTCUSDT",
  ETH: "BINANCE:ETHUSDT",
  SOL: "BINANCE:SOLUSDT",
};

function isCrypto(symbol: string): boolean {
  return symbol.toUpperCase() in CRYPTO_SYMBOL;
}

/**
 * Bir kripto için gerçekçi, deterministik fiyat — universe basePrice etrafında
 * sembolden türeyen sabit günlük sapma. Canlı quote başarısız olursa kullanılır,
 * böylece BTC asla $0 / $26 görünmez.
 */
function syntheticCryptoQuote(symbol: string): { price: number; changePct: number } {
  const base = getUniverseEntry(symbol).basePrice;
  let h = 0;
  for (const c of symbol.toUpperCase()) h = (h * 31 + c.charCodeAt(0)) % 1000;
  const changePct = +(((h % 90) - 35) / 10).toFixed(2); // -3.5 .. +5.4
  const price = +(base * (1 + changePct / 100)).toFixed(2);
  return { price, changePct };
}

async function fh<T>(path: string): Promise<T> {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) throw new Error("FINNHUB_API_KEY missing");
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`${BASE}${path}${sep}token=${key}`, {
    next: { revalidate: 15 },
  });
  if (!res.ok) throw new Error(`Finnhub ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

export class FinnhubProvider implements MarketProvider {
  name = "finnhub";

  async getQuote(symbol: string): Promise<Quote> {
    const upper = symbol.toUpperCase();
    const entry = getUniverseEntry(symbol);

    // --- KRİPTO: borsa-önekli sembol dene, geçersizse deterministik fallback ---
    if (isCrypto(upper)) {
      try {
        const q = await fh<{ c: number; d: number; dp: number; h: number; l: number; o: number; pc: number }>(
          `/quote?symbol=${encodeURIComponent(CRYPTO_SYMBOL[upper])}`,
        );
        // Finnhub free tier 0/null döndürebilir → gerçekçi değilse fallback
        if (q && q.c > 0) {
          return {
            symbol: upper,
            name: entry.name,
            price: q.c,
            change: q.d ?? 0,
            changePct: q.dp ?? 0,
            open: q.o || q.c,
            high: q.h || q.c,
            low: q.l || q.c,
            prevClose: q.pc || q.c,
            volume: 0,
            marketCap: entry.marketCap,
            currency: "USD",
            sector: "Crypto",
          };
        }
      } catch {
        /* fallback'e düş */
      }
      const f = syntheticCryptoQuote(upper);
      const prev = +(f.price / (1 + f.changePct / 100)).toFixed(2);
      return {
        symbol: upper,
        name: entry.name,
        price: f.price,
        change: +(f.price - prev).toFixed(2),
        changePct: f.changePct,
        open: prev,
        high: +(f.price * 1.015).toFixed(2),
        low: +(prev * 0.985).toFixed(2),
        prevClose: prev,
        volume: 0,
        marketCap: entry.marketCap,
        currency: "USD",
        sector: "Crypto",
      };
    }

    // --- HİSSE / ETF ---
    const [q, p] = await Promise.all([
      fh<{ c: number; d: number; dp: number; h: number; l: number; o: number; pc: number }>(
        `/quote?symbol=${symbol}`,
      ),
      this.getProfile(symbol).catch(() => null),
    ]);
    // hisse quote'u da boş gelirse universe basePrice'a düş (asla $0 gösterme)
    if (!q || !(q.c > 0)) {
      const base = entry.basePrice;
      return {
        symbol: upper,
        name: p?.name ?? entry.name,
        price: base,
        change: 0,
        changePct: 0,
        open: base,
        high: base,
        low: base,
        prevClose: base,
        volume: 0,
        marketCap: p?.marketCap ?? entry.marketCap,
        currency: "USD",
        logo: p?.logo,
        sector: p?.sector ?? entry.sector,
      };
    }
    return {
      symbol: upper,
      name: p?.name ?? entry.name,
      price: q.c,
      change: q.d,
      changePct: q.dp,
      open: q.o,
      high: q.h,
      low: q.l,
      prevClose: q.pc,
      volume: 0,
      marketCap: p?.marketCap,
      currency: "USD",
      logo: p?.logo,
      sector: p?.sector ?? entry.sector,
    };
  }

  async getQuotes(symbols: string[]): Promise<Quote[]> {
    return Promise.all(symbols.map((s) => this.getQuote(s)));
  }

  async getCandles(
    symbol: string,
    resolution: CandleResolution,
    from: number,
    to: number,
  ): Promise<Candle[]> {
    // 1) GERÇEK mumlar — Yahoo Finance (anahtarsız, hisse + ETF + kripto).
    //    Finnhub ücretsiz tier /stock/candle'ı 403 ile engellediği için birincil kaynak Yahoo.
    const yahoo = await fetchYahooCandles(symbol, resolution, from, to);
    if (yahoo && yahoo.length) return yahoo;

    // 2) Finnhub candle (ücretli tier'da açıksa) — yedek gerçek kaynak.
    try {
      const data = await fh<{
        s: string;
        t: number[];
        o: number[];
        h: number[];
        l: number[];
        c: number[];
        v: number[];
      }>(`/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}`);
      if (data.s === "ok" && data.t?.length) {
        return data.t.map((t, i) => ({
          time: t,
          open: data.o[i],
          high: data.h[i],
          low: data.l[i],
          close: data.c[i],
          volume: data.v[i],
        }));
      }
    } catch {
      // her iki gerçek kaynak da başarısız → son çare sentetik
    }

    // 3) Son çare: hiçbir gerçek kaynak ulaşılamadı → canlı fiyatı çapa alıp sentezle.
    return this.synthCandles(symbol, resolution, from, to);
  }

  /** Son çare — gerçek kaynak yokken canlı quote'u çapa alıp deterministik seri üret. */
  private async synthCandles(
    symbol: string,
    resolution: CandleResolution,
    from: number,
    to: number,
  ): Promise<Candle[]> {
    let last = getUniverseEntry(symbol).basePrice;
    try {
      const q = await this.getQuote(symbol);
      if (q.price > 0) last = q.price;
    } catch {
      /* universe basePrice ile devam */
    }
    const step = resolution === "D" ? 86400 : resolution === "W" ? 604800 : 3600;
    const n = Math.min(260, Math.max(30, Math.floor((to - from) / step)));
    // sembolden deterministik seed
    let seed = 0;
    for (const c of symbol) seed = (seed * 31 + c.charCodeAt(0)) % 9973;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };
    // sondan başa doğru rastgele yürüyüşle geriye git, sonra ters çevir
    const closes: number[] = [last];
    for (let i = 1; i < n; i++) {
      const drift = (rand() - 0.48) * 0.022;
      closes.push(closes[i - 1] / (1 + drift));
    }
    closes.reverse();
    const out: Candle[] = [];
    for (let i = 0; i < n; i++) {
      const close = +closes[i].toFixed(2);
      const open = i === 0 ? close : +closes[i - 1].toFixed(2);
      const hi = +(Math.max(open, close) * (1 + rand() * 0.012)).toFixed(2);
      const lo = +(Math.min(open, close) * (1 - rand() * 0.012)).toFixed(2);
      out.push({
        time: to - (n - 1 - i) * step,
        open,
        high: hi,
        low: lo,
        close,
        volume: Math.floor(1e6 + rand() * 9e6),
      });
    }
    return out;
  }

  async getProfile(symbol: string): Promise<CompanyProfile> {
    const p = await fh<{
      name: string;
      finnhubIndustry: string;
      country: string;
      exchange: string;
      ipo: string;
      marketCapitalization: number;
      shareOutstanding: number;
      logo: string;
      weburl: string;
    }>(`/stock/profile2?symbol=${symbol}`);
    const entry = getUniverseEntry(symbol);
    return {
      symbol: symbol.toUpperCase(),
      name: p.name ?? entry.name,
      description: `${p.name} operates in ${p.finnhubIndustry}.`,
      sector: p.finnhubIndustry ?? entry.sector,
      industry: p.finnhubIndustry ?? entry.sector,
      country: p.country ?? "US",
      exchange: p.exchange ?? "NASDAQ",
      ipo: p.ipo,
      marketCap: (p.marketCapitalization ?? 0) * 1e6,
      shareOutstanding: (p.shareOutstanding ?? 0) * 1e6,
      logo: p.logo,
      weburl: p.weburl,
    };
  }

  async getNews(symbol?: string): Promise<NewsItem[]> {
    if (!symbol) {
      const data = await fh<
        { id: number; headline: string; summary: string; source: string; url: string; datetime: number; image: string; related: string }[]
      >(`/news?category=general`);
      return data.slice(0, 30).map((n) => ({
        id: String(n.id),
        headline: n.headline,
        summary: n.summary,
        source: n.source,
        url: n.url,
        datetime: n.datetime,
        image: n.image,
        related: n.related,
      }));
    }
    const today = new Date().toISOString().slice(0, 10);
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    const data = await fh<
      { id: number; headline: string; summary: string; source: string; url: string; datetime: number; image: string; related: string }[]
    >(`/company-news?symbol=${symbol}&from=${weekAgo}&to=${today}`);
    return data.slice(0, 20).map((n) => ({
      id: String(n.id),
      headline: n.headline,
      summary: n.summary,
      source: n.source,
      url: n.url,
      datetime: n.datetime,
      image: n.image,
      related: n.related,
    }));
  }

  async search(query: string): Promise<SearchResult[]> {
    const data = await fh<{ result: { symbol: string; description: string; type: string }[] }>(
      `/search?q=${encodeURIComponent(query)}`,
    );
    return (data.result ?? []).slice(0, 15).map((r) => ({
      symbol: r.symbol,
      name: r.description,
      type: r.type,
    }));
  }

  /** GERÇEK bilanço takvimi — Finnhub /calendar/earnings (tarih aralığı). */
  async getEarnings(from: string, to: string): Promise<EarningsEvent[]> {
    const data = await fh<{
      earningsCalendar?: {
        symbol: string;
        date: string;
        hour?: string;
        epsEstimate?: number | null;
        epsActual?: number | null;
        revenueEstimate?: number | null;
        revenueActual?: number | null;
        quarter?: number;
        year?: number;
      }[];
    }>(`/calendar/earnings?from=${from}&to=${to}`);
    return (data.earningsCalendar ?? []).map((e) => ({
      symbol: e.symbol,
      date: e.date,
      hour: e.hour,
      epsEstimate: e.epsEstimate ?? null,
      epsActual: e.epsActual ?? null,
      revenueEstimate: e.revenueEstimate ?? null,
      revenueActual: e.revenueActual ?? null,
      quarter: e.quarter,
      year: e.year,
    }));
  }
}
