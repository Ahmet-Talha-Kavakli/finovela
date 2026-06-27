// Vela — Hisse/Enstrüman Tarayıcı (screener) saf mantığı.
// Hiçbir fetch / Date.now / Math.random YOK; sadece tip + filtre fonksiyonları.
// UI bu modülü çağırır, canlı kotasyonları kendi getirir.

import type { AssetType } from "@/lib/market/universe";

/** Tarayıcı satırı — evren girişi + canlı fiyat/değişim birleşimi. */
export type ScreenerRow = {
  symbol: string;
  name: string;
  sector: string;
  type: AssetType;
  currency: string;
  price: number;
  changePct: number;
  marketCap: number; // USD (0 = yok/uygulanamaz)
  /** Hesaplanan piyasa-değeri kademesi (büyük/orta/küçük) — yoksa null. */
  capTier: CapTier | null;
};

/** Varlık sınıfı seçimi — "all" tümü demek. */
export type AssetClass = AssetType | "all";

/** Piyasa değeri kademesi. */
export type CapTier = "mega" | "large" | "mid";

/** Günlük değişim ön-filtresi modu. */
export type ChangeMode = "any" | "gainers" | "losers" | "big-gainers" | "big-losers";

/** Sıralama seçeneği. */
export type SortKey = "topGainers" | "topLosers" | "priceDesc" | "priceAsc" | "marketCap";

/** Kullanıcının seçtiği tarama kriterleri. */
export type ScreenerCriteria = {
  assetClass: AssetClass;
  sector: string; // "all" = tüm sektörler
  minPrice: number | null;
  maxPrice: number | null;
  changeMode: ChangeMode;
  capTier: CapTier | "all";
  sort: SortKey;
};

/** Başlangıç (boş) kriterler. */
export const DEFAULT_CRITERIA: ScreenerCriteria = {
  assetClass: "all",
  sector: "all",
  minPrice: null,
  maxPrice: null,
  changeMode: "any",
  capTier: "all",
  sort: "topGainers",
};

/** Varlık sınıfı filtreleri (Türkçe etiketli). */
export const ASSET_CLASSES: { key: AssetClass; label: string }[] = [
  { key: "all", label: "Tümü" },
  { key: "stock", label: "ABD Hisse" },
  { key: "bist", label: "BIST" },
  { key: "crypto", label: "Kripto" },
  { key: "forex", label: "Döviz" },
  { key: "metal", label: "Metal" },
  { key: "commodity", label: "Emtia" },
  { key: "etf", label: "ETF" },
];

/** Günlük değişim modları (Türkçe etiketli). */
export const CHANGE_MODES: { key: ChangeMode; label: string }[] = [
  { key: "any", label: "Hepsi" },
  { key: "gainers", label: "Yükselenler" },
  { key: "losers", label: "Düşenler" },
  { key: "big-gainers", label: "Güçlü yükseliş > +3%" },
  { key: "big-losers", label: "Sert düşüş < −3%" },
];

/** Piyasa değeri kademeleri (Türkçe etiketli). */
export const CAP_TIERS: { key: CapTier | "all"; label: string }[] = [
  { key: "all", label: "Tümü" },
  { key: "mega", label: "Mega-cap ($200Md+)" },
  { key: "large", label: "Large-cap ($10Md+)" },
  { key: "mid", label: "Mid-cap ($2Md+)" },
];

/** Sıralama seçenekleri (Türkçe etiketli). */
export const SORTS: { key: SortKey; label: string }[] = [
  { key: "topGainers", label: "En çok yükselen" },
  { key: "topLosers", label: "En çok düşen" },
  { key: "priceDesc", label: "Fiyat (yüksek → düşük)" },
  { key: "priceAsc", label: "Fiyat (düşük → yüksek)" },
  { key: "marketCap", label: "Piyasa değeri" },
];

/** Toplu FILTERS tanımı — UI tek yerden referans alabilsin. */
export const FILTERS = {
  assetClasses: ASSET_CLASSES,
  changeModes: CHANGE_MODES,
  capTiers: CAP_TIERS,
  sorts: SORTS,
} as const;

const MEGA = 200_000_000_000;
const LARGE = 10_000_000_000;
const MID = 2_000_000_000;

/** Piyasa değerinden kademe türet (0/eksik → null). */
export function capTierOf(marketCap: number): CapTier | null {
  if (!marketCap || marketCap <= 0) return null;
  if (marketCap >= MEGA) return "mega";
  if (marketCap >= LARGE) return "large";
  if (marketCap >= MID) return "mid";
  return null;
}

function matchesChange(changePct: number, mode: ChangeMode): boolean {
  switch (mode) {
    case "gainers":
      return changePct > 0;
    case "losers":
      return changePct < 0;
    case "big-gainers":
      return changePct >= 3;
    case "big-losers":
      return changePct <= -3;
    default:
      return true;
  }
}

/**
 * Saf tarama: satırları kriterlere göre süzer ve sıralar.
 * Girdi dizisini değiştirmez (kopya döner).
 */
export function applyScreener(
  rows: ScreenerRow[],
  c: ScreenerCriteria,
): ScreenerRow[] {
  const filtered = rows.filter((r) => {
    if (c.assetClass !== "all" && r.type !== c.assetClass) return false;
    if (c.sector !== "all" && r.sector !== c.sector) return false;
    if (c.minPrice != null && r.price < c.minPrice) return false;
    if (c.maxPrice != null && r.price > c.maxPrice) return false;
    if (!matchesChange(r.changePct, c.changeMode)) return false;
    if (c.capTier !== "all" && r.capTier !== c.capTier) return false;
    return true;
  });

  const sorted = [...filtered];
  switch (c.sort) {
    case "topGainers":
      sorted.sort((a, b) => b.changePct - a.changePct);
      break;
    case "topLosers":
      sorted.sort((a, b) => a.changePct - b.changePct);
      break;
    case "priceDesc":
      sorted.sort((a, b) => b.price - a.price);
      break;
    case "priceAsc":
      sorted.sort((a, b) => a.price - b.price);
      break;
    case "marketCap":
      sorted.sort((a, b) => b.marketCap - a.marketCap);
      break;
  }
  return sorted;
}

/** Satır listesinden benzersiz sektörleri (alfabetik) çıkar — dropdown için. */
export function sectorsOf(rows: ScreenerRow[]): string[] {
  return Array.from(new Set(rows.map((r) => r.sector))).sort((a, b) =>
    a.localeCompare(b, "tr"),
  );
}

/** Hazır tarama şablonu. */
export type Preset = {
  key: string;
  label: string;
  criteria: ScreenerCriteria;
};

/** Hızlı şablonlar — tek tıkla yaygın taramalar. */
export const PRESETS: Preset[] = [
  {
    key: "todays-gainers",
    label: "Bugünün yükselenleri",
    criteria: {
      ...DEFAULT_CRITERIA,
      changeMode: "big-gainers",
      sort: "topGainers",
    },
  },
  {
    key: "bist-deals",
    label: "BIST fırsatları",
    criteria: {
      ...DEFAULT_CRITERIA,
      assetClass: "bist",
      changeMode: "losers",
      sort: "topLosers",
    },
  },
  {
    key: "cheap-crypto",
    label: "Ucuz kripto",
    criteria: {
      ...DEFAULT_CRITERIA,
      assetClass: "crypto",
      maxPrice: 10,
      sort: "priceAsc",
    },
  },
  {
    key: "mega-stocks",
    label: "Mega-cap hisseler",
    criteria: {
      ...DEFAULT_CRITERIA,
      assetClass: "stock",
      capTier: "mega",
      sort: "marketCap",
    },
  },
];
