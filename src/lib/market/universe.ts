// Vela evreni — mock & UI için kullanılan enstrüman kataloğu.
// Gerçekçi taban fiyat/sektör; mock provider bunları deterministik
// dalgalandırır, finnhub provider ise sadece isim/sektör için referans alır.

export type AssetType =
  | "stock" // ABD hissesi
  | "etf"
  | "crypto" // gerçek spot kripto (CoinGecko)
  | "bist" // Borsa İstanbul hissesi (Yahoo .IS)
  | "forex" // döviz çifti (Twelve Data)
  | "metal" // değerli metal: XAU/XAG + gram altın
  | "commodity"; // emtia: petrol vb.

export interface UniverseEntry {
  symbol: string;
  name: string;
  sector: string;
  basePrice: number;
  marketCap: number; // USD
  type: AssetType;
  /** Görüntü para birimi (varsayılan USD; BIST & gram altın TRY). */
  currency?: string;
  /** Sağlayıcıya özel kaynak sembolü (CoinGecko id, Yahoo .IS, TwelveData XAU/USD vb.). */
  providerSymbol?: string;
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

  // Crypto (gerçek spot — CoinGecko)
  { symbol: "BTC", name: "Bitcoin", sector: "Crypto", basePrice: 98420.0, marketCap: 1_940_000_000_000, type: "crypto", providerSymbol: "bitcoin" },
  { symbol: "ETH", name: "Ethereum", sector: "Crypto", basePrice: 3842.0, marketCap: 462_000_000_000, type: "crypto", providerSymbol: "ethereum" },
  { symbol: "SOL", name: "Solana", sector: "Crypto", basePrice: 238.5, marketCap: 132_000_000_000, type: "crypto", providerSymbol: "solana" },
  { symbol: "XRP", name: "XRP", sector: "Crypto", basePrice: 2.34, marketCap: 134_000_000_000, type: "crypto", providerSymbol: "ripple" },
  { symbol: "ADA", name: "Cardano", sector: "Crypto", basePrice: 0.92, marketCap: 33_000_000_000, type: "crypto", providerSymbol: "cardano" },
  { symbol: "DOGE", name: "Dogecoin", sector: "Crypto", basePrice: 0.38, marketCap: 56_000_000_000, type: "crypto", providerSymbol: "dogecoin" },
  { symbol: "AVAX", name: "Avalanche", sector: "Crypto", basePrice: 41.2, marketCap: 17_000_000_000, type: "crypto", providerSymbol: "avalanche-2" },

  // BIST — Borsa İstanbul (Yahoo Finance .IS, TRY)
  { symbol: "THYAO", name: "Türk Hava Yolları", sector: "Ulaştırma", basePrice: 312.5, marketCap: 431_000_000_000, type: "bist", currency: "TRY", providerSymbol: "THYAO.IS" },
  { symbol: "ASELS", name: "Aselsan", sector: "Savunma", basePrice: 168.2, marketCap: 383_000_000_000, type: "bist", currency: "TRY", providerSymbol: "ASELS.IS" },
  { symbol: "GARAN", name: "Garanti BBVA", sector: "Bankacılık", basePrice: 142.8, marketCap: 600_000_000_000, type: "bist", currency: "TRY", providerSymbol: "GARAN.IS" },
  { symbol: "AKBNK", name: "Akbank", sector: "Bankacılık", basePrice: 72.4, marketCap: 376_000_000_000, type: "bist", currency: "TRY", providerSymbol: "AKBNK.IS" },
  { symbol: "KCHOL", name: "Koç Holding", sector: "Holding", basePrice: 198.6, marketCap: 504_000_000_000, type: "bist", currency: "TRY", providerSymbol: "KCHOL.IS" },
  { symbol: "TUPRS", name: "Tüpraş", sector: "Enerji", basePrice: 178.9, marketCap: 345_000_000_000, type: "bist", currency: "TRY", providerSymbol: "TUPRS.IS" },
  { symbol: "BIMAS", name: "BİM Mağazalar", sector: "Perakende", basePrice: 512.0, marketCap: 311_000_000_000, type: "bist", currency: "TRY", providerSymbol: "BIMAS.IS" },
  { symbol: "EREGL", name: "Ereğli Demir Çelik", sector: "Demir-Çelik", basePrice: 46.8, marketCap: 164_000_000_000, type: "bist", currency: "TRY", providerSymbol: "EREGL.IS" },
  { symbol: "FROTO", name: "Ford Otosan", sector: "Otomotiv", basePrice: 1024.0, marketCap: 359_000_000_000, type: "bist", currency: "TRY", providerSymbol: "FROTO.IS" },
  { symbol: "SISE", name: "Şişecam", sector: "Sanayi", basePrice: 38.9, marketCap: 119_000_000_000, type: "bist", currency: "TRY", providerSymbol: "SISE.IS" },

  // Forex (Twelve Data)
  { symbol: "USDTRY", name: "Dolar / Türk Lirası", sector: "Döviz", basePrice: 42.3, marketCap: 0, type: "forex", currency: "TRY", providerSymbol: "USD/TRY" },
  { symbol: "EURUSD", name: "Euro / Dolar", sector: "Döviz", basePrice: 1.082, marketCap: 0, type: "forex", currency: "USD", providerSymbol: "EUR/USD" },
  { symbol: "EURTRY", name: "Euro / Türk Lirası", sector: "Döviz", basePrice: 45.8, marketCap: 0, type: "forex", currency: "TRY", providerSymbol: "EUR/TRY" },
  { symbol: "GBPUSD", name: "Sterlin / Dolar", sector: "Döviz", basePrice: 1.27, marketCap: 0, type: "forex", currency: "USD", providerSymbol: "GBP/USD" },

  // Değerli metaller (Twelve Data + gram altın sentetik)
  { symbol: "GRAMALTIN", name: "Gram Altın", sector: "Değerli Metal", basePrice: 4350.0, marketCap: 0, type: "metal", currency: "TRY", providerSymbol: "GRAM_GOLD" },
  { symbol: "XAUUSD", name: "Altın (ons)", sector: "Değerli Metal", basePrice: 2680.0, marketCap: 0, type: "metal", currency: "USD", providerSymbol: "XAU/USD" },
  { symbol: "XAGUSD", name: "Gümüş (ons)", sector: "Değerli Metal", basePrice: 31.2, marketCap: 0, type: "metal", currency: "USD", providerSymbol: "XAG/USD" },

  // Emtia (Twelve Data)
  { symbol: "WTI", name: "Ham Petrol (WTI)", sector: "Emtia", basePrice: 71.4, marketCap: 0, type: "commodity", currency: "USD", providerSymbol: "WTI/USD" },
  { symbol: "BRENT", name: "Brent Petrol", sector: "Emtia", basePrice: 75.8, marketCap: 0, type: "commodity", currency: "USD", providerSymbol: "BRENT/USD" },
];

/**
 * Sembol → marka domaini. Referans amaçlı tutulur (logo kaynağı artık
 * sembol-tabanlı CDN'ler; bu harita başka yerlerde kullanılabildiği için korunur).
 */
export const SYMBOL_DOMAIN: Record<string, string> = {
  NVDA: "nvidia.com",
  AAPL: "apple.com",
  MSFT: "microsoft.com",
  GOOGL: "abc.xyz",
  AMZN: "amazon.com",
  META: "meta.com",
  TSLA: "tesla.com",
  AVGO: "broadcom.com",
  JPM: "jpmorganchase.com",
  WFC: "wellsfargo.com",
  V: "visa.com",
  UNH: "unitedhealthgroup.com",
  KO: "coca-cola.com",
  GE: "geaerospace.com",
  AMD: "amd.com",
  SPY: "ssga.com",
  QQQ: "invesco.com",
  VTI: "vanguard.com",
  ARKK: "ark-funds.com",
  BTC: "bitcoin.org",
  ETH: "ethereum.org",
  SOL: "solana.com",
  XRP: "ripple.com",
  ADA: "cardano.org",
  DOGE: "dogecoin.com",
  AVAX: "avax.network",
  // BIST — FMP boş dönerse Google favicon ile gerçek kurum logosu gelsin.
  THYAO: "turkishairlines.com",
  ASELS: "aselsan.com.tr",
  GARAN: "garantibbva.com.tr",
  AKBNK: "akbank.com",
  KCHOL: "koc.com.tr",
  TUPRS: "tupras.com.tr",
  BIMAS: "bim.com.tr",
  EREGL: "erdemir.com.tr",
  FROTO: "fordotosan.com.tr",
  SISE: "sisecam.com.tr",
};

/**
 * Kripto sembol → spothq cryptocurrency-icons ikon adı (lowercase).
 * Bu CDN anahtarsız ve 200 döner.
 */
const CRYPTO_ICON: Record<string, string> = {
  BTC: "btc",
  ETH: "eth",
  SOL: "sol",
  XRP: "xrp",
  ADA: "ada",
  DOGE: "doge",
  AVAX: "avax",
};

/**
 * BIST sembolleri → FMP image-stock için ".IS" uzantılı sembol.
 * FMP bu hisselerin gerçek kurum logosunu döndürür (örn. THYAO.IS.png).
 * Listede olmayan BIST sembolü FMP'de boş döneceği için <img onError>
 * harf-rozetine düşer.
 */
const BIST_SYMBOLS = new Set([
  "THYAO",
  "ASELS",
  "GARAN",
  "AKBNK",
  "KCHOL",
  "TUPRS",
  "BIMAS",
  "EREGL",
  "FROTO",
  "SISE",
]);

/**
 * Gerçek logo URL'i — anahtarsız, halka açık CDN'ler:
 *  - ABD hisse/ETF: Financial Modeling Prep image-stock (sembol-tabanlı PNG, 200).
 *  - BIST hissesi: FMP image-stock + ".IS" uzantısı (gerçek kurum logosu).
 *  - Kripto: spothq/cryptocurrency-icons (renkli 128px PNG, 200).
 * Döviz/metal/emtia gibi logosu olmayan enstrümanlar null döner →
 * varlık-sınıfına göre zarif tipografik rozete düşer (ticker-badge).
 */
export function logoUrl(symbol: string): string | null {
  const sym = symbol.toUpperCase();
  const crypto = CRYPTO_ICON[sym];
  if (crypto) {
    return `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${crypto}.png`;
  }
  if (BIST_SYMBOLS.has(sym)) {
    return `https://financialmodelingprep.com/image-stock/${sym}.IS.png`;
  }
  if (SYMBOL_DOMAIN[sym]) {
    return `https://financialmodelingprep.com/image-stock/${sym}.png`;
  }
  return null;
}

/**
 * Çok-kaynaklı logo zinciri — ticker-badge sırayla dener (img onError → sıradaki).
 * Öncelik (en güvenilirden başla, hep gerçek logoya in, asla boş kalma):
 *   1) FMP image-stock — doğrulanmış 200, anahtarsız, temiz PNG.
 *   2) Clearbit — yüksek kalite şeffaf PNG (FMP "XX"/yamuk verirse).
 *   3) Google favicon (sz=128) — her domain için çalışır SON-ÇARE gerçek logo;
 *      Clearbit erişilemese/ölse bile marka logosu yine gelir → harf-rozetine
 *      ancak domaini olmayan enstrümanlarda (forex/metal/emtia) inilir.
 * Boş dizi dönerse harf-rozetine düşülür.
 */
export function logoSources(symbol: string): string[] {
  const sym = symbol.toUpperCase();
  const out: string[] = [];
  const domain = SYMBOL_DOMAIN[sym];
  const crypto = CRYPTO_ICON[sym];
  if (crypto) {
    out.push(`https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${crypto}.png`);
    // Kripto domain'i varsa: Clearbit + Google favisi yedek (spothq yeni coinlerde eksik).
    if (domain) out.push(`https://logo.clearbit.com/${domain}`, gfavicon(domain));
    return out;
  }
  if (BIST_SYMBOLS.has(sym)) {
    out.push(`https://financialmodelingprep.com/image-stock/${sym}.IS.png`);
  } else if (domain) {
    out.push(`https://financialmodelingprep.com/image-stock/${sym}.png`);
  }
  if (domain) {
    out.push(`https://logo.clearbit.com/${domain}`, gfavicon(domain));
  }
  return out;
}

/** Google favicon servisi — her domain için 128px logo döndürür (sansürsüz son-çare). */
function gfavicon(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}

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
