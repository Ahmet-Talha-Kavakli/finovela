// Vela Dashboard — paylaşılan mock veri katmanı (paper-trading).
// Tüm dashboard sayfaları buradan beslenir → tutarlı rakamlar.
// Deterministik; gerçek veriye geçişte sadece bu dosya değişir.

import { UNIVERSE, getUniverseEntry } from "@/lib/market/universe";

export type Holding = {
  symbol: string;
  shares: number;
  avgCost: number;
};

/** Kullanıcının paper portföyü */
export const HOLDINGS: Holding[] = [
  { symbol: "NVDA", shares: 120, avgCost: 165.2 },
  { symbol: "AAPL", shares: 80, avgCost: 248.0 },
  { symbol: "MSFT", shares: 40, avgCost: 330.5 },
  { symbol: "TSLA", shares: 30, avgCost: 295.0 },
  { symbol: "QQQ", shares: 25, avgCost: 498.1 },
  { symbol: "BTC", shares: 0.35, avgCost: 84200 },
  { symbol: "SOL", shares: 60, avgCost: 168.4 },
];

export const CASH = 12480.55;

export type Position = Holding & {
  name: string;
  sector: string;
  price: number;
  value: number;
  cost: number;
  pl: number;
  plPct: number;
  dayChangePct: number;
};

/** Deterministik "bugünkü" fiyat — basePrice etrafında sabit sapma */
function todayPrice(symbol: string): { price: number; dayChangePct: number } {
  const base = getUniverseEntry(symbol).basePrice;
  // sembolden türeyen deterministik sapma (-3% .. +5%)
  let h = 0;
  for (const c of symbol) h = (h * 31 + c.charCodeAt(0)) % 1000;
  const dayChangePct = ((h % 80) - 30) / 10; // -3.0 .. +4.9
  const price = +(base * (1 + dayChangePct / 100)).toFixed(2);
  return { price, dayChangePct };
}

export function getPositions(): Position[] {
  return HOLDINGS.map((h) => {
    const u = getUniverseEntry(h.symbol);
    const { price, dayChangePct } = todayPrice(h.symbol);
    const value = +(price * h.shares).toFixed(2);
    const cost = +(h.avgCost * h.shares).toFixed(2);
    const pl = +(value - cost).toFixed(2);
    const plPct = +((pl / cost) * 100).toFixed(2);
    return {
      ...h,
      name: u.name,
      sector: u.sector,
      price,
      value,
      cost,
      pl,
      plPct,
      dayChangePct,
    };
  });
}

export function getPortfolioSummary() {
  const positions = getPositions();
  const invested = positions.reduce((s, p) => s + p.value, 0);
  const cost = positions.reduce((s, p) => s + p.cost, 0);
  const total = invested + CASH;
  const totalPl = invested - cost;
  const totalPlPct = +((totalPl / cost) * 100).toFixed(2);
  const dayPl = positions.reduce(
    (s, p) => s + (p.value * p.dayChangePct) / 100,
    0,
  );
  const dayPlPct = +((dayPl / invested) * 100).toFixed(2);
  return {
    total: +total.toFixed(2),
    invested: +invested.toFixed(2),
    cash: CASH,
    totalPl: +totalPl.toFixed(2),
    totalPlPct,
    dayPl: +dayPl.toFixed(2),
    dayPlPct,
  };
}

/** Allocation (sektöre göre) */
export function getAllocation() {
  const positions = getPositions();
  const bySector = new Map<string, number>();
  for (const p of positions) {
    bySector.set(p.sector, (bySector.get(p.sector) ?? 0) + p.value);
  }
  const total = [...bySector.values()].reduce((a, b) => a + b, 0);
  const colors: Record<string, string> = {
    Technology: "#8b5cff",
    "Consumer Cyclical": "#c084fc",
    ETF: "#a855f7",
    Crypto: "#6510f0",
    "Financial Services": "#7c3aed",
    Healthcare: "#9d6bff",
  };
  return [...bySector.entries()]
    .map(([sector, value]) => ({
      sector,
      value: +value.toFixed(2),
      pct: +((value / total) * 100).toFixed(1),
      color: colors[sector] ?? "#8b5cff",
    }))
    .sort((a, b) => b.value - a.value);
}

/** Net-değer zaman serisi (deterministik, yukarı eğilimli) */
export function getEquityCurve(points = 60): { t: number; v: number }[] {
  const summary = getPortfolioSummary();
  const end = summary.total;
  const start = end * 0.82;
  const out: { t: number; v: number }[] = [];
  for (let i = 0; i < points; i++) {
    const prog = i / (points - 1);
    // hafif dalgalı yükseliş
    const wave = Math.sin(i * 0.7) * end * 0.012 + Math.sin(i * 0.23) * end * 0.02;
    const v = start + (end - start) * prog + wave;
    out.push({ t: i, v: +v.toFixed(2) });
  }
  out[out.length - 1].v = end;
  return out;
}

/**
 * S&P 500 (SPY) karşılaştırma serisi — portföy eğrisiyle aynı ölçeğe normalize
 * edilmiş referans çizgi. Deterministik, makul bir piyasa eğilimi (portföyden
 * biraz daha sönük yükseliş + farklı dalga deseni) üretir. Gerçek SPY mum verisi
 * yoksa grafiklerde "S&P 500" benchmark çizgisi olarak kullanılır.
 */
export function getBenchmarkCurve(curve: { t: number; v: number }[]): number[] {
  const n = curve.length;
  if (n < 2) return curve.map((p) => p.v);
  const start = curve[0].v;
  const end = curve[n - 1].v;
  // SPY portföye göre biraz daha düşük getiri (piyasa ortalaması) — referans his.
  const benchEnd = start + (end - start) * 0.72;
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const prog = i / (n - 1);
    // portföyden farklı, daha yumuşak dalga deseni
    const wave = Math.sin(i * 0.45 + 1.2) * start * 0.008;
    out.push(+(start + (benchEnd - start) * prog + wave).toFixed(2));
  }
  return out;
}

/** Watchlist */
export const WATCHLIST = ["AAPL", "AMD", "META", "GOOGL", "ETH", "SPY"];

export function getWatchlist() {
  return WATCHLIST.map((symbol) => {
    const u = getUniverseEntry(symbol);
    const { price, dayChangePct } = todayPrice(symbol);
    return { symbol, name: u.name, price, dayChangePct, sector: u.sector };
  });
}

/** Top movers (evrenden) */
export function getMovers() {
  const all = UNIVERSE.map((u) => {
    const { price, dayChangePct } = todayPrice(u.symbol);
    return { symbol: u.symbol, name: u.name, price, dayChangePct };
  });
  const gainers = [...all].sort((a, b) => b.dayChangePct - a.dayChangePct).slice(0, 5);
  const losers = [...all].sort((a, b) => a.dayChangePct - b.dayChangePct).slice(0, 5);
  return { gainers, losers };
}

/** AI günlük brifing — yedek (canlı AI yanıtı gelmezse). Spesifik %/sembol
    iddiası İÇERMEZ; aksi halde canlı portföy rakamlarıyla çelişiyordu. */
export const AI_BRIEFING = [
  "Portföyünün güncel durumu yukarıdaki özet ve dağılım panelinde canlı gösteriliyor.",
  "Teknoloji ağırlığın yüksekse, hedef dağılımına göre dengelemeyi değerlendirebilirsin.",
  "Önemli pozisyonlarında sert hareket olursa Alarmlar ve Finovela Pulse seni haberdar eder.",
  "Bu hafta bilanço açıklayan şirketleri Bilançolar sayfasından takip edebilirsin.",
];

/** Otomasyon ajanları */
export type Automation = {
  id: string;
  name: string;
  rule: string;
  status: "active" | "paused";
  category: "Trading" | "Cash" | "Risk";
  lastRun: string;
};

export const AUTOMATIONS: Automation[] = [
  { id: "a1", name: "Haftalık QQQ alımı", rule: "Her Cuma 200$ QQQ al", status: "active", category: "Trading", lastRun: "2 gün önce" },
  { id: "a2", name: "Hedefe dengele", rule: "Hisseler %5'ten fazla saparsa 50/50'ye dengele", status: "active", category: "Risk", lastRun: "1 hafta önce" },
  { id: "a3", name: "Nakit süpürme", rule: "1.000$ üzeri boştaki nakdi getiriye aktar", status: "active", category: "Cash", lastRun: "Bugün" },
  { id: "a4", name: "NVDA düşüş alıcısı", rule: "Her %8 düşüşte NVDA'ya 500$ ekle", status: "paused", category: "Trading", lastRun: "3 hafta önce" },
  { id: "a5", name: "TSLA zarar durdur", rule: "TSLA 245$ altına inerse sat", status: "active", category: "Risk", lastRun: "İzleniyor" },
];

/** Copy-trading leaderboard */
export type Trader = {
  handle: string;
  name: string;
  return1y: number;
  copiers: number;
  risk: number; // 1-10
  style: string;
  win: number;
};

export const LEADERBOARD: Trader[] = [
  { handle: "@quantsarah", name: "Sarah Chen", return1y: 64.2, copiers: 8420, risk: 6, style: "Yapay Zeka & Çip", win: 71 },
  { handle: "@valuevik", name: "Viktor Adler", return1y: 38.9, copiers: 5110, risk: 3, style: "Değer & Temettü", win: 68 },
  { handle: "@momentummax", name: "Max Rivera", return1y: 81.5, copiers: 12200, risk: 8, style: "Yüksek Momentum", win: 63 },
  { handle: "@steadyamy", name: "Amy Brooks", return1y: 22.4, copiers: 3340, risk: 2, style: "Endeks Çekirdek", win: 74 },
  { handle: "@cryptojay", name: "Jay Okafor", return1y: 112.7, copiers: 9870, risk: 9, style: "Kripto & Altcoin", win: 58 },
  { handle: "@incomeian", name: "Ian Fletcher", return1y: 17.8, copiers: 2210, risk: 2, style: "Opsiyon Geliri", win: 79 },
];

/** Strategy backtest örnek metrikleri */
export const STRATEGY_TEMPLATES = [
  { name: "Momentum Rotasyonu", desc: "En güçlü sektörleri tut, aylık rotasyon yap.", cagr: 24.1, dd: -18.4, sharpe: 1.32 },
  { name: "Temettü Geliri", desc: "Yüksek kaliteli temettü büyütenler, yeniden yatırımlı.", cagr: 11.2, dd: -9.1, sharpe: 1.05 },
  { name: "Düşük Volatilite", desc: "Düşüşü en aza indir, yolu yumuşat.", cagr: 9.8, dd: -6.7, sharpe: 1.41 },
  { name: "Yapay Zeka & İnovasyon", desc: "Yapay zeka liderlerine yoğunlaşmış bahis.", cagr: 38.6, dd: -27.3, sharpe: 1.12 },
];

/** Research — earnings & sentiment örnekleri */
export const EARNINGS = [
  { symbol: "AAPL", date: "Thu", time: "After close", epsEst: 2.41, status: "upcoming" },
  { symbol: "MSFT", date: "Wed", time: "After close", epsEst: 3.18, status: "upcoming" },
  { symbol: "NVDA", date: "Thu", time: "After close", epsEst: 1.04, status: "upcoming" },
  { symbol: "TSLA", date: "Reported", time: "Beat by 8%", epsEst: 0.74, status: "beat" },
];

export function fmtUsd(n: number, dp = 2) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });
}

export function fmtNum(n: number) {
  return n.toLocaleString("en-US");
}

/** Para birimine duyarlı biçimlendirme (USD $, TRY ₺ vb.). Forex çiftleri için dp artar. */
export function fmtMoney(n: number, currency = "USD", dp = 2) {
  const symbol = currency === "TRY" ? "₺" : currency === "USD" ? "$" : "";
  // çok küçük değerler (forex/altcoin) için daha fazla ondalık
  const decimals = Math.abs(n) > 0 && Math.abs(n) < 10 ? Math.max(dp, 4) : dp;
  const num = n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  if (symbol === "$") return `$${num}`;
  if (symbol === "₺") return `₺${num}`;
  return `${num} ${currency}`;
}
