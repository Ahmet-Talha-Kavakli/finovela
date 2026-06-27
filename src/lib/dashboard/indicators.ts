// Teknik indikatör hesapları — candle kapanışlarından (otomasyon trigger'ları için).

/** RSI (Wilder, varsayılan 14 periyot). closes: eskiden yeniye. */
export function rsi(closes: number[], period = 14): number | null {
  if (closes.length < period + 1) return null;
  let gain = 0, loss = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    if (d >= 0) gain += d; else loss -= d;
  }
  let avgGain = gain / period;
  let avgLoss = loss / period;
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(d, 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-d, 0)) / period;
  }
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return +(100 - 100 / (1 + rs)).toFixed(1);
}

/** EMA (varsayılan 50). */
export function ema(closes: number[], period = 50): number | null {
  if (closes.length < period) return null;
  const k = 2 / (period + 1);
  let e = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < closes.length; i++) e = closes[i] * k + e * (1 - k);
  return +e.toFixed(2);
}

/** SMA (basit hareketli ortalama). */
export function sma(closes: number[], period = 50): number | null {
  if (closes.length < period) return null;
  const slice = closes.slice(-period);
  return +(slice.reduce((a, b) => a + b, 0) / period).toFixed(2);
}

/** EMA serisi — her noktada EMA değeri (MACD için gerekli). closes: eskiden yeniye. */
function emaSeries(values: number[], period: number): number[] {
  if (values.length < period) return [];
  const k = 2 / (period + 1);
  const out: number[] = [];
  let e = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  out.push(e);
  for (let i = period; i < values.length; i++) {
    e = values[i] * k + e * (1 - k);
    out.push(e);
  }
  return out;
}

/**
 * MACD (12, 26, 9). closes: eskiden yeniye.
 * macd = EMA12 - EMA26, signal = EMA9(macd), histogram = macd - signal.
 */
export function macd(
  closes: number[],
  fast = 12,
  slow = 26,
  signalPeriod = 9,
): { macd: number; signal: number; histogram: number } | null {
  if (closes.length < slow + signalPeriod) return null;
  const fastSeries = emaSeries(closes, fast);
  const slowSeries = emaSeries(closes, slow);
  // EMA serileri farklı uzunlukta başlar — sondan hizala.
  const len = Math.min(fastSeries.length, slowSeries.length);
  const fastAligned = fastSeries.slice(fastSeries.length - len);
  const slowAligned = slowSeries.slice(slowSeries.length - len);
  const macdLine = fastAligned.map((v, i) => v - slowAligned[i]);
  if (macdLine.length < signalPeriod) return null;
  const signalSeries = emaSeries(macdLine, signalPeriod);
  const macdVal = macdLine[macdLine.length - 1];
  const signalVal = signalSeries[signalSeries.length - 1];
  return {
    macd: +macdVal.toFixed(4),
    signal: +signalVal.toFixed(4),
    histogram: +(macdVal - signalVal).toFixed(4),
  };
}

/**
 * Bollinger Bands — orta bant = SMA(period), bantlar ± mult * stdev. closes: eskiden yeniye.
 */
export function bollinger(
  closes: number[],
  period = 20,
  mult = 2,
): { upper: number; middle: number; lower: number } | null {
  if (closes.length < period) return null;
  const slice = closes.slice(-period);
  const mean = slice.reduce((a, b) => a + b, 0) / period;
  const variance = slice.reduce((a, b) => a + (b - mean) * (b - mean), 0) / period;
  const sd = Math.sqrt(variance);
  return {
    upper: +(mean + mult * sd).toFixed(2),
    middle: +mean.toFixed(2),
    lower: +(mean - mult * sd).toFixed(2),
  };
}

/**
 * ATR (Average True Range, Wilder smoothing). Diziler eskiden yeniye, aynı uzunlukta olmalı.
 * TR = max(high-low, |high-prevClose|, |low-prevClose|).
 */
export function atr(
  highs: number[],
  lows: number[],
  closes: number[],
  period = 14,
): number | null {
  const n = closes.length;
  if (n < period + 1 || highs.length !== n || lows.length !== n) return null;
  const trs: number[] = [];
  for (let i = 1; i < n; i++) {
    const tr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1]),
    );
    trs.push(tr);
  }
  if (trs.length < period) return null;
  // İlk ATR = ilk period TR'nin ortalaması, sonra Wilder smoothing.
  let a = trs.slice(0, period).reduce((x, y) => x + y, 0) / period;
  for (let i = period; i < trs.length; i++) {
    a = (a * (period - 1) + trs[i]) / period;
  }
  return +a.toFixed(2);
}
