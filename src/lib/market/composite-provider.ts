// Bileşik sağlayıcı — sembolün varlık tipine göre doğru kaynağa yönlendirir.
//   ABD hisse/ETF → Finnhub
//   gerçek spot kripto → CoinGecko
//   forex / metal / emtia / gram altın → Twelve Data
//   BIST → Yahoo Finance
// Frontend tek bir MarketProvider görür; çok-varlık geçişi şeffaftır.

import type {
  Candle,
  CandleResolution,
  CompanyProfile,
  MarketProvider,
  NewsItem,
  Quote,
  SearchResult,
} from "./types";
import { getUniverseEntry, UNIVERSE, type AssetType } from "./universe";
import { FinnhubProvider } from "./finnhub-provider";
import { MockProvider } from "./mock-provider";
import { CoinGeckoProvider } from "./coingecko-provider";
import { TwelveDataProvider } from "./twelvedata-provider";
import { YahooProvider } from "./yahoo-provider";

export class CompositeProvider implements MarketProvider {
  name = "composite";

  private usStocks: MarketProvider;
  private crypto = new CoinGeckoProvider();
  private fx = new TwelveDataProvider();
  private bist = new YahooProvider();

  constructor() {
    // ABD hisseleri: env finnhub ise gerçek, değilse mock.
    const useFinnhub =
      (process.env.MARKET_PROVIDER ?? "mock").toLowerCase() === "finnhub" &&
      !!process.env.FINNHUB_API_KEY;
    this.usStocks = useFinnhub ? new FinnhubProvider() : new MockProvider();
  }

  /** Sembolün tipine göre uygun alt-sağlayıcı. */
  private routeFor(symbol: string): MarketProvider {
    const type: AssetType = getUniverseEntry(symbol).type;
    switch (type) {
      case "crypto":
        return this.crypto as MarketProvider;
      case "forex":
      case "metal":
      case "commodity":
        return this.fx;
      case "bist":
        return this.bist;
      case "stock":
      case "etf":
      default:
        return this.usStocks;
    }
  }

  async getQuote(symbol: string): Promise<Quote> {
    return this.routeFor(symbol).getQuote(symbol);
  }

  /** Çoklu sembolü tipe göre grupla, her grubu kendi sağlayıcısında BATCH çek. */
  async getQuotes(symbols: string[]): Promise<Quote[]> {
    const groups = new Map<MarketProvider, string[]>();
    for (const s of symbols) {
      const p = this.routeFor(s);
      const arr = groups.get(p) ?? [];
      arr.push(s);
      groups.set(p, arr);
    }
    const results = await Promise.all(
      [...groups.entries()].map(([p, syms]) => p.getQuotes(syms)),
    );
    // orijinal sıra korunsun
    const bySymbol = new Map<string, Quote>();
    for (const list of results) for (const q of list) bySymbol.set(q.symbol.toUpperCase(), q);
    return symbols
      .map((s) => bySymbol.get(s.toUpperCase()))
      .filter((q): q is Quote => q != null);
  }

  async getCandles(
    symbol: string,
    resolution: CandleResolution,
    from: number,
    to: number,
  ): Promise<Candle[]> {
    return this.routeFor(symbol).getCandles(symbol, resolution, from, to);
  }

  async getProfile(symbol: string): Promise<CompanyProfile> {
    return this.routeFor(symbol).getProfile(symbol);
  }

  async getNews(symbol?: string): Promise<NewsItem[]> {
    // Haber yalnızca ABD hisse sağlayıcısından (Finnhub) anlamlı.
    if (symbol) {
      const t = getUniverseEntry(symbol).type;
      if (t !== "stock" && t !== "etf") return [];
    }
    return this.usStocks.getNews(symbol);
  }

  /** Bilanço takvimi — yalnızca ABD hisse sağlayıcısı destekler (Finnhub). */
  async getEarnings(from: string, to: string) {
    const p = this.usStocks as MarketProvider;
    if (typeof p.getEarnings === "function") return p.getEarnings(from, to);
    return [];
  }

  /** Tüm varlık sınıflarında ara — yerel evren + ABD sağlayıcı araması. */
  async search(query: string): Promise<SearchResult[]> {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    // 1) yerel evren (tüm sınıflar)
    const local: SearchResult[] = UNIVERSE.filter(
      (u) => u.symbol.toLowerCase().includes(q) || u.name.toLowerCase().includes(q),
    )
      .slice(0, 10)
      .map((u) => ({ symbol: u.symbol, name: u.name, type: u.type, exchange: u.type === "bist" ? "BIST" : undefined }));
    // 2) ABD sağlayıcı araması (daha geniş hisse evreni)
    try {
      const remote = await this.usStocks.search(query);
      for (const r of remote) {
        if (!local.some((l) => l.symbol === r.symbol)) local.push(r);
      }
    } catch {
      /* yerel yeterli */
    }
    return local.slice(0, 14);
  }
}
