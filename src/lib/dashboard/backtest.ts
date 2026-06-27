// Vela — gerçek backtest motoru. Saf fonksiyonlar, fetch YOK.
// Verilen ağırlıklar {symbol: pct} + her sembol için kapanış dizisi (eski→yeni)
// ile aylık-eşit-rebalanslı portföyü simüle eder ve SPY benchmark'ı ile kıyaslar.
// Çıktı: equity eğrisi, toplam getiri, CAGR, max drawdown, volatilite, Sharpe vb.

export type PriceHistories = Record<string, number[]>; // symbol -> close[] (oldest→newest)

export type EquityPoint = {
  t: number; // index (0..n-1)
  v: number; // portfolio NAV indexed to 100
  b: number; // benchmark NAV indexed to 100
};

export type BacktestMetrics = {
  totalReturn: number; // % over the window
  cagr: number; // % annualized
  maxDrawdown: number; // % (negative, e.g. -18.4)
  volatility: number; // % annualized stdev of daily returns
  sharpe: number; // rf = 0
  bestDay: number; // % best single-day return
  worstDay: number; // % worst single-day return
  winRate: number; // % of up days
  benchTotalReturn: number; // % SPY over same window
  days: number; // number of price points used
};

export type BacktestResult = {
  curve: EquityPoint[];
  metrics: BacktestMetrics;
};

const TRADING_DAYS = 252;
const REBALANCE_EVERY = 21; // ~aylık (21 işlem günü)

/** Ağırlıkları normalize et (toplam = 1). Negatif/NaN'leri at. */
function normalizeWeights(weights: Record<string, number>): Record<string, number> {
  const clean: Record<string, number> = {};
  let total = 0;
  for (const [sym, w] of Object.entries(weights)) {
    if (Number.isFinite(w) && w > 0) {
      clean[sym] = w;
      total += w;
    }
  }
  if (total <= 0) return {};
  for (const sym of Object.keys(clean)) clean[sym] = clean[sym] / total;
  return clean;
}

/**
 * Tüm geçmişleri (portföy sembolleri + benchmark) ortak en kısa uzunluğa
 * hizala. Eski→yeni sıralı varsayar; sondan (en güncel) keser.
 */
function alignHistories(
  weights: Record<string, number>,
  histories: PriceHistories,
  benchmark: number[],
): { len: number; series: Record<string, number[]>; bench: number[] } {
  const syms = Object.keys(weights);
  const lengths = [
    benchmark.length,
    ...syms.map((s) => histories[s]?.length ?? 0),
  ].filter((l) => l > 0);
  const len = lengths.length ? Math.min(...lengths) : 0;

  const series: Record<string, number[]> = {};
  for (const s of syms) {
    const h = histories[s] ?? [];
    series[s] = h.slice(h.length - len);
  }
  const bench = benchmark.slice(benchmark.length - len);
  return { len, series, bench };
}

function emptyMetrics(): BacktestMetrics {
  return {
    totalReturn: 0,
    cagr: 0,
    maxDrawdown: 0,
    volatility: 0,
    sharpe: 0,
    bestDay: 0,
    worstDay: 0,
    winRate: 0,
    benchTotalReturn: 0,
    days: 0,
  };
}

/**
 * Aylık-eşit-rebalanslı portföy NAV serisi üretir (başlangıç 1.0).
 * Her rebalans gününde hedef ağırlıklara döner; aradaki günlerde
 * holding değerleri serbest kayar (buy-and-hold drift).
 */
function simulatePortfolio(
  weights: Record<string, number>,
  series: Record<string, number[]>,
  len: number,
): number[] {
  const syms = Object.keys(weights);
  if (!syms.length || len < 2) return new Array(Math.max(len, 1)).fill(1);

  // Her sembol için dolar pozisyonu (NAV * weight). Başta NAV = 1.
  let positions: Record<string, number> = {};
  let nav = 1;
  for (const s of syms) positions[s] = nav * weights[s];

  const navSeries: number[] = [1];

  for (let i = 1; i < len; i++) {
    // Önceki güne göre fiyat değişimiyle pozisyonları büyüt.
    let newNav = 0;
    for (const s of syms) {
      const prev = series[s][i - 1];
      const cur = series[s][i];
      const r = prev > 0 ? cur / prev : 1;
      positions[s] = positions[s] * r;
      newNav += positions[s];
    }
    nav = newNav;
    navSeries.push(nav);

    // Rebalans günü: pozisyonları hedef ağırlığa geri çek.
    if (i % REBALANCE_EVERY === 0) {
      const rebalanced: Record<string, number> = {};
      for (const s of syms) rebalanced[s] = nav * weights[s];
      positions = rebalanced;
    }
  }
  return navSeries;
}

/** Günlük getiri dizisinden (yüzde değil oran) istatistik. */
function dailyReturns(nav: number[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < nav.length; i++) {
    const prev = nav[i - 1];
    out.push(prev > 0 ? nav[i] / prev - 1 : 0);
  }
  return out;
}

function maxDrawdownPct(nav: number[]): number {
  let peak = nav[0] ?? 1;
  let maxDD = 0;
  for (const v of nav) {
    if (v > peak) peak = v;
    const dd = peak > 0 ? v / peak - 1 : 0;
    if (dd < maxDD) maxDD = dd;
  }
  return maxDD * 100; // negatif
}

function stdev(xs: number[]): number {
  if (xs.length < 2) return 0;
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  const variance =
    xs.reduce((a, b) => a + (b - mean) * (b - mean), 0) / (xs.length - 1);
  return Math.sqrt(variance);
}

/**
 * Backtest çalıştır. weights {symbol: pct (herhangi ölçek)}, histories her
 * sembol için kapanış dizisi (eski→yeni), benchmark SPY kapanış dizisi.
 */
export function runBacktest(
  weights: Record<string, number>,
  histories: PriceHistories,
  benchmark: number[],
): BacktestResult {
  const w = normalizeWeights(weights);
  const { len, series, bench } = alignHistories(w, histories, benchmark);

  if (len < 2 || !Object.keys(w).length) {
    return { curve: [], metrics: emptyMetrics() };
  }

  const navSeries = simulatePortfolio(w, series, len);

  // Benchmark NAV (buy-and-hold SPY), başlangıç 1.
  const benchNav: number[] = [1];
  for (let i = 1; i < len; i++) {
    const prev = bench[i - 1];
    const cur = bench[i];
    const r = prev > 0 ? cur / prev : 1;
    benchNav.push(benchNav[i - 1] * r);
  }

  const curve: EquityPoint[] = navSeries.map((v, i) => ({
    t: i,
    v: +(v * 100).toFixed(2),
    b: +((benchNav[i] ?? 1) * 100).toFixed(2),
  }));

  const rets = dailyReturns(navSeries);
  const totalReturn = (navSeries[len - 1] / navSeries[0] - 1) * 100;
  const benchTotalReturn = (benchNav[len - 1] / benchNav[0] - 1) * 100;

  const years = len / TRADING_DAYS;
  const cagr =
    years > 0 ? (Math.pow(navSeries[len - 1] / navSeries[0], 1 / years) - 1) * 100 : 0;

  const dailyStd = stdev(rets);
  const volatility = dailyStd * Math.sqrt(TRADING_DAYS) * 100;
  const meanDaily = rets.length ? rets.reduce((a, b) => a + b, 0) / rets.length : 0;
  // Sharpe (rf=0): yıllıklaştırılmış ortalama / yıllıklaştırılmış stdev.
  const sharpe = dailyStd > 0 ? (meanDaily * Math.sqrt(TRADING_DAYS)) / dailyStd : 0;

  const bestDay = rets.length ? Math.max(...rets) * 100 : 0;
  const worstDay = rets.length ? Math.min(...rets) * 100 : 0;
  const winRate = rets.length
    ? (rets.filter((r) => r > 0).length / rets.length) * 100
    : 0;

  const metrics: BacktestMetrics = {
    totalReturn: +totalReturn.toFixed(2),
    cagr: +cagr.toFixed(2),
    maxDrawdown: +maxDrawdownPct(navSeries).toFixed(2),
    volatility: +volatility.toFixed(2),
    sharpe: +sharpe.toFixed(2),
    bestDay: +bestDay.toFixed(2),
    worstDay: +worstDay.toFixed(2),
    winRate: +winRate.toFixed(1),
    benchTotalReturn: +benchTotalReturn.toFixed(2),
    days: len,
  };

  return { curve, metrics };
}
