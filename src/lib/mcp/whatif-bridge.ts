// MCP what-if köprüsü — server-safe. Mevcut runMonteCarlo (GBM) motorunu risk
// profiline göre parametreleyip MCP aracının döndüreceği sade bir özet üretir.
// Yatırım tavsiyesi DEĞİLDİR — eğitim amaçlı senaryo.

import { runMonteCarlo } from "@/lib/dashboard/whatif";

// Risk profili → tipik yıllık beklenen getiri + volatilite (ondalık).
// Dashboard What-If Stüdyosu'ndaki profillerle tutarlı.
const RISK_PARAMS: Record<string, { annualReturn: number; annualVol: number; label: string }> = {
  low: { annualReturn: 0.05, annualVol: 0.08, label: "Düşük risk" },
  balanced: { annualReturn: 0.09, annualVol: 0.16, label: "Dengeli" },
  aggressive: { annualReturn: 0.14, annualVol: 0.3, label: "Agresif" },
};

export function simulateWhatIf(amount: number, years: number, risk: string) {
  const amt = Number.isFinite(amount) && amount > 0 ? amount : 1000;
  const yrs = Number.isFinite(years) && years > 0 ? Math.min(years, 40) : 1;
  const profile = RISK_PARAMS[risk] ?? RISK_PARAMS.balanced;

  const res = runMonteCarlo({
    startValue: amt,
    horizonDays: Math.round(yrs * 252),
    annualReturn: profile.annualReturn,
    annualVol: profile.annualVol,
    seed: 42, // deterministik (MCP istemcileri tutarlı sonuç bekler)
  });

  const pct = (v: number) => `${(((v - amt) / amt) * 100).toFixed(1)}%`;
  const usd = (v: number) => `$${Math.round(v).toLocaleString("en-US")}`;

  return {
    input: { amount: amt, years: yrs, riskProfile: profile.label },
    assumptions: {
      annualReturn: `${(profile.annualReturn * 100).toFixed(0)}%`,
      annualVolatility: `${(profile.annualVol * 100).toFixed(0)}%`,
      model: "Geometric Brownian Motion, 2000 paths",
    },
    projection: {
      optimistic: { value: usd(res.p95), return: pct(res.p95) },
      base: { value: usd(res.p50), return: pct(res.p50) },
      pessimistic: { value: usd(res.p5), return: pct(res.p5) },
      expected: { value: usd(res.mean), return: pct(res.mean) },
    },
    probabilities: {
      gain: `${(res.probGain * 100).toFixed(0)}%`,
      loss: `${(res.probLoss * 100).toFixed(0)}%`,
    },
    disclaimer:
      "Bu bir simülasyondur, yatırım tavsiyesi değildir. Geçmiş/varsayımsal performans gelecekteki sonuçları garanti etmez.",
  };
}
