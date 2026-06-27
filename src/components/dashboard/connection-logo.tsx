"use client";

import { siBinance, siCoinbase, type SimpleIcon } from "simple-icons";

/**
 * Bağlantı platformu marka logoları. simple-icons'ta SVG'si olanlar (Binance,
 * Coinbase) gerçek marka path'iyle; pakette olmayanlar (MetaMask) elle çizilmiş
 * sade marka SVG'siyle çizilir. Logosu olmayanlar (Alpaca, Interactive Brokers,
 * Midas, banka, Finnhub, TwelveData) null döndürür → çağıran taraf zarif
 * tipografik baş-harf rozetine düşer. Asla kırık resim göstermez.
 */

// simple-icons'tan gelen marka SVG'leri.
const SI_BRANDS: Record<string, SimpleIcon> = {
  binance: siBinance,
  coinbase: siCoinbase,
};

// simple-icons'ta bulunmayan markalar için elle çizilmiş sade marka SVG'leri.
// (viewBox 0 0 24 24)
const CUSTOM_SVG: Record<string, { title: string; path: string }> = {
  // MetaMask tilki başı sadeleştirilmiş silüet.
  metamask: {
    title: "MetaMask",
    path: "M21.1 2.4 13.5 8l1.4-3.3 6.2-2.3ZM2.9 2.4 10.4 8 9.1 4.7 2.9 2.4Zm14.7 12.6-2 3.1 4.3 1.2 1.2-4.2-3.5-.1ZM3 15.1l1.2 4.2 4.3-1.2-2-3.1-3.5.1Zm5.3-4.5L7.1 12.4l4.2.2-.1-4.6-2.9 2.6Zm7.4 0-3-2.6-.1 4.6 4.3-.2-1.2-1.8ZM8.6 18.1l2.6-1.2-2.2-1.7-.4 2.9Zm4.2-1.2 2.6 1.2-.4-2.9-2.2 1.7Z",
  },
};

/** Bu id için gerçek marka logosu (SVG) var mı? */
export function hasBrandGlyph(id: string): boolean {
  return id in SI_BRANDS || id in CUSTOM_SVG;
}

/**
 * Marka logosu SVG'si — varsa <svg> path, yoksa null.
 * `color` verilirse path o renge boyanır (bağlı/bağlı-değil tonlaması için).
 */
export function BrandGlyph({
  id,
  size,
  color,
}: {
  id: string;
  size: number;
  color?: string;
}): React.ReactElement | null {
  const si = SI_BRANDS[id];
  if (si) {
    return (
      <svg
        role="img"
        aria-label={si.title}
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill={color ?? `#${si.hex}`}
      >
        <path d={si.path} />
      </svg>
    );
  }
  const c = CUSTOM_SVG[id];
  if (c) {
    return (
      <svg
        role="img"
        aria-label={c.title}
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill={color ?? "currentColor"}
      >
        <path d={c.path} />
      </svg>
    );
  }
  return null;
}
