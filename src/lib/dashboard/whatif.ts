// Vela What-If — Monte Carlo gelecek projeksiyonu (saf, deterministik-tohumlu).
// Geometrik Brownian Hareketi (GBM) ile binlerce yol simüle eder; iyimser/baz/
// kötümser senaryoları yüzdelik dilimlerle döndürür. Tarayıcı + sunucuda çalışır.
// Math.random() kullanmaz — tohumlu LCG ile tekrarlanabilir sonuç.

export type WhatIfInput = {
  startValue: number;
  horizonDays: number;
  annualReturn: number; // ondalık (0.08 = %8)
  annualVol: number; // ondalık (0.2 = %20)
  paths?: number; // varsayılan 2000
  seed?: number;
};

export type ScenarioBand = {
  label: string; // "İyimser" | "Baz" | "Kötümser"
  endValue: number;
  returnPct: number;
  // güven aralığı için yol (örnek tek bir temsili yol)
  curve: number[]; // gün-gün değer (0..horizon)
};

export type WhatIfResult = {
  startValue: number;
  horizonDays: number;
  annualReturn: number;
  annualVol: number;
  paths: number;
  // yüzdelik dilim sonuçları (son değer)
  p5: number;
  p25: number;
  p50: number;
  p75: number;
  p95: number;
  mean: number;
  // P(kâr) ve P(zarar)
  probGain: number;
  probLoss: number;
  scenarios: ScenarioBand[]; // iyimser(p90) / baz(p50) / kötümser(p10) temsili eğriler
};

/** Basit seedlenebilir PRNG (Mulberry32). */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Box-Muller ile standart normal. */
function gaussian(rng: () => number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.round((p / 100) * (sorted.length - 1))));
  return sorted[idx];
}

export function runMonteCarlo(input: WhatIfInput): WhatIfResult {
  const {
    startValue,
    horizonDays,
    annualReturn,
    annualVol,
    paths = 2000,
    seed = 1337,
  } = input;

  const dt = 1 / 252; // bir işlem günü
  const drift = (annualReturn - 0.5 * annualVol * annualVol) * dt;
  const diffusion = annualVol * Math.sqrt(dt);
  const rng = mulberry32(seed);

  const endValues: number[] = [];
  // Temsili eğriler için: her yolun tüm seyrini saklamak pahalı; bunun yerine
  // tüm yolların son değerini topla, sonra p10/p50/p90'a EN YAKIN yolları
  // ikinci geçişte yeniden üreterek eğri çiz. Determinisik olduğu için tekrar üretilebilir.
  for (let i = 0; i < paths; i++) {
    let v = startValue;
    for (let d = 0; d < horizonDays; d++) {
      const z = gaussian(rng);
      v = v * Math.exp(drift + diffusion * z);
    }
    endValues.push(v);
  }

  const sorted = [...endValues].sort((a, b) => a - b);
  const p5 = percentile(sorted, 5);
  const p25 = percentile(sorted, 25);
  const p50 = percentile(sorted, 50);
  const p75 = percentile(sorted, 75);
  const p95 = percentile(sorted, 95);
  const mean = endValues.reduce((a, b) => a + b, 0) / endValues.length;
  const probGain = endValues.filter((v) => v > startValue).length / endValues.length;

  // Temsili eğriler — DOĞRU finansal model: GBM'de belirsizlik zamanın KAREKÖKÜ
  // ile büyür (t ile değil). Her gün d için beklenen log-değer:
  //   μ·d  +  z · σ · √d        (z: senaryo dilimi, σ√d: o güne kadarki sapma)
  // Böylece iyimser/kötümser ufukla MAKUL açılır (katrilyon olmaz), eğri kavislidir,
  // ve her senaryo doğru yüzdelik dilime (p90/p50/p10) oturur. Gürültü organik kavis verir.
  const muDaily = annualReturn - 0.5 * annualVol * annualVol; // yıllık log-drift
  const buildCurve = (zLevel: number, pathSeed: number): number[] => {
    const curve: number[] = [startValue];
    const noise = mulberry32(seed ^ pathSeed);
    let wob = 0;
    for (let d = 1; d <= horizonDays; d++) {
      const tYears = d / 252;
      // beklenen log-getiri: drift·t + z·σ·√t
      const expected = muDaily * tYears + zLevel * annualVol * Math.sqrt(tYears);
      // küçük sönümlü organik dalga (görsel kavis; son noktada sıfıra yaklaşır)
      wob = wob * 0.9 + gaussian(noise) * 0.012 * (1 - d / horizonDays);
      curve.push(startValue * Math.exp(expected + wob));
    }
    return curve;
  };
  // z ≈ ±1.28 → ~%10/%90 dilim
  const optimistic = buildCurve(1.28, 0x1111);
  const base = buildCurve(0, 0x2222);
  const pessimistic = buildCurve(-1.28, 0x3333);

  const band = (label: string, curve: number[]): ScenarioBand => {
    const end = curve[curve.length - 1];
    return {
      label,
      endValue: +end.toFixed(2),
      returnPct: +(((end - startValue) / startValue) * 100).toFixed(1),
      curve: curve.map((x) => +x.toFixed(2)),
    };
  };

  return {
    startValue,
    horizonDays,
    annualReturn,
    annualVol,
    paths,
    p5: +p5.toFixed(2),
    p25: +p25.toFixed(2),
    p50: +p50.toFixed(2),
    p75: +p75.toFixed(2),
    p95: +p95.toFixed(2),
    mean: +mean.toFixed(2),
    probGain: +(probGain * 100).toFixed(1),
    probLoss: +((1 - probGain) * 100).toFixed(1),
    scenarios: [
      band("İyimser", optimistic),
      band("Baz", base),
      band("Kötümser", pessimistic),
    ],
  };
}
