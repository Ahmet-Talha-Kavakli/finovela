/**
 * Vela Fixed Income — bonds + treasuries kataloğu, ladder kurucu ve yield matematiği.
 * Saf fonksiyonlar (Date.now() yok; ladder tarihi hesabı için referans tarih PARAMETRE).
 */

export type BondType = "corporate" | "treasury" | "muni";
export type Rating = "AAA" | "AA+" | "AA" | "A+" | "A" | "BBB+" | "BBB" | "BBB-" | "BB+" | "BB";

export type Bond = {
  id: string;
  issuer: string;
  type: BondType;
  coupon: number; // yıllık kupon %
  ytm: number; // vade-getirisi (yield to maturity) %
  price: number; // 100 par üzerinden temiz fiyat
  maturity: string; // ISO yyyy-mm-dd
  rating: Rating;
  callable: boolean;
};

export type Treasury = {
  id: string;
  name: string;
  term: "3mo" | "6mo" | "1y" | "2y" | "5y" | "10y";
  termMonths: number;
  yield: number; // %
};

/* ── Individual BONDS (12) ─────────────────────────────────── */
export const BONDS: Bond[] = [
  { id: "b1", issuer: "Apple Inc.", type: "corporate", coupon: 4.65, ytm: 4.72, price: 99.4, maturity: "2031-02-15", rating: "AA+", callable: false },
  { id: "b2", issuer: "Microsoft Corp.", type: "corporate", coupon: 4.25, ytm: 4.4, price: 98.7, maturity: "2033-06-01", rating: "AAA", callable: false },
  { id: "b3", issuer: "Oracle Corp.", type: "corporate", coupon: 6.25, ytm: 5.9, price: 102.1, maturity: "2030-09-15", rating: "BBB", callable: true },
  { id: "b4", issuer: "Ford Motor Credit", type: "corporate", coupon: 6.8, ytm: 6.45, price: 101.6, maturity: "2029-11-01", rating: "BB+", callable: false },
  { id: "b5", issuer: "AT&T Inc.", type: "corporate", coupon: 5.65, ytm: 5.5, price: 100.8, maturity: "2034-03-15", rating: "BBB", callable: true },
  { id: "b6", issuer: "Boeing Co.", type: "corporate", coupon: 6.4, ytm: 6.1, price: 101.4, maturity: "2032-05-01", rating: "BBB-", callable: false },
  { id: "b7", issuer: "JPMorgan Chase", type: "corporate", coupon: 4.9, ytm: 4.85, price: 100.2, maturity: "2030-01-23", rating: "A", callable: false },
  { id: "b8", issuer: "Occidental Petroleum", type: "corporate", coupon: 6.6, ytm: 6.25, price: 101.9, maturity: "2030-08-15", rating: "BB+", callable: true },
  { id: "b9", issuer: "US Treasury Note 2032", type: "treasury", coupon: 4.0, ytm: 4.18, price: 98.5, maturity: "2032-11-15", rating: "AAA", callable: false },
  { id: "b10", issuer: "US Treasury Bond 2045", type: "treasury", coupon: 4.5, ytm: 4.62, price: 97.8, maturity: "2045-08-15", rating: "AAA", callable: false },
  { id: "b11", issuer: "California State GO", type: "muni", coupon: 3.85, ytm: 3.6, price: 102.3, maturity: "2035-07-01", rating: "AA", callable: true },
  { id: "b12", issuer: "NY MTA Revenue", type: "muni", coupon: 4.1, ytm: 3.95, price: 101.1, maturity: "2033-04-01", rating: "A+", callable: false },
];

/* ── US TREASURIES (6) ─────────────────────────────────────── */
export const TREASURIES: Treasury[] = [
  { id: "t3mo", name: "3-Month T-Bill", term: "3mo", termMonths: 3, yield: 4.55 },
  { id: "t6mo", name: "6-Month T-Bill", term: "6mo", termMonths: 6, yield: 4.48 },
  { id: "t1y", name: "1-Year T-Bill", term: "1y", termMonths: 12, yield: 4.32 },
  { id: "t2y", name: "2-Year T-Note", term: "2y", termMonths: 24, yield: 4.15 },
  { id: "t5y", name: "5-Year T-Note", term: "5y", termMonths: 60, yield: 4.08 },
  { id: "t10y", name: "10-Year T-Note", term: "10y", termMonths: 120, yield: 4.22 },
];

/* ── Yield math ────────────────────────────────────────────── */

/** Basit cari getiri = yıllık kupon / fiyat. */
export function currentYield(bond: Bond): number {
  return +((bond.coupon / bond.price) * 100).toFixed(2);
}

/** Verilen yatırım için yıllık kupon geliri (YTM bazlı). */
export function annualIncome(amount: number, yieldPct: number): number {
  return +(amount * (yieldPct / 100)).toFixed(2);
}

/* ── Bond screener ─────────────────────────────────────────── */

export type BondFilter = {
  type?: BondType | "all";
  minYield?: number;
  rating?: Rating | "all";
};

const RATING_ORDER: Rating[] = ["AAA", "AA+", "AA", "A+", "A", "BBB+", "BBB", "BBB-", "BB+", "BB"];

/** rating'i sayısal kaliteye çevir (0 = en güçlü). */
export function ratingRank(r: Rating): number {
  const i = RATING_ORDER.indexOf(r);
  return i === -1 ? RATING_ORDER.length : i;
}

/** Yatırım sınıfı mı (BBB- ve üstü)? */
export function isInvestmentGrade(r: Rating): boolean {
  return ratingRank(r) <= RATING_ORDER.indexOf("BBB-");
}

/**
 * Bond screener — type/min-yield/rating'e göre filtreler.
 * rating filtresi: seçilen rating VE üstü (daha güçlü) tutulur.
 */
export function screenBonds(bonds: Bond[], f: BondFilter): Bond[] {
  return bonds.filter((b) => {
    if (f.type && f.type !== "all" && b.type !== f.type) return false;
    if (f.minYield != null && b.ytm < f.minYield) return false;
    if (f.rating && f.rating !== "all" && ratingRank(b.rating) > ratingRank(f.rating)) return false;
    return true;
  });
}

/* ── Treasury ladder builder ───────────────────────────────── */

export type LadderRung = {
  index: number;
  termMonths: number;
  termLabel: string;
  amount: number;
  yield: number;
  maturityDate: string; // yyyy-mm-dd
  projectedInterest: number; // vadeye kadar toplam faiz (basit)
};

export type Ladder = {
  rungs: LadderRung[];
  totalAmount: number;
  totalProjectedInterest: number;
  blendedYield: number;
};

function addMonths(fromMs: number, months: number): string {
  const d = new Date(fromMs);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

function termLabel(months: number): string {
  if (months < 12) return `${months}mo`;
  const y = months / 12;
  return Number.isInteger(y) ? `${y}y` : `${y.toFixed(1)}y`;
}

/**
 * Sermayeyi kademeli vadelere böler. Her rung için vade tarihi ve projeksiyon faizi döner.
 * - amount: toplam sermaye
 * - rungs: kademe sayısı (termsMonths verilmezse otomatik staggered 6,12,18... aylar)
 * - termsMonths: opsiyonel manuel vade dizisi (rungs ile uyumlanır)
 * - now: referans tarih (ms). Saf tutmak için PARAMETRE; çağıran Date.now() verir.
 * Vade getirisi, TREASURIES eğrisinden en yakın terimle eşleştirilir.
 */
export function buildLadder(
  amount: number,
  rungs: number,
  termsMonths?: number[],
  now: number = 0,
): Ladder {
  const n = Math.max(1, Math.floor(rungs));
  const per = amount / n;

  const terms =
    termsMonths && termsMonths.length === n
      ? termsMonths
      : Array.from({ length: n }, (_, i) => (i + 1) * 6); // 6,12,18,...

  const ref = now || Date.UTC(2026, 5, 24); // güvenli sabit varsayılan (saf)

  const out: LadderRung[] = terms.map((m, i) => {
    const y = nearestTreasuryYield(m);
    const years = m / 12;
    const projectedInterest = +(per * (y / 100) * years).toFixed(2);
    return {
      index: i + 1,
      termMonths: m,
      termLabel: termLabel(m),
      amount: +per.toFixed(2),
      yield: y,
      maturityDate: addMonths(ref, m),
      projectedInterest,
    };
  });

  const totalProjectedInterest = +out.reduce((s, r) => s + r.projectedInterest, 0).toFixed(2);
  const blendedYield = +(out.reduce((s, r) => s + r.yield, 0) / out.length).toFixed(2);

  return {
    rungs: out,
    totalAmount: +amount.toFixed(2),
    totalProjectedInterest,
    blendedYield,
  };
}

/** Verilen vade (ay) için Treasury eğrisinden en yakın getiri. */
export function nearestTreasuryYield(months: number): number {
  let best = TREASURIES[0];
  let bestDiff = Infinity;
  for (const t of TREASURIES) {
    const diff = Math.abs(t.termMonths - months);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = t;
    }
  }
  return best.yield;
}
