// Vela portföy analitiği — saf (pure) hesaplama katmanı.
// Korelasyon matrisi, konsantrasyon (HHI / sektör), gelir projeksiyonu ve
// treemap yerleşimi. Tarayıcı/sunucu fark etmeksizin çalışır; Date.now() /
// Math.random() YOK — verilen girdiye göre deterministik.

export type Position = {
  symbol: string;
  value: number;
  sector: string;
};

// ── Korelasyon ───────────────────────────────────────────────────────────────

/** Kapanış serisinden günlük getiri dizisi üretir. */
export function dailyReturns(closes: number[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    const prev = closes[i - 1];
    if (prev) out.push(closes[i] / prev - 1);
  }
  return out;
}

/** İki getiri serisi arasında Pearson korelasyonu (-1..1). */
export function pearson(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 2) return 0;
  const x = a.slice(a.length - n);
  const y = b.slice(b.length - n);
  const mx = x.reduce((s, v) => s + v, 0) / n;
  const my = y.reduce((s, v) => s + v, 0) / n;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    const a1 = x[i] - mx;
    const b1 = y[i] - my;
    num += a1 * b1;
    dx += a1 * a1;
    dy += b1 * b1;
  }
  const den = Math.sqrt(dx * dy);
  if (!den) return 0;
  return Math.max(-1, Math.min(1, num / den));
}

export type CorrelationMatrix = {
  symbols: string[];
  /** matrix[i][j] = symbols[i] ile symbols[j] korelasyonu */
  matrix: number[][];
};

/**
 * Sembol→kapanış serisi haritasından ikili korelasyon matrisi.
 * Köşegen 1, simetrik. Eksik/kısa seriler 0 döner.
 */
export function correlationMatrix(
  historiesMap: Record<string, number[]>,
): CorrelationMatrix {
  const symbols = Object.keys(historiesMap);
  const returns: Record<string, number[]> = {};
  for (const s of symbols) returns[s] = dailyReturns(historiesMap[s] ?? []);

  const matrix = symbols.map((si, i) =>
    symbols.map((sj, j) => {
      if (i === j) return 1;
      return +pearson(returns[si], returns[sj]).toFixed(2);
    }),
  );
  return { symbols, matrix };
}

// ── Konsantrasyon ─────────────────────────────────────────────────────────────

export type ConcentrationResult = {
  total: number;
  topWeight: number; // en büyük pozisyonun ağırlığı (%)
  topSymbol: string | null;
  hhi: number; // Herfindahl-Hirschman İndeksi (0..10000)
  effectiveHoldings: number; // 1/sum(w^2) — etkin çeşitlilik
  sectors: { sector: string; value: number; pct: number }[];
};

/** Pozisyonlardan konsantrasyon metrikleri (HHI, top-weight, sektör dağılımı). */
export function concentration(positions: Position[]): ConcentrationResult {
  const total = positions.reduce((s, p) => s + p.value, 0);
  if (total <= 0) {
    return { total: 0, topWeight: 0, topSymbol: null, hhi: 0, effectiveHoldings: 0, sectors: [] };
  }

  let topWeight = 0;
  let topSymbol: string | null = null;
  let sumSq = 0; // ağırlık karelerinin toplamı (0..1)
  for (const p of positions) {
    const w = p.value / total;
    sumSq += w * w;
    if (w > topWeight) {
      topWeight = w;
      topSymbol = p.symbol;
    }
  }

  const bySector = new Map<string, number>();
  for (const p of positions) {
    bySector.set(p.sector, (bySector.get(p.sector) ?? 0) + p.value);
  }
  const sectors = [...bySector.entries()]
    .map(([sector, value]) => ({
      sector,
      value: +value.toFixed(2),
      pct: +((value / total) * 100).toFixed(1),
    }))
    .sort((a, b) => b.value - a.value);

  return {
    total: +total.toFixed(2),
    topWeight: +(topWeight * 100).toFixed(1),
    topSymbol,
    hhi: Math.round(sumSq * 10000),
    effectiveHoldings: sumSq ? +(1 / sumSq).toFixed(1) : 0,
    sectors,
  };
}

// ── Gelir (temettü) projeksiyonu ──────────────────────────────────────────────

export type IncomeProjection = {
  annual: number;
  monthly: number;
  portfolioYield: number; // ağırlıklı ortalama getiri (%)
  byHolding: { symbol: string; income: number; yield: number }[];
  /** 12 aylık eşit dağıtılmış projeksiyon (basit, sabit aylık) */
  monthlySchedule: { month: string; income: number }[];
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Pozisyon değeri × temettü getirisi → 12 aylık projekte temettü geliri.
 * dividendYields: sembol → yıllık getiri yüzdesi (örn. 0.6 = %0.6).
 */
export function incomeProjection(
  positions: Position[],
  dividendYields: Record<string, number>,
): IncomeProjection {
  const total = positions.reduce((s, p) => s + p.value, 0);
  let annual = 0;
  const byHolding = positions
    .map((p) => {
      const y = dividendYields[p.symbol] ?? 0;
      const income = (p.value * y) / 100;
      annual += income;
      return { symbol: p.symbol, income: +income.toFixed(2), yield: y };
    })
    .filter((h) => h.income > 0)
    .sort((a, b) => b.income - a.income);

  const monthly = annual / 12;
  // Temettüler çoğunlukla çeyrek aylarda (Mar/Haz/Eyl/Ara) ödenir → gerçekçi,
  // dalgalı bir takvim üret. Ağırlıklar 12'ye normalize edilir ki 12 ayın TOPLAMI
  // tam olarak yıllık gelire eşit olsun (aksi halde çubuklar %90 topluyordu).
  const RAW_WEIGHT = [0.45, 0.35, 1.7, 0.5, 0.4, 1.85, 0.5, 0.45, 1.7, 0.55, 0.4, 1.95];
  const weightSum = RAW_WEIGHT.reduce((a, b) => a + b, 0);
  const norm = 12 / weightSum; // toplam 12 olacak şekilde ölçekle
  const monthlySchedule = MONTHS.map((m, i) => ({
    month: m,
    income: +(monthly * RAW_WEIGHT[i] * norm).toFixed(2),
  }));

  return {
    annual: +annual.toFixed(2),
    monthly: +monthly.toFixed(2),
    portfolioYield: total ? +((annual / total) * 100).toFixed(2) : 0,
    byHolding,
    monthlySchedule,
  };
}

// ── Treemap yerleşimi ─────────────────────────────────────────────────────────

export type TreemapRect = {
  symbol: string;
  sector: string;
  value: number;
  pct: number;
  x: number; // 0..1
  y: number; // 0..1
  w: number; // 0..1
  h: number; // 0..1
};

/**
 * Basit satır-tabanlı (row-based) treemap: pozisyonlar değere göre azalan
 * sıralanır, alan-orantılı dikdörtgenler 0..1 normalize koordinatlarda döner.
 * Sektöre göre gruplanır (aynı sektör ardışık gelir) — okunabilir blok dağılımı.
 */
export function treemapData(positions: Position[]): TreemapRect[] {
  const total = positions.reduce((s, p) => s + p.value, 0);
  if (total <= 0) return [];

  // Sektöre göre grupla, sonra her grup içinde değere göre sırala.
  const order = [...positions].sort((a, b) => {
    if (a.sector !== b.sector) {
      const av = positions.filter((p) => p.sector === a.sector).reduce((s, p) => s + p.value, 0);
      const bv = positions.filter((p) => p.sector === b.sector).reduce((s, p) => s + p.value, 0);
      return bv - av;
    }
    return b.value - a.value;
  });

  const items = order.map((p) => ({ ...p, area: p.value / total }));
  const rects: TreemapRect[] = [];

  // squarified yaklaşımı (basitleştirilmiş): kalan alanı satır satır doldur.
  let x = 0;
  let y = 0;
  let availW = 1;
  let availH = 1;
  let i = 0;

  while (i < items.length) {
    const remaining = items.slice(i);
    const remTotal = remaining.reduce((s, it) => s + it.area, 0);
    // En uzun kenar boyunca bir satır oluştur.
    const horizontal = availW >= availH;
    const rowThickness = horizontal ? availH : availW;

    // Bu satıra kaç eleman? En-boy oranını dengede tutmak için aç gözlü ekle.
    const row: typeof remaining = [];
    let rowArea = 0;
    let bestRatio = Infinity;
    for (const it of remaining) {
      const tryArea = rowArea + it.area;
      const lineLen = horizontal ? availW : availH;
      // satırdaki her elemanın en-boy oranını ölç
      const sumW = row.length === 0 ? it.area : tryArea;
      const sideShort = (sumW / remTotal) * (horizontal ? availH : availW);
      const worstRatio = Math.max(
        ...[...row, it].map((r) => {
          const w = (r.area / sumW) * lineLen;
          return Math.max(w / sideShort, sideShort / w);
        }),
      );
      if (worstRatio <= bestRatio || row.length === 0) {
        row.push(it);
        rowArea = tryArea;
        bestRatio = worstRatio;
      } else {
        break;
      }
    }

    // Satırı yerleştir.
    const rowFrac = rowArea / remTotal;
    const thickness = rowThickness * rowFrac;
    let cursor = horizontal ? x : y;
    const lineLen = horizontal ? availW : availH;
    for (const it of row) {
      const seg = (it.area / rowArea) * lineLen;
      rects.push({
        symbol: it.symbol,
        sector: it.sector,
        value: +it.value.toFixed(2),
        pct: +(it.area * 100).toFixed(1),
        x: horizontal ? cursor : x,
        y: horizontal ? y : cursor,
        w: horizontal ? seg : thickness,
        h: horizontal ? thickness : seg,
      });
      cursor += seg;
    }

    // Kalan alanı küçült.
    if (horizontal) {
      y += thickness;
      availH -= thickness;
    } else {
      x += thickness;
      availW -= thickness;
    }
    i += row.length;
  }

  return rects;
}
