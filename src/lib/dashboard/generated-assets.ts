"use client";

// Vela — "Generated Assets" AI portföy üreticisi.
// buildPortfolio: sade-dil bir tema/kriteri yorumlar (UNIVERSE'in sektör/isim
// alanlarına anahtar-kelime eşlemesiyle) ve ağırlıklı bir sepet döndürür.
// Ayrıca üretilen portföyleri localStorage'da saklayan bir store (useSyncExternalStore).

import { useSyncExternalStore } from "react";
import { UNIVERSE, type UniverseEntry } from "@/lib/market/universe";

export type GeneratedWeights = Record<string, number>; // symbol -> pct (toplam ~100)

export type GeneratedPortfolio = {
  id: string;
  name: string;
  prompt: string;
  weights: GeneratedWeights;
  rationale: string;
  createdAt: number;
};

export type BuildResult = {
  name: string;
  prompt: string;
  weights: GeneratedWeights;
  rationale: string;
};

/* ----------------------- BUILDER (saf yorumlama) ----------------------- */

type Theme = {
  // tema adı (eşleşince başlığa girer)
  label: string;
  // sade-dil promptta aranan anahtar kelimeler
  keywords: string[];
  // bu temaya öncelikli semboller (UNIVERSE'de varsa)
  symbols: string[];
  rationale: string;
};

// Önceden tanımlı temalar — anahtar kelime → sembol kümesi.
const THEMES: Theme[] = [
  {
    label: "Yapay Zeka & Çipler",
    keywords: ["ai", "artificial intelligence", "chip", "semiconductor", "gpu", "infrastructure", "compute", "accelerator"],
    symbols: ["NVDA", "AMD", "AVGO", "MSFT", "GOOGL"],
    rationale: "Yapay zeka altyapısını besleyen silikon ve platformlara yoğunlaşmış — GPU'lar, özel hızlandırıcılar ve bunları kullanan dev bulut sağlayıcıları.",
  },
  {
    label: "Temettü Geliri",
    keywords: ["dividend", "income", "payout", "yield", "aristocrat", "cash flow"],
    symbols: ["KO", "JPM", "WFC", "V", "UNH"],
    rationale: "Azami büyüme yerine istikrarlı nakit akışı ve dayanıklılık için seçilmiş kalıcı, kârlı işletmeler.",
  },
  {
    label: "Kripto Liderleri",
    keywords: ["crypto", "bitcoin", "ethereum", "btc", "eth", "digital asset", "blockchain", "web3", "solana"],
    symbols: ["BTC", "ETH", "SOL"],
    rationale: "İnanca göre ağırlıklandırılmış likit, büyük piyasa değerli dijital varlıklar — buradaki en yüksek betalı sepet.",
  },
  {
    label: "Düşük Volatilite",
    keywords: ["safe", "low volatility", "low-volatility", "defensive", "stable", "conservative", "low risk", "low-risk", "minimize"],
    symbols: ["SPY", "VTI", "KO", "UNH", "JPM"],
    rationale: "Yatırımda kalırken salınımları yumuşatmak için geniş piyasa çıpaları ve defansif sağlam hisseler.",
  },
  {
    label: "Dev Teknoloji Hisseleri",
    keywords: ["tech", "technology", "mega cap", "mega-cap", "growth", "magnificent", "big tech", "faang"],
    symbols: ["AAPL", "MSFT", "GOOGL", "AMZN", "META", "NVDA"],
    rationale: "Endeks getirilerini sürükleyen dev piyasa değerli platformlara neredeyse eşit ağırlıklı yatırım.",
  },
  {
    label: "Temiz Enerji & Elektrikli Araç",
    keywords: ["clean", "energy", "ev", "electric", "renewable", "green", "transition", "solar"],
    symbols: ["TSLA", "GE", "AMD", "ARKK"],
    rationale: "Elektrikleşme, şebeke teknolojisi ve enerji geçişini mümkün kılan sanayi şirketleri.",
  },
  {
    label: "Sağlık",
    keywords: ["health", "healthcare", "medical", "medicine", "pharma", "biotech"],
    symbols: ["UNH", "V", "KO", "AAPL"],
    rationale: "Ödeyici ve sağlayıcılardan defansif büyüme, seçici inovasyon yatırımıyla bir arada.",
  },
  {
    label: "Geniş Piyasa Çekirdeği",
    keywords: ["index", "broad", "diversified", "all-weather", "core", "passive", "etf", "spx", "s&p", "total market"],
    symbols: ["VTI", "SPY", "QQQ", "AAPL", "MSFT"],
    rationale: "Endeks yatırımını seçili liderlerle harmanlayan, tek kararlık çeşitlendirilmiş çekirdek.",
  },
];

const BY_SYMBOL = new Map(UNIVERSE.map((e) => [e.symbol, e]));

/** marketCap (yoksa deterministik hash) bazlı ağırlık → 100'e normalize. */
function weightByCap(symbols: string[]): GeneratedWeights {
  const raw = symbols.map((symbol) => {
    const u = BY_SYMBOL.get(symbol);
    let weight = u?.marketCap ?? 0;
    if (!weight) {
      let h = 0;
      for (const c of symbol) h = (h * 31 + c.charCodeAt(0)) % 9973;
      weight = 150_000_000_000 + (h % 400) * 1_000_000_000;
    }
    return { symbol, weight };
  });
  const total = raw.reduce((s, r) => s + r.weight, 0) || 1;
  const out: GeneratedWeights = {};
  let acc = 0;
  raw.forEach((r, i) => {
    if (i === raw.length - 1) {
      out[r.symbol] = +(100 - acc).toFixed(1);
    } else {
      const pct = +((r.weight / total) * 100).toFixed(1);
      out[r.symbol] = pct;
      acc += pct;
    }
  });
  return out;
}

/**
 * Sade-dil promptu yorumla → ağırlıklı sepet.
 * 1) Tema anahtar kelimeleri eşleşirse o temanın sembolleri.
 * 2) Ayrıca promptta geçen sektör adları / şirket isimleri taranır.
 * 3) Hiçbir şey eşleşmezse en büyük cap'li çeşitlendirilmiş çekirdek.
 */
export function buildPortfolio(
  prompt: string,
  universe: UniverseEntry[] = UNIVERSE,
): BuildResult {
  const q = prompt.toLowerCase().trim();

  // En çok anahtar kelime eşleşen temayı bul.
  let best: Theme | null = null;
  let bestScore = 0;
  for (const theme of THEMES) {
    const score = theme.keywords.reduce((s, k) => (q.includes(k) ? s + 1 : s), 0);
    if (score > bestScore) {
      bestScore = score;
      best = theme;
    }
  }

  // Promptta açıkça geçen sembol/şirket isimlerini de topla.
  const explicit = new Set<string>();
  for (const e of universe) {
    const sym = e.symbol.toLowerCase();
    // sembolü kelime sınırıyla ara (kısa semboller için gürültüyü azalt)
    const symHit = new RegExp(`\\b${sym}\\b`).test(q);
    const nameHit =
      e.name.length > 3 && q.includes(e.name.toLowerCase().split(" ")[0]) &&
      e.name.toLowerCase().split(" ")[0].length > 3;
    if (symHit || nameHit) explicit.add(e.symbol);
  }

  // Sektör adı eşleşmesi (örn. "financial", "healthcare").
  const sectorMatches = new Set<string>();
  for (const e of universe) {
    const sec = e.sector.toLowerCase();
    if (sec !== "etf" && sec !== "unknown" && q.includes(sec.split(" ")[0]) && sec.split(" ")[0].length > 3) {
      sectorMatches.add(e.symbol);
    }
  }

  let symbols: string[] = [];
  let label = "Oluşturulan Portföy";
  let rationale = "";

  if (best) {
    symbols = best.symbols.filter((s) => BY_SYMBOL.has(s));
    label = best.label;
    rationale = best.rationale;
  }

  // Açıkça istenen sembolleri ekle (öncelikli).
  for (const s of explicit) if (!symbols.includes(s)) symbols.unshift(s);

  // Tema yoksa sektör eşleşmesine düş.
  if (!symbols.length && sectorMatches.size) {
    symbols = [...sectorMatches].slice(0, 6);
    label = "Sektör Sepeti";
    rationale = "Yatırım evreni içinde eşleşen sektörden taranarak oluşturulmuş odaklı bir sepet.";
  }

  // Hâlâ boşsa: çeşitlendirilmiş çekirdek (en büyük cap'liler + indeks).
  if (!symbols.length) {
    symbols = ["SPY", "AAPL", "MSFT", "NVDA", "AMZN"].filter((s) => BY_SYMBOL.has(s));
    label = "Çeşitlendirilmiş Çekirdek";
    rationale = "Belirli bir tema saptanmadı — geniş piyasa endeksine demirlenmiş, çeşitlendirilmiş büyük ölçekli bir çekirdek.";
  }

  // En fazla 8 pozisyon.
  symbols = [...new Set(symbols)].slice(0, 8);

  const weights = weightByCap(symbols);
  const name = label;

  return { name, prompt: prompt.trim(), weights, rationale };
}

/* ----------------------- PERSISTED STORE ----------------------- */

const KEY = "vela.genassets.v1";
let cache: GeneratedPortfolio[] | null = null;
const listeners = new Set<() => void>();

function load(): GeneratedPortfolio[] {
  if (cache) return cache;
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as GeneratedPortfolio[]) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function persist(next: GeneratedPortfolio[]) {
  cache = next;
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
}

const EMPTY: GeneratedPortfolio[] = [];

export function useGeneratedAssets() {
  const list = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    load,
    () => EMPTY,
  );

  return {
    list,
    save(p: BuildResult): GeneratedPortfolio {
      const entry: GeneratedPortfolio = {
        id: `gen${Date.now()}`,
        name: p.name,
        prompt: p.prompt,
        weights: p.weights,
        rationale: p.rationale,
        createdAt: Date.now(),
      };
      persist([entry, ...load()]);
      return entry;
    },
    remove(id: string) {
      persist(load().filter((p) => p.id !== id));
    },
  };
}
