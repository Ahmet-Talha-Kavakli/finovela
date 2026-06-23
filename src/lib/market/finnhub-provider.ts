// Finnhub gerçek-veri sağlayıcısı. Key gelince MARKET_PROVIDER=finnhub.
// Ücretsiz tier: quote, candle (stock), profile2, company-news, search.
// Mock ile birebir aynı arayüz → frontend hiç değişmez.

import type {
  Candle,
  CandleResolution,
  CompanyProfile,
  MarketProvider,
  NewsItem,
  Quote,
  SearchResult,
} from "./types";
import { getUniverseEntry } from "./universe";

const BASE = "https://finnhub.io/api/v1";

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
    const [q, p] = await Promise.all([
      fh<{ c: number; d: number; dp: number; h: number; l: number; o: number; pc: number }>(
        `/quote?symbol=${symbol}`,
      ),
      this.getProfile(symbol).catch(() => null),
    ]);
    const entry = getUniverseEntry(symbol);
    return {
      symbol: symbol.toUpperCase(),
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
    const data = await fh<{
      s: string;
      t: number[];
      o: number[];
      h: number[];
      l: number[];
      c: number[];
      v: number[];
    }>(`/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}`);
    if (data.s !== "ok") return [];
    return data.t.map((t, i) => ({
      time: t,
      open: data.o[i],
      high: data.h[i],
      low: data.l[i],
      close: data.c[i],
      volume: data.v[i],
    }));
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
}
