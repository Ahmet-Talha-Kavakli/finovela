// Vela sentiment katmanı — DETERMİNİSTİK, dış API YOK.
// Sembol string'inden stabil bir hash türetir; sosyal/haber/analist skorlarını
// üretir. Aynı sembol her zaman aynı sonucu verir (SSR/CSR tutarlı).

/** Deterministik string hash (FNV benzeri, taşmasız). */
function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h >>> 0;
}

/** hash → 0..1 aralığında deterministik "pseudo-random". */
function unit(seed: string): number {
  return (hash(seed) % 100000) / 100000;
}

/** lo..hi aralığına deterministik eşleme. */
function ranged(seed: string, lo: number, hi: number): number {
  return lo + unit(seed) * (hi - lo);
}

export type SentimentLabel = "Bullish" | "Neutral" | "Bearish";

export type SentimentScore = {
  symbol: string;
  score: number; // -100..100
  label: SentimentLabel;
  social: number; // 0..100
  news: number; // 0..100
  analyst: number; // 0..100
};

function labelFor(score: number): SentimentLabel {
  if (score >= 20) return "Bullish";
  if (score <= -20) return "Bearish";
  return "Neutral";
}

/**
 * Sembol için birleşik sentiment. social/news/analyst alt-bileşenleri 0..100,
 * birleşik score -100..100. Tamamen deterministik (sembol string'inden).
 */
export function sentimentScore(symbol: string): SentimentScore {
  const sym = symbol.toUpperCase();
  const social = Math.round(ranged(sym + ":social", 25, 92));
  const news = Math.round(ranged(sym + ":news", 30, 88));
  const analyst = Math.round(ranged(sym + ":analyst", 35, 90));
  // 0..100 ortalamayı -100..100'e ölçekle.
  const avg = (social + news + analyst) / 3;
  const score = Math.round((avg - 50) * 2);
  return { symbol: sym, score, label: labelFor(score), social, news, analyst };
}

// ── Haber sentiment (anahtar kelime sezgiseli) ────────────────────────────────

const POSITIVE_WORDS = [
  "beat", "beats", "surge", "surges", "soar", "soars", "record", "rally",
  "jump", "jumps", "gains", "growth", "strong", "upgrade", "upgraded", "bullish",
  "outperform", "tops", "high", "boost", "wins", "accelerat", "inflow", "demand",
];
const NEGATIVE_WORDS = [
  "miss", "misses", "fall", "falls", "drop", "drops", "plunge", "plunges",
  "slump", "cut", "cuts", "trimmed", "trim", "downgrade", "downgraded", "bearish",
  "weak", "lawsuit", "probe", "recall", "warning", "loss", "losses", "decline",
  "concern", "selloff", "sell-off", "tumble",
];

export type NewsSentiment = "positive" | "neutral" | "negative";

/** Başlık metnine göre haber sentiment'i (anahtar kelime sayımı). */
export function newsSentiment(headline: string): NewsSentiment {
  const t = headline.toLowerCase();
  let pos = 0;
  let neg = 0;
  for (const w of POSITIVE_WORDS) if (t.includes(w)) pos++;
  for (const w of NEGATIVE_WORDS) if (t.includes(w)) neg++;
  if (pos > neg) return "positive";
  if (neg > pos) return "negative";
  return "neutral";
}

/** Birden çok başlığın net sentiment'i + dağılımı. */
export function aggregateNewsSentiment(headlines: string[]): {
  net: NewsSentiment;
  positive: number;
  neutral: number;
  negative: number;
} {
  let positive = 0;
  let neutral = 0;
  let negative = 0;
  for (const h of headlines) {
    const s = newsSentiment(h);
    if (s === "positive") positive++;
    else if (s === "negative") negative++;
    else neutral++;
  }
  const net: NewsSentiment =
    positive > negative ? "positive" : negative > positive ? "negative" : "neutral";
  return { net, positive, neutral, negative };
}

// ── Analist konsensüsü ────────────────────────────────────────────────────────

export type AnalystConsensus = {
  symbol: string;
  buy: number;
  hold: number;
  sell: number;
  total: number;
  rating: "Strong Buy" | "Buy" | "Hold" | "Sell";
  target: number; // hedef fiyat
  upsidePct: number; // basePrice'a göre potansiyel (%)
};

/**
 * Deterministik analist konsensüsü. basePrice verilirse upside ona göre,
 * verilmezse target üzerinden nötr 0 döner.
 */
export function analystConsensus(symbol: string, basePrice?: number): AnalystConsensus {
  const sym = symbol.toUpperCase();
  const total = 18 + Math.round(ranged(sym + ":n", 0, 22)); // 18..40 analist
  const buyW = ranged(sym + ":buy", 0.3, 0.85);
  const sellW = ranged(sym + ":sell", 0.02, 0.2);
  const buy = Math.round(total * buyW);
  const sell = Math.min(total - buy, Math.round(total * sellW));
  const hold = Math.max(0, total - buy - sell);

  const buyShare = buy / total;
  const rating: AnalystConsensus["rating"] =
    buyShare >= 0.7 ? "Strong Buy" : buyShare >= 0.5 ? "Buy" : sell > buy ? "Sell" : "Hold";

  // Hedef fiyat: basePrice ± upside; basePrice yoksa hash'ten türet.
  const base = basePrice && basePrice > 0 ? basePrice : ranged(sym + ":px", 50, 600);
  const upsidePct = +ranged(sym + ":up", -8, 24).toFixed(1);
  const target = +(base * (1 + upsidePct / 100)).toFixed(2);

  return { symbol: sym, buy, hold, sell, total, rating, target, upsidePct };
}
