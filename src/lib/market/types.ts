// Piyasa verisi — sağlayıcıdan bağımsız ortak tipler.
// Frontend yalnızca bu tipleri bilir; mock ↔ finnhub geçişi şeffaf.

export interface Quote {
  symbol: string;
  name: string;
  price: number;
  change: number; // mutlak değişim
  changePct: number; // yüzde değişim
  open: number;
  high: number;
  low: number;
  prevClose: number;
  volume: number;
  marketCap?: number;
  currency: string;
  logo?: string;
  sector?: string;
}

export interface Candle {
  time: number; // unix saniye
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type CandleResolution = "1" | "5" | "15" | "30" | "60" | "D" | "W" | "M";

export interface CompanyProfile {
  symbol: string;
  name: string;
  description: string;
  sector: string;
  industry: string;
  country: string;
  exchange: string;
  ipo?: string;
  marketCap: number;
  shareOutstanding: number;
  logo?: string;
  weburl?: string;
  employees?: number;
}

export interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  source: string;
  url: string;
  datetime: number;
  image?: string;
  related?: string;
  sentiment?: "positive" | "neutral" | "negative";
}

export interface SearchResult {
  symbol: string;
  name: string;
  type: string;
  exchange?: string;
}

export interface EarningsEvent {
  symbol: string;
  date: string; // YYYY-MM-DD
  hour?: string; // "bmo" (açılış öncesi) | "amc" (kapanış sonrası) | ""
  epsEstimate?: number | null;
  epsActual?: number | null;
  revenueEstimate?: number | null;
  revenueActual?: number | null;
  quarter?: number;
  year?: number;
};

export interface MarketProvider {
  name: string;
  getQuote(symbol: string): Promise<Quote>;
  getQuotes(symbols: string[]): Promise<Quote[]>;
  getCandles(
    symbol: string,
    resolution: CandleResolution,
    from: number,
    to: number,
  ): Promise<Candle[]>;
  getProfile(symbol: string): Promise<CompanyProfile>;
  getNews(symbol?: string): Promise<NewsItem[]>;
  search(query: string): Promise<SearchResult[]>;
  /** Bilanço takvimi (opsiyonel — yalnızca destekleyen sağlayıcı: Finnhub). */
  getEarnings?(from: string, to: string): Promise<EarningsEvent[]>;
}
