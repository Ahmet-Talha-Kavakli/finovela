// Twelve Data gerçek-veri sağlayıcısı — FOREX, METAL ve EMTİA için.
// Ücretsiz tier: 8 kredi/dk, 800/gün → /quote toplu (virgülle) çağrılır ve
// fetch revalidate ile cache'lenir. Key yoksa veya çağrı patlarsa universe
// basePrice'a çapalanan sentetik veriye düşülür (asla 0 dönmez).
// Mock & finnhub ile birebir aynı arayüz → frontend hiç değişmez.

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

const BASE = "https://api.twelvedata.com";

// Bir ons (troy ounce) altında kaç gram var — gram altın hesabı için.
const GRAMS_PER_TROY_OUNCE = 31.1035;

// App resolution → Twelve Data interval.
const INTERVAL_MAP: Record<CandleResolution, string> = {
  "1": "1min",
  "5": "5min",
  "15": "15min",
  "30": "30min",
  "60": "1h",
  D: "1day",
  W: "1week",
  M: "1month",
};

// Twelve Data /quote tek sembol için düz obje, çok sembol için sembol-anahtarlı
// obje döner. Her iki şekli de aynı tipte ele alırız.
interface TDQuote {
  symbol?: string;
  name?: string;
  open?: string;
  high?: string;
  low?: string;
  close?: string;
  previous_close?: string;
  change?: string;
  percent_change?: string;
  volume?: string;
  code?: number; // hata durumunda
  status?: string;
}

function num(v: string | undefined): number {
  if (v === undefined || v === null) return 0;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Sembolden türeyen deterministik günlük sapma (-3.5 .. +5.4) — canlı veri
 * gelmezse fiyat asla 0 görünmesin diye basePrice etrafında oynatılır.
 * Module top-level'da Date.now()/Math.random() YOK; her şey sembolden türer.
 */
function deterministicPct(symbol: string): number {
  let h = 0;
  for (const c of symbol.toUpperCase()) h = (h * 31 + c.charCodeAt(0)) % 1000;
  return +(((h % 90) - 35) / 10).toFixed(2);
}

export class TwelveDataProvider implements MarketProvider {
  name = "twelvedata";

  private key(): string | undefined {
    return process.env.TWELVEDATA_API_KEY || undefined;
  }

  private async td<T>(path: string): Promise<T> {
    const key = this.key();
    if (!key) throw new Error("TWELVEDATA_API_KEY missing");
    const sep = path.includes("?") ? "&" : "?";
    const res = await fetch(`${BASE}${path}${sep}apikey=${key}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error(`TwelveData ${res.status}: ${path}`);
    return res.json() as Promise<T>;
  }

  /** Universe basePrice'a çapalanan sentetik Quote — canlı veri yoksa. */
  private synthQuote(symbol: string, priceOverride?: number, currencyOverride?: string): Quote {
    const upper = symbol.toUpperCase();
    const entry = getUniverseEntry(symbol);
    const pct = deterministicPct(upper);
    const price = +((priceOverride ?? entry.basePrice) * (priceOverride ? 1 : 1 + pct / 100)).toFixed(4);
    const prev = +(price / (1 + pct / 100)).toFixed(4);
    return {
      symbol: upper,
      name: entry.name,
      price,
      change: +(price - prev).toFixed(4),
      changePct: pct,
      open: prev,
      high: +(price * 1.005).toFixed(4),
      low: +(prev * 0.995).toFixed(4),
      prevClose: prev,
      volume: 0,
      marketCap: entry.marketCap,
      currency: currencyOverride ?? entry.currency ?? "USD",
      sector: entry.sector,
    };
  }

  /** TDQuote + universe entry → uygulama Quote'u. Geçersizse synth'e düş. */
  private buildQuote(symbol: string, q: TDQuote | undefined): Quote {
    const upper = symbol.toUpperCase();
    const entry = getUniverseEntry(symbol);
    const close = num(q?.close);
    if (!q || q.code || !(close > 0)) {
      return this.synthQuote(symbol);
    }
    const prevClose = num(q.previous_close) || close;
    return {
      symbol: upper,
      name: entry.name,
      price: close,
      change: num(q.change),
      changePct: num(q.percent_change),
      open: num(q.open) || close,
      high: num(q.high) || close,
      low: num(q.low) || close,
      prevClose,
      volume: num(q.volume),
      marketCap: entry.marketCap,
      currency: entry.currency ?? "USD",
      sector: entry.sector,
    };
  }

  /**
   * Çok sembollü /quote çağrısı. Tek sembolde düz obje, çoklu sembolde
   * sembol-anahtarlı obje döner → her zaman Record olarak normalize eder.
   */
  private async fetchQuotes(providerSymbols: string[]): Promise<Record<string, TDQuote>> {
    const unique = Array.from(new Set(providerSymbols));
    const joined = unique.map((s) => encodeURIComponent(s)).join(",");
    const data = await this.td<TDQuote | Record<string, TDQuote>>(`/quote?symbol=${joined}`);
    if (unique.length === 1) {
      return { [unique[0]]: data as TDQuote };
    }
    return data as Record<string, TDQuote>;
  }

  // --- Gram altın hesabı: (XAU/USD ons fiyatı / 31.1035) * USD/TRY ---
  private gramFromOunce(xauUsd: number, usdTry: number): number {
    return (xauUsd / GRAMS_PER_TROY_OUNCE) * usdTry;
  }

  private buildGramAltinQuote(xau: TDQuote | undefined, usdtry: TDQuote | undefined): Quote {
    const entry = getUniverseEntry("GRAMALTIN");
    const xauUsd = num(xau?.close);
    const usdTry = num(usdtry?.close);
    if (!(xauUsd > 0) || !(usdTry > 0)) {
      return this.synthQuote("GRAMALTIN");
    }
    const gramTRY = +this.gramFromOunce(xauUsd, usdTry).toFixed(2);
    // Değişim yaklaşımı: altın yüzde değişimi + dolar/TL yüzde değişimi.
    const changePct = +(num(xau?.percent_change) + num(usdtry?.percent_change)).toFixed(2);
    const prev = +(gramTRY / (1 + changePct / 100)).toFixed(2);
    return {
      symbol: "GRAMALTIN",
      name: "Gram Altın",
      price: gramTRY,
      change: +(gramTRY - prev).toFixed(2),
      changePct,
      open: prev,
      high: +(gramTRY * 1.005).toFixed(2),
      low: +(prev * 0.995).toFixed(2),
      prevClose: prev,
      volume: 0,
      marketCap: entry.marketCap,
      currency: "TRY",
      sector: entry.sector,
    };
  }

  async getQuote(symbol: string): Promise<Quote> {
    const upper = symbol.toUpperCase();

    // --- ÖZEL DURUM: GRAM ALTIN (XAU/USD + USD/TRY tek çağrıda) ---
    if (upper === "GRAMALTIN") {
      try {
        const map = await this.fetchQuotes(["XAU/USD", "USD/TRY"]);
        return this.buildGramAltinQuote(map["XAU/USD"], map["USD/TRY"]);
      } catch {
        return this.synthQuote("GRAMALTIN");
      }
    }

    const provider = getUniverseEntry(symbol).providerSymbol ?? upper;
    try {
      const map = await this.fetchQuotes([provider]);
      return this.buildQuote(symbol, map[provider]);
    } catch {
      return this.synthQuote(symbol);
    }
  }

  async getQuotes(symbols: string[]): Promise<Quote[]> {
    const wantsGram = symbols.some((s) => s.toUpperCase() === "GRAMALTIN");

    // Tek toplu çağrı için tüm provider sembollerini topla.
    const providerSymbols: string[] = [];
    for (const s of symbols) {
      const upper = s.toUpperCase();
      if (upper === "GRAMALTIN") continue; // ayrı (computed)
      providerSymbols.push(getUniverseEntry(s).providerSymbol ?? upper);
    }
    if (wantsGram) {
      providerSymbols.push("XAU/USD", "USD/TRY");
    }

    let map: Record<string, TDQuote> = {};
    if (providerSymbols.length > 0) {
      try {
        map = await this.fetchQuotes(providerSymbols);
      } catch {
        map = {};
      }
    }

    return symbols.map((s) => {
      const upper = s.toUpperCase();
      if (upper === "GRAMALTIN") {
        try {
          return this.buildGramAltinQuote(map["XAU/USD"], map["USD/TRY"]);
        } catch {
          return this.synthQuote("GRAMALTIN");
        }
      }
      const provider = getUniverseEntry(s).providerSymbol ?? upper;
      return this.buildQuote(s, map[provider]);
    });
  }

  async getCandles(
    symbol: string,
    resolution: CandleResolution,
    from: number,
    to: number,
  ): Promise<Candle[]> {
    const upper = symbol.toUpperCase();
    const interval = INTERVAL_MAP[resolution] ?? "1day";

    // --- GRAM ALTIN: XAU/USD serisi * güncel (ons→gram TRY) faktörü ---
    if (upper === "GRAMALTIN") {
      try {
        const [series, usdtryMap] = await Promise.all([
          this.td<{ values?: TDSeriesValue[]; status?: string }>(
            `/time_series?symbol=${encodeURIComponent("XAU/USD")}&interval=${interval}&outputsize=120`,
          ),
          this.fetchQuotes(["USD/TRY"]),
        ]);
        const usdTry = num(usdtryMap["USD/TRY"]?.close);
        const values = series.values;
        if (usdTry > 0 && values?.length) {
          // newest-first → oldest-first için ters çevir.
          const factor = usdTry / GRAMS_PER_TROY_OUNCE;
          return [...values].reverse().map((v) => ({
            time: Math.floor(new Date(v.datetime).getTime() / 1000),
            open: +(num(v.open) * factor).toFixed(2),
            high: +(num(v.high) * factor).toFixed(2),
            low: +(num(v.low) * factor).toFixed(2),
            close: +(num(v.close) * factor).toFixed(2),
            volume: num(v.volume),
          }));
        }
      } catch {
        /* sentetiğe düş */
      }
      return this.synthCandles("GRAMALTIN", resolution, from, to);
    }

    const provider = getUniverseEntry(symbol).providerSymbol ?? upper;
    try {
      const data = await this.td<{ values?: TDSeriesValue[]; status?: string }>(
        `/time_series?symbol=${encodeURIComponent(provider)}&interval=${interval}&outputsize=120`,
      );
      const values = data.values;
      if (values?.length) {
        // newest-first → oldest-first.
        return [...values].reverse().map((v) => ({
          time: Math.floor(new Date(v.datetime).getTime() / 1000),
          open: num(v.open),
          high: num(v.high),
          low: num(v.low),
          close: num(v.close),
          volume: num(v.volume),
        }));
      }
    } catch {
      /* sentetiğe düş */
    }
    return this.synthCandles(symbol, resolution, from, to);
  }

  /** Canlı seri yoksa → canlı quote'u çapa alıp deterministik seri üret. */
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
    const step = resolution === "D" ? 86400 : resolution === "W" ? 604800 : resolution === "M" ? 2592000 : 3600;
    const n = Math.min(260, Math.max(30, Math.floor((to - from) / step) || 120));
    let seed = 0;
    for (const c of symbol) seed = (seed * 31 + c.charCodeAt(0)) % 9973;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };
    const closes: number[] = [last];
    for (let i = 1; i < n; i++) {
      const drift = (rand() - 0.48) * 0.018;
      closes.push(closes[i - 1] / (1 + drift));
    }
    closes.reverse();
    const out: Candle[] = [];
    for (let i = 0; i < n; i++) {
      const close = +closes[i].toFixed(4);
      const open = i === 0 ? close : +closes[i - 1].toFixed(4);
      const hi = +(Math.max(open, close) * (1 + rand() * 0.01)).toFixed(4);
      const lo = +(Math.min(open, close) * (1 - rand() * 0.01)).toFixed(4);
      out.push({
        time: to - (n - 1 - i) * step,
        open,
        high: hi,
        low: lo,
        close,
        volume: Math.floor(rand() * 1e6),
      });
    }
    return out;
  }

  async getProfile(symbol: string): Promise<CompanyProfile> {
    // Ağ yok — universe'den minimal profil.
    const entry = getUniverseEntry(symbol);
    return {
      symbol: entry.symbol,
      name: entry.name,
      description: `${entry.name} — ${entry.sector}.`,
      sector: entry.sector,
      industry: entry.sector,
      country: entry.currency === "TRY" ? "TR" : "US",
      exchange: "FOREX",
      marketCap: entry.marketCap,
      shareOutstanding: 0,
    };
  }

  async getNews(): Promise<NewsItem[]> {
    return [];
  }

  async search(query: string): Promise<SearchResult[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return UNIVERSE.filter(
      (e) =>
        (e.type === "forex" || e.type === "metal" || e.type === "commodity") &&
        (e.symbol.toLowerCase().includes(q) || e.name.toLowerCase().includes(q)),
    )
      .slice(0, 15)
      .map((e) => ({
        symbol: e.symbol,
        name: e.name,
        type: e.type,
        exchange: "FOREX",
      }));
  }
}

interface TDSeriesValue {
  datetime: string;
  open?: string;
  high?: string;
  low?: string;
  close?: string;
  volume?: string;
}
