// Mock piyasa sağlayıcısı — deterministik, gerçekçi.
// Seed'li PRNG ile her sembol kendi tutarlı fiyat geçmişini üretir;
// "şimdiki" fiyat zamanla yavaşça kayar (canlı hissi). Date.now() burada
// güvenli (script değil, runtime); ama belirlilik için günlük seed kullanırız.

import type {
  Candle,
  CandleResolution,
  CompanyProfile,
  MarketProvider,
  NewsItem,
  Quote,
  SearchResult,
} from "./types";
import { UNIVERSE, getUniverseEntry } from "./universe";

// ── Seed'li PRNG (mulberry32) ──────────────────────────────────────
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSymbol(symbol: string): number {
  let h = 2166136261;
  for (let i = 0; i < symbol.length; i++) {
    h ^= symbol.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Gün bazlı "drift" — fiyatın bugünkü mum içi konumu
function intradayProgress(): number {
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  return Math.min(1, Math.max(0, mins / (24 * 60)));
}

/** Bir sembolün gerçekçi günlük quote'u (deterministik + intraday drift) */
function buildQuote(symbol: string): Quote {
  const entry = getUniverseEntry(symbol);
  const daySeed = Math.floor(Date.now() / 86_400_000); // gün indeksi
  const rng = mulberry32(hashSymbol(symbol) ^ (daySeed * 2654435761));

  // Günlük baz dalgalanma: -3.5% .. +3.5%
  const dayDrift = (rng() - 0.5) * 0.07;
  const open = entry.basePrice * (1 + (rng() - 0.5) * 0.01);
  const targetClose = entry.basePrice * (1 + dayDrift);

  // Intraday: open'dan hedefe doğru ilerle + küçük gürültü
  const prog = intradayProgress();
  const noise = (rng() - 0.5) * 0.006;
  const price = open + (targetClose - open) * prog + entry.basePrice * noise;

  const prevClose = entry.basePrice;
  const change = price - prevClose;
  const changePct = (change / prevClose) * 100;
  const high = Math.max(open, price) * (1 + rng() * 0.012);
  const low = Math.min(open, price) * (1 - rng() * 0.012);
  const volume = Math.floor((0.5 + rng()) * (entry.type === "crypto" ? 8e8 : 4e7));

  return {
    symbol: entry.symbol,
    name: entry.name,
    price: round(price),
    change: round(change),
    changePct: round(changePct),
    open: round(open),
    high: round(high),
    low: round(low),
    prevClose: round(prevClose),
    volume,
    marketCap: entry.marketCap || undefined,
    currency: "USD",
    sector: entry.sector,
  };
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}

/** Geçmiş mumlar — random-walk, bugünkü quote ile uçta tutarlı */
function buildCandles(
  symbol: string,
  resolution: CandleResolution,
  from: number,
  to: number,
): Candle[] {
  const entry = getUniverseEntry(symbol);
  const step = resolutionSeconds(resolution);
  const count = Math.min(2000, Math.max(2, Math.floor((to - from) / step)));
  const rng = mulberry32(hashSymbol(symbol + resolution));

  const candles: Candle[] = [];
  // Geçmişe dönük: bitiş fiyatı ~bugünkü baz; geriye doğru rastgele yürüyüş
  let price = entry.basePrice;
  const vol = entry.type === "crypto" ? 0.03 : 0.015;
  const series: number[] = [];
  for (let i = 0; i < count; i++) {
    const shock = (rng() - 0.5) * 2 * vol;
    const trend = Math.sin(i / (count / 6)) * vol * 0.4;
    price = price * (1 - shock - trend);
    series.push(price);
  }
  series.reverse(); // kronolojik

  for (let i = 0; i < count; i++) {
    const t = from + i * step;
    const close = series[i];
    const open = i === 0 ? close * (1 + (rng() - 0.5) * 0.01) : series[i - 1];
    const high = Math.max(open, close) * (1 + rng() * 0.008);
    const low = Math.min(open, close) * (1 - rng() * 0.008);
    const volume = Math.floor((0.4 + rng()) * (entry.type === "crypto" ? 5e8 : 2e7));
    candles.push({
      time: t,
      open: round(open),
      high: round(high),
      low: round(low),
      close: round(close),
      volume,
    });
  }
  return candles;
}

function resolutionSeconds(r: CandleResolution): number {
  switch (r) {
    case "1": return 60;
    case "5": return 300;
    case "15": return 900;
    case "30": return 1800;
    case "60": return 3600;
    case "D": return 86400;
    case "W": return 604800;
    case "M": return 2592000;
  }
}

const SECTORS_DESC: Record<string, string> = {
  Technology: "leading technology company driving innovation across hardware, software and AI.",
  "Financial Services": "diversified financial services firm spanning banking, payments and markets.",
  Healthcare: "healthcare leader delivering care, coverage and medical innovation at scale.",
  "Consumer Cyclical": "global consumer brand with broad reach across retail and commerce.",
  "Consumer Defensive": "consumer staples company with durable, recession-resistant demand.",
  Industrials: "industrial leader engineering critical infrastructure and aerospace systems.",
  ETF: "exchange-traded fund offering diversified, low-cost market exposure.",
  Crypto: "digital asset operating on a decentralized blockchain network.",
};

const MOCK_HEADLINES = [
  "{S} extends rally as institutional inflows accelerate into year-end",
  "Analysts lift {S} price target citing durable margin expansion",
  "{S} options activity surges ahead of upcoming catalyst",
  "Why {S} remains a core holding for long-term AI portfolios",
  "{S} outperforms sector as macro backdrop steadies",
  "Risk check: what {S}'s latest move means for diversified investors",
];

export class MockProvider implements MarketProvider {
  name = "mock";

  async getQuote(symbol: string): Promise<Quote> {
    return buildQuote(symbol);
  }

  async getQuotes(symbols: string[]): Promise<Quote[]> {
    return symbols.map(buildQuote);
  }

  async getCandles(
    symbol: string,
    resolution: CandleResolution,
    from: number,
    to: number,
  ): Promise<Candle[]> {
    return buildCandles(symbol, resolution, from, to);
  }

  async getProfile(symbol: string): Promise<CompanyProfile> {
    const e = getUniverseEntry(symbol);
    return {
      symbol: e.symbol,
      name: e.name,
      description: `${e.name} is a ${SECTORS_DESC[e.sector] ?? "publicly traded company."}`,
      sector: e.sector,
      industry: e.sector,
      country: "US",
      exchange: e.type === "crypto" ? "CRYPTO" : "NASDAQ",
      marketCap: e.marketCap,
      shareOutstanding: e.marketCap ? Math.round(e.marketCap / e.basePrice) : 0,
      weburl: undefined,
      employees: e.type === "stock" ? 10000 + (hashSymbol(e.symbol) % 200000) : undefined,
    };
  }

  async getNews(symbol?: string): Promise<NewsItem[]> {
    const pool = symbol ? [getUniverseEntry(symbol)] : UNIVERSE.slice(0, 8);
    const out: NewsItem[] = [];
    let idx = 0;
    for (const e of pool) {
      const rng = mulberry32(hashSymbol(e.symbol) + 7);
      for (let i = 0; i < (symbol ? 6 : 2); i++) {
        const h = MOCK_HEADLINES[Math.floor(rng() * MOCK_HEADLINES.length)];
        const sentiments = ["positive", "neutral", "negative"] as const;
        out.push({
          id: `${e.symbol}-${idx++}`,
          headline: h.replace("{S}", e.name),
          summary: `Market commentary on ${e.name} (${e.symbol}). This is illustrative content generated for the Vela demo environment.`,
          source: ["Bloomberg", "Reuters", "CNBC", "MarketWatch"][Math.floor(rng() * 4)],
          url: "#",
          datetime: Math.floor(Date.now() / 1000) - i * 3600 - idx * 600,
          related: e.symbol,
          sentiment: sentiments[Math.floor(rng() * 3)],
        });
      }
    }
    return out.sort((a, b) => b.datetime - a.datetime);
  }

  async search(query: string): Promise<SearchResult[]> {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    return UNIVERSE.filter(
      (e) => e.symbol.toLowerCase().includes(q) || e.name.toLowerCase().includes(q),
    ).map((e) => ({
      symbol: e.symbol,
      name: e.name,
      type: e.type,
      exchange: e.type === "crypto" ? "CRYPTO" : "NASDAQ",
    }));
  }
}
