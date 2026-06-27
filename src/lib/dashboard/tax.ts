/**
 * Vela Tax engine — tax-loss harvesting + realized/unrealized özeti.
 * Tamamen saf fonksiyonlar (Date.now() yok; ts'leri çağıran sağlar).
 */

export type TaxLot = {
  symbol: string;
  shares: number;
  avgCost: number;
  price: number; // canlı fiyat
};

export type HarvestOpportunity = {
  symbol: string;
  shares: number;
  costBasis: number;
  marketValue: number;
  unrealizedLoss: number; // pozitif sayı = zarar büyüklüğü
  replacement: string | null; // wash-sale'den kaçınmak için benzer enstrüman
  replacementNote: string;
  estTaxSaved: number;
};

export type UnrealizedRow = {
  symbol: string;
  shares: number;
  costBasis: number;
  marketValue: number;
  gain: number; // +kar / -zarar
  gainPct: number;
};

export type RealizedSummary = {
  shortTermGain: number;
  longTermGain: number;
  totalRealized: number;
  estTaxOwed: number;
  trades: number;
};

/**
 * Wash-sale güvenli ikame haritası — aynı/önemli ölçüde benzer menkulü 30 gün
 * içinde geri almamak için "yeterince farklı ama korelasyonlu" alternatif.
 * Çift yönlü kullanılır.
 */
const REPLACEMENT_MAP: Record<string, { to: string; note: string }> = {
  SPY: { to: "VTI", note: "S&P 500 → Tüm Piyasa (large-cap beta korunur)" },
  VTI: { to: "SPY", note: "Tüm Piyasa → S&P 500" },
  QQQ: { to: "VTI", note: "Nasdaq-100 → Tüm Piyasa (geniş teknoloji)" },
  NVDA: { to: "AMD", note: "Korelasyonlu yarı iletken benzeri" },
  AMD: { to: "NVDA", note: "Korelasyonlu yarı iletken benzeri" },
  AAPL: { to: "MSFT", note: "Mega-cap teknoloji benzeri" },
  MSFT: { to: "AAPL", note: "Mega-cap teknoloji benzeri" },
  GOOGL: { to: "META", note: "Large-cap internet benzeri" },
  META: { to: "GOOGL", note: "Large-cap internet benzeri" },
  TSLA: { to: "AMZN", note: "Tüketici-döngüsel mega-cap benzeri" },
  AMZN: { to: "TSLA", note: "Tüketici-döngüsel mega-cap benzeri" },
  BTC: { to: "ETH", note: "Farklı bir büyük kripto" },
  ETH: { to: "BTC", note: "Farklı bir büyük kripto" },
  SOL: { to: "ETH", note: "Farklı bir büyük kripto" },
  ARKK: { to: "QQQ", note: "İnovasyon → geniş büyüme endeksi" },
};

/** Bir sembol için wash-sale güvenli ikame öner. */
export function suggestReplacement(symbol: string): { to: string; note: string } | null {
  return REPLACEMENT_MAP[symbol.toUpperCase()] ?? null;
}

/** Lot'ların kar/zarar tablosunu üret. */
export function unrealized(lots: TaxLot[]): UnrealizedRow[] {
  return lots.map((l) => {
    const costBasis = +(l.avgCost * l.shares).toFixed(2);
    const marketValue = +(l.price * l.shares).toFixed(2);
    const gain = +(marketValue - costBasis).toFixed(2);
    const gainPct = costBasis > 0 ? +((gain / costBasis) * 100).toFixed(2) : 0;
    return { symbol: l.symbol, shares: l.shares, costBasis, marketValue, gain, gainPct };
  });
}

/**
 * Tax-loss harvesting fırsatları: zararda olan lot'lar.
 * taxRate (örn. 24) ile tasarruf = zarar * rate.
 */
export function harvestOpportunities(lots: TaxLot[], taxRatePct: number): HarvestOpportunity[] {
  const rate = taxRatePct / 100;
  return lots
    .map((l) => {
      const costBasis = +(l.avgCost * l.shares).toFixed(2);
      const marketValue = +(l.price * l.shares).toFixed(2);
      const pl = marketValue - costBasis;
      if (pl >= 0) return null; // sadece zararlılar
      const unrealizedLoss = +Math.abs(pl).toFixed(2);
      const rep = suggestReplacement(l.symbol);
      return {
        symbol: l.symbol,
        shares: l.shares,
        costBasis,
        marketValue,
        unrealizedLoss,
        replacement: rep?.to ?? null,
        replacementNote: rep?.note ?? "Uygun ikame yok — wash-sale'den kaçınmak için 31 gün sonra geri al",
        estTaxSaved: +(unrealizedLoss * rate).toFixed(2),
      } as HarvestOpportunity;
    })
    .filter((x): x is HarvestOpportunity => x !== null)
    .sort((a, b) => b.unrealizedLoss - a.unrealizedLoss);
}

export type RealizedOrder = {
  side: "BUY" | "SELL";
  symbol: string;
  shares: number;
  price: number;
  ts: number;
};

/**
 * Realized kar/zarar özeti — SELL emirlerinden.
 * Maliyet temeli için ilgili sembolün ortalama BUY fiyatı kullanılır (basitleştirilmiş).
 * Kısa vade (<1yıl, ts farkından) vs uzun vade ayrımı yapar.
 * - now: referans tarih (ms), kısa/uzun ayrımı için.
 * - shortRate/longRate: vergi oranları (%).
 */
export function realizedSummary(
  orders: RealizedOrder[],
  now: number,
  shortRatePct = 24,
  longRatePct = 15,
): RealizedSummary {
  const YEAR_MS = 365 * 86_400_000;

  // Sembol başına ortalama BUY maliyeti (tüm BUY'lardan).
  const buys = new Map<string, { qty: number; cost: number; firstTs: number }>();
  for (const o of orders) {
    if (o.side !== "BUY") continue;
    const cur = buys.get(o.symbol) ?? { qty: 0, cost: 0, firstTs: o.ts };
    cur.qty += o.shares;
    cur.cost += o.shares * o.price;
    cur.firstTs = Math.min(cur.firstTs, o.ts);
    buys.set(o.symbol, cur);
  }

  let shortTermGain = 0;
  let longTermGain = 0;
  let trades = 0;

  for (const o of orders) {
    if (o.side !== "SELL") continue;
    trades++;
    const b = buys.get(o.symbol);
    const avgBuy = b && b.qty > 0 ? b.cost / b.qty : o.price;
    const gain = (o.price - avgBuy) * o.shares;
    const held = b ? now - b.firstTs : 0;
    if (held >= YEAR_MS) longTermGain += gain;
    else shortTermGain += gain;
  }

  shortTermGain = +shortTermGain.toFixed(2);
  longTermGain = +longTermGain.toFixed(2);
  const totalRealized = +(shortTermGain + longTermGain).toFixed(2);

  // Vergi yalnızca pozitif kazançtan; zarar mahsubu basitleştirilmiş.
  const estTaxOwed = +(
    Math.max(0, shortTermGain) * (shortRatePct / 100) +
    Math.max(0, longTermGain) * (longRatePct / 100)
  ).toFixed(2);

  return { shortTermGain, longTermGain, totalRealized, estTaxOwed, trades };
}

/** Toplam birikmiş zararı ve potansiyel tasarrufu özetle. */
export function harvestTotals(opps: HarvestOpportunity[]): { totalLoss: number; totalTaxSaved: number } {
  return {
    totalLoss: +opps.reduce((s, o) => s + o.unrealizedLoss, 0).toFixed(2),
    totalTaxSaved: +opps.reduce((s, o) => s + o.estTaxSaved, 0).toFixed(2),
  };
}
