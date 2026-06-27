// Vela — Smart Portfolios (curated/thematic AI-built baskets).
// Deterministic mock data for paper-trading demo. Holdings reference the
// shared market universe so prices/names stay consistent across the app.

import { getUniverseEntry } from "@/lib/market/universe";

export type RiskLevel = "Low" | "Moderate" | "High";

export type SmartPortfolio = {
  slug: string;
  name: string;
  thesis: string; // one-line pitch
  detail: string; // longer description for the detail header
  risk: RiskLevel;
  return1y: number; // %
  return3y: number; // % (cumulative)
  expense: number; // % annual
  minInvest: number; // USD
  rebalance: string; // cadence label
  symbols: string[]; // chosen from UNIVERSE deterministically
};

export const SMART_PORTFOLIOS: SmartPortfolio[] = [
  {
    slug: "ai-semiconductors",
    name: "Yapay Zeka & Çipler",
    thesis: "Yapay zeka patlamasını besleyen hesaplama katmanı — çip üreticileri ve hızlandırıcılar.",
    detail:
      "Yapay zekanın arkasındaki silikonu ve altyapıyı inşa eden şirketlerden oluşan yoğunlaşmış bir sepet. GPU liderlerine, özel hızlandırıcılara ve bunlara bağımlı platformlara ağırlık verir.",
    risk: "High",
    return1y: 48.6,
    return3y: 162.4,
    expense: 0.45,
    minInvest: 500,
    rebalance: "Quarterly",
    symbols: ["NVDA", "AMD", "AVGO", "MSFT", "GOOGL"],
  },
  {
    slug: "magnificent-seven",
    name: "Muhteşem Yedili",
    thesis: "Piyasayı sürükleyen dev şirketlere eşit ağırlıklı yatırım.",
    detail:
      "Endeks getirilerinin orantısız bir bölümünü oluşturan, teknoloji ve tüketim alanında baskın yedi platform. Dengeli ağırlıklarla tutulur ve tek bir hissenin baskın olmaması için yeniden dengelenir.",
    risk: "Moderate",
    return1y: 31.2,
    return3y: 98.7,
    expense: 0.25,
    minInvest: 250,
    rebalance: "Quarterly",
    symbols: ["AAPL", "MSFT", "GOOGL", "AMZN", "META", "NVDA", "TSLA"],
  },
  {
    slug: "dividend-aristocrats",
    name: "Temettü Aristokratları",
    thesis: "On yıllardır artan ödemeleriyle kalıcı nakit akışı büyütenler.",
    detail:
      "İstikrarlı ve büyüyen temettüleri için seçilmiş kaliteli, kârlı işletmeler. Azami büyümeden çok gelir ve dayanıklılık için kurgulanmış, defansif hisseler ve finansallara eğilimli.",
    risk: "Low",
    return1y: 12.4,
    return3y: 38.9,
    expense: 0.15,
    minInvest: 100,
    rebalance: "Semi-annual",
    symbols: ["KO", "JPM", "V", "UNH", "GE"],
  },
  {
    slug: "crypto-leaders",
    name: "Kripto Liderleri",
    thesis: "Likit, büyük piyasa değerli dijital varlıklar, inanca göre ağırlıklandırılmış.",
    detail:
      "En köklü kripto paralara yatırım, artı yüksek betalı alternatiflere uydu niteliğinde bir dağılım. Buradaki en oynak portföy — derin düşüşlere rahat bakabilen yatırımcılar için ölçeklenmiş.",
    risk: "High",
    return1y: 87.3,
    return3y: 214.6,
    expense: 0.95,
    minInvest: 100,
    rebalance: "Monthly",
    symbols: ["BTC", "ETH", "SOL"],
  },
  {
    slug: "clean-energy",
    name: "Temiz Enerji",
    thesis: "Elektrikleşme, depolama ve yenilenebilir kaynaklara geçiş.",
    detail:
      "Elektrikli araçları, şebeke teknolojisini ve enerji geçişini mümkün kılan sanayi şirketlerini kapsayan ileri görüşlü bir sepet. Geniş bir endekse kıyasla daha yüksek dağılım ve politika duyarlılığı taşır.",
    risk: "High",
    return1y: 18.9,
    return3y: 44.1,
    expense: 0.55,
    minInvest: 250,
    rebalance: "Quarterly",
    symbols: ["TSLA", "GE", "ARKK", "AMD"],
  },
  {
    slug: "healthcare-innovators",
    name: "Sağlık Yenilikçileri",
    thesis: "Bakım hizmeti, ödeyiciler ve tıbbı yeniden şekillendiren teknoloji.",
    detail:
      "Sağlık sektörü liderlerinden defansif büyüme — istikrarlı ödeyici ve sağlayıcıları seçici inovasyon yatırımıyla birleştirir. Döngüler boyunca daha istikrarlı getiriyi hedefleyen çekirdek-uydu tasarımı.",
    risk: "Moderate",
    return1y: 14.7,
    return3y: 41.3,
    expense: 0.35,
    minInvest: 250,
    rebalance: "Semi-annual",
    symbols: ["UNH", "V", "AAPL", "KO"],
  },
  {
    slug: "low-volatility",
    name: "Düşük Volatilite",
    thesis: "İstikrarlı, düşük betalı sağlam hisselerden daha pürüzsüz getiri.",
    detail:
      "Sarsıntıları en aza indirmek için kurgulanmış. Salınımları yumuşatmak adına defansif, nakit üreten işletmelere ve geniş piyasa çıpasına eğilim gösterirken uzun vadeli büyümeye de katılır.",
    risk: "Low",
    return1y: 9.8,
    return3y: 31.6,
    expense: 0.12,
    minInvest: 100,
    rebalance: "Semi-annual",
    symbols: ["KO", "UNH", "SPY", "VTI", "JPM"],
  },
  {
    slug: "global-growth",
    name: "Küresel Büyüme",
    thesis: "Uzun vadeli birikim için çeşitlendirilmiş, her koşula uygun çekirdek.",
    detail:
      "Geniş piyasa endeksi yatırımını seçili büyüme liderleriyle harmanlayan, tek kararlık çeşitlendirilmiş bir portföy. Zamanla kendini yeniden dengeleyen, müdahalesiz bir çekirdek pozisyon olarak tasarlandı.",
    risk: "Moderate",
    return1y: 21.5,
    return3y: 67.2,
    expense: 0.18,
    minInvest: 100,
    rebalance: "Quarterly",
    symbols: ["VTI", "SPY", "QQQ", "AAPL", "AMZN", "MSFT"],
  },
];

export function getSmartPortfolio(slug: string): SmartPortfolio | undefined {
  return SMART_PORTFOLIOS.find((p) => p.slug === slug);
}

export type PortfolioHolding = {
  symbol: string;
  name: string;
  sector: string;
  pct: number; // allocation %
};

/**
 * Deterministic allocation for a portfolio's holdings.
 * Weights derive from each symbol's marketCap (falls back to a hash for
 * ETFs/crypto without a cap), then normalize to 100%. Stable, no randomness.
 */
export function getPortfolioHoldings(p: SmartPortfolio): PortfolioHolding[] {
  const raw = p.symbols.map((symbol) => {
    const u = getUniverseEntry(symbol);
    let weight = u.marketCap;
    if (!weight) {
      // ETFs/crypto with cap 0 → deterministic weight from the symbol
      let h = 0;
      for (const c of symbol) h = (h * 31 + c.charCodeAt(0)) % 9973;
      weight = 200_000_000_000 + (h % 400) * 1_000_000_000;
    }
    return { symbol, name: u.name, sector: u.sector, weight };
  });
  const total = raw.reduce((s, r) => s + r.weight, 0) || 1;
  const holdings = raw
    .map((r) => ({
      symbol: r.symbol,
      name: r.name,
      sector: r.sector,
      pct: +((r.weight / total) * 100).toFixed(1),
    }))
    .sort((a, b) => b.pct - a.pct);
  // absorb rounding drift into the largest holding
  const drift = +(100 - holdings.reduce((s, h) => s + h.pct, 0)).toFixed(1);
  if (holdings.length) holdings[0].pct = +(holdings[0].pct + drift).toFixed(1);
  return holdings;
}

/**
 * Deterministic performance curve for the detail AreaChart.
 * Trends from a starting NAV of 100 toward 100 * (1 + return1y/100) with a
 * gentle wave whose amplitude scales with the portfolio's risk level.
 */
export function getPortfolioCurve(
  p: SmartPortfolio,
  points = 80,
): { t: number; v: number }[] {
  const start = 100;
  const end = 100 * (1 + p.return1y / 100);
  const amp = p.risk === "High" ? 0.05 : p.risk === "Moderate" ? 0.028 : 0.014;
  // seed from slug so each portfolio's wiggle is unique but stable
  let seed = 0;
  for (const c of p.slug) seed = (seed * 31 + c.charCodeAt(0)) % 997;
  const phase = (seed % 100) / 100;
  const out: { t: number; v: number }[] = [];
  for (let i = 0; i < points; i++) {
    const prog = i / (points - 1);
    const trend = start + (end - start) * prog;
    const wave =
      Math.sin(i * 0.6 + phase * 6) * trend * amp +
      Math.sin(i * 0.21 + phase * 3) * trend * amp * 0.6;
    out.push({ t: i, v: +(trend + wave).toFixed(2) });
  }
  out[out.length - 1].v = +end.toFixed(2);
  return out;
}

/** Map a risk level to a 0-100 gauge value. */
export function riskGaugeValue(risk: RiskLevel): number {
  return risk === "Low" ? 30 : risk === "Moderate" ? 60 : 88;
}
