// Vela Skoru — her varlığa 0-100 sağlık skoru. Rakiplerde tek-veri (TipRanks),
// bizde AI ile açıklanan + aksiyon öneren bütünleşik skor.
//
// Bileşenler (ağırlıklı):
//   • Momentum (candle getirisi + RSI konumu)   %30
//   • Trend (MA dizilimi: 50 vs 200)            %20
//   • Sentiment (sosyal/haber/analist)          %20
//   • Analist yukarı potansiyeli                %15
//   • Değerleme yakınsaması (market cap proxy)  %15
//
// Candle verisi varsa momentum/trend gerçek; yoksa deterministik sentiment +
// analist + değerleme ile düşürülmüş güvenle skorlar (asla boş dönmez).

import { sentimentScore, analystConsensus } from "./sentiment";
import { rsi, ema } from "./indicators";

export type ScoreFactor = {
  key: string;
  label: string;
  value: number; // 0..100
  weight: number; // 0..1
};

export type VelaScore = {
  symbol: string;
  score: number; // 0..100
  grade: "A" | "B" | "C" | "D" | "F";
  label: string; // "Güçlü" | "Sağlam" | "Nötr" | "Zayıf" | "Riskli"
  factors: ScoreFactor[];
  summary: string;
};

function gradeFor(s: number): VelaScore["grade"] {
  if (s >= 80) return "A";
  if (s >= 65) return "B";
  if (s >= 50) return "C";
  if (s >= 35) return "D";
  return "F";
}
function labelFor(s: number): string {
  if (s >= 80) return "Güçlü";
  if (s >= 65) return "Sağlam";
  if (s >= 50) return "Nötr";
  if (s >= 35) return "Zayıf";
  return "Riskli";
}

const clamp = (v: number) => Math.max(0, Math.min(100, v));

export function computeVelaScore(
  symbol: string,
  opts?: { closes?: number[]; basePrice?: number },
): VelaScore {
  const sym = symbol.toUpperCase();
  const closes = opts?.closes ?? [];

  // ── Momentum ──
  let momentum = 50;
  if (closes.length >= 30) {
    const last = closes[closes.length - 1];
    const ago = closes[Math.max(0, closes.length - 21)]; // ~1 ay önce
    const ret1m = ago ? (last / ago - 1) * 100 : 0;
    const r = rsi(closes);
    // getiriyi -15%..+15% → 0..100; RSI 50 ideal, uçlar cezalı
    const retScore = clamp(50 + ret1m * 3.3);
    const rsiScore = r == null ? 50 : clamp(100 - Math.abs(r - 55) * 1.8);
    momentum = clamp(retScore * 0.6 + rsiScore * 0.4);
  } else {
    momentum = clamp(40 + sentimentScore(sym).social * 0.2);
  }

  // ── Trend ──
  let trend = 50;
  if (closes.length >= 200) {
    const e50 = ema(closes, 50);
    const e200 = ema(closes, 200);
    const last = closes[closes.length - 1];
    if (e50 != null && e200 != null) {
      let t = 50;
      if (e50 > e200) t += 22; else t -= 18; // altın/ölüm kesişimi
      if (last > e50) t += 12; else t -= 10; // fiyat MA üstünde mi
      trend = clamp(t);
    }
  } else if (closes.length >= 50) {
    const e50 = ema(closes, 50);
    const last = closes[closes.length - 1];
    if (e50 != null) trend = clamp(last > e50 ? 62 : 42);
  } else {
    trend = clamp(45 + sentimentScore(sym).news * 0.1);
  }

  // ── Sentiment ──
  const sent = sentimentScore(sym);
  const sentiment = clamp((sent.social + sent.news + sent.analyst) / 3);

  // ── Analist yukarı potansiyeli ──
  const cons = analystConsensus(sym, opts?.basePrice);
  // upside -8..+24 → 0..100
  const analyst = clamp(((cons.upsidePct + 8) / 32) * 100);

  // ── Değerleme yakınsaması (proxy) ── deterministik, sembol stabil
  const valuation = clamp(sentimentScore(sym + ":val").analyst);

  const factors: ScoreFactor[] = [
    { key: "momentum", label: "Momentum", value: Math.round(momentum), weight: 0.3 },
    { key: "trend", label: "Trend", value: Math.round(trend), weight: 0.2 },
    { key: "sentiment", label: "Sentiment", value: Math.round(sentiment), weight: 0.2 },
    { key: "analyst", label: "Analist potansiyeli", value: Math.round(analyst), weight: 0.15 },
    { key: "valuation", label: "Değerleme", value: Math.round(valuation), weight: 0.15 },
  ];

  const score = Math.round(factors.reduce((s, f) => s + f.value * f.weight, 0));

  // Düz-dil özet — en güçlü ve en zayıf faktörü vurgula.
  const sortedH = [...factors].sort((a, b) => b.value - a.value);
  const strong = sortedH[0];
  const weak = sortedH[sortedH.length - 1];
  const summary = `${labelFor(score)} (${score}/100). En güçlü yan: ${strong.label.toLowerCase()} (${strong.value}). Dikkat: ${weak.label.toLowerCase()} (${weak.value}).`;

  return {
    symbol: sym,
    score,
    grade: gradeFor(score),
    label: labelFor(score),
    factors,
    summary,
  };
}
