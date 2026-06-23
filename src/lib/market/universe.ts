// Vela evreni — mock & UI için kullanılan enstrüman kataloğu.
// Gerçekçi taban fiyat/sektör; mock provider bunları deterministik
// dalgalandırır, finnhub provider ise sadece isim/sektör için referans alır.

export interface UniverseEntry {
  symbol: string;
  name: string;
  sector: string;
  basePrice: number;
  marketCap: number; // USD
  type: "stock" | "etf" | "crypto";
}

export const UNIVERSE: UniverseEntry[] = [
  // Mega-cap tech
  { symbol: "NVDA", name: "NVIDIA Corp.", sector: "Technology", basePrice: 208.65, marketCap: 3_180_000_000_000, type: "stock" },
  { symbol: "AAPL", name: "Apple Inc.", sector: "Technology", basePrice: 297.01, marketCap: 3_010_000_000_000, type: "stock" },
  { symbol: "MSFT", name: "Microsoft Corp.", sector: "Technology", basePrice: 367.34, marketCap: 2_980_000_000_000, type: "stock" },
  { symbol: "GOOGL", name: "Alphabet Inc.", sector: "Technology", basePrice: 348.19, marketCap: 2_140_000_000_000, type: "stock" },
  { symbol: "AMZN", name: "Amazon.com Inc.", sector: "Consumer Cyclical", basePrice: 221.4, marketCap: 2_290_000_000_000, type: "stock" },
  { symbol: "META", name: "Meta Platforms Inc.", sector: "Technology", basePrice: 612.8, marketCap: 1_550_000_000_000, type: "stock" },
  { symbol: "TSLA", name: "Tesla Inc.", sector: "Consumer Cyclical", basePrice: 412.5, marketCap: 1_310_000_000_000, type: "stock" },
  { symbol: "AVGO", name: "Broadcom Inc.", sector: "Technology", basePrice: 1742.0, marketCap: 812_000_000_000, type: "stock" },

  // Financials
  { symbol: "JPM", name: "JPMorgan Chase & Co.", sector: "Financial Services", basePrice: 248.3, marketCap: 712_000_000_000, type: "stock" },
  { symbol: "WFC", name: "Wells Fargo & Co.", sector: "Financial Services", basePrice: 83.84, marketCap: 286_000_000_000, type: "stock" },
  { symbol: "V", name: "Visa Inc.", sector: "Financial Services", basePrice: 318.6, marketCap: 632_000_000_000, type: "stock" },

  // Healthcare / consumer
  { symbol: "UNH", name: "UnitedHealth Group", sector: "Healthcare", basePrice: 406.68, marketCap: 374_000_000_000, type: "stock" },
  { symbol: "KO", name: "The Coca-Cola Company", sector: "Consumer Defensive", basePrice: 79.53, marketCap: 342_000_000_000, type: "stock" },
  { symbol: "GE", name: "GE Aerospace", sector: "Industrials", basePrice: 355.12, marketCap: 380_000_000_000, type: "stock" },
  { symbol: "AMD", name: "Advanced Micro Devices", sector: "Technology", basePrice: 551.45, marketCap: 892_000_000_000, type: "stock" },

  // ETFs
  { symbol: "SPY", name: "SPDR S&P 500 ETF", sector: "ETF", basePrice: 642.18, marketCap: 0, type: "etf" },
  { symbol: "QQQ", name: "Invesco QQQ Trust", sector: "ETF", basePrice: 558.92, marketCap: 0, type: "etf" },
  { symbol: "VTI", name: "Vanguard Total Stock Market", sector: "ETF", basePrice: 318.44, marketCap: 0, type: "etf" },
  { symbol: "ARKK", name: "ARK Innovation ETF", sector: "ETF", basePrice: 78.21, marketCap: 0, type: "etf" },

  // Crypto
  { symbol: "BTC", name: "Bitcoin", sector: "Crypto", basePrice: 98420.0, marketCap: 1_940_000_000_000, type: "crypto" },
  { symbol: "ETH", name: "Ethereum", sector: "Crypto", basePrice: 3842.0, marketCap: 462_000_000_000, type: "crypto" },
  { symbol: "SOL", name: "Solana", sector: "Crypto", basePrice: 238.5, marketCap: 132_000_000_000, type: "crypto" },
];

export const BY_SYMBOL = new Map(UNIVERSE.map((e) => [e.symbol, e]));

export function getUniverseEntry(symbol: string): UniverseEntry {
  return (
    BY_SYMBOL.get(symbol.toUpperCase()) ?? {
      symbol: symbol.toUpperCase(),
      name: symbol.toUpperCase(),
      sector: "Unknown",
      basePrice: 100,
      marketCap: 0,
      type: "stock",
    }
  );
}
