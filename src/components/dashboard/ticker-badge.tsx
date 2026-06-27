"use client";

import { useState } from "react";
import { logoUrl, getUniverseEntry } from "@/lib/market/universe";

// Logoları beyaz/çok açık olan markalar — açık zeminde kaybolur, harf-rozeti
// daha iyi durur. Bu sembollerde logo yerine renkli rozet gösterilir.
const WHITE_LOGO = new Set(["V", "AMZN", "KO", "SQ", "MA"]);

// Varlık sınıfına göre fallback rozet stili (logo yoksa) + kısa etiket.
// Forex/metal/emtia için anlamlı sembol, BIST için ilk harf — hepsi KOYU
// zeminde okunur (eski hata: beyaz zeminde beyaz harf = görünmez daireydi).
function fallbackFor(symbol: string): { label: string; bg: string; fg: string } {
  const t = getUniverseEntry(symbol).type;
  const s = symbol.toUpperCase();
  switch (t) {
    case "forex":
      return { label: s.slice(0, 3), bg: "#1e2a3a", fg: "#9ec5ff" }; // döviz — mavi ton
    case "metal":
      return { label: s.startsWith("XAU") || s.includes("ALTIN") ? "Au" : s.startsWith("XAG") ? "Ag" : s.slice(0, 2), bg: "#2a2410", fg: "#f5d77a" }; // metal — altın ton
    case "commodity":
      return { label: s.slice(0, 3), bg: "#241a14", fg: "#f0a868" }; // emtia — turuncu ton
    case "bist":
      return { label: s.slice(0, 2), bg: "#1a2620", fg: "#7fd6a8" }; // BIST — yeşil ton
    default:
      // Beyaz-logolu markalara marka rengiyle rozet (logo yerine).
      if (s === "V") return { label: "V", bg: "#1434cb", fg: "#ffffff" }; // Visa mavi
      if (s === "MA") return { label: "MA", bg: "#1a1a1d", fg: "#ff5f00" }; // Mastercard
      if (s === "AMZN") return { label: "AMZN", bg: "#1a1a1d", fg: "#ff9900" }; // Amazon turuncu
      if (s === "KO") return { label: "KO", bg: "#3a0d0d", fg: "#ff5c5c" }; // Coca-Cola kırmızı
      return { label: s.slice(0, 1), bg: "#1a1a1d", fg: "#ffffff" };
  }
}

/**
 * Ticker rozeti — gerçek şirket/kripto logosu; yoksa varlık-sınıfına göre
 * okunaklı KOYU fallback rozeti (forex/metal/emtia/BIST için renkli ton).
 */
export function TickerBadge({
  symbol,
  size = 36,
}: {
  symbol: string;
  size?: number;
}) {
  const url = WHITE_LOGO.has(symbol.toUpperCase()) ? null : logoUrl(symbol);
  const [failed, setFailed] = useState(false);
  const showLogo = url && !failed;
  const fb = fallbackFor(symbol);

  return (
    <span
      className="relative grid shrink-0 place-items-center overflow-hidden rounded-full font-semibold"
      style={{
        width: size,
        height: size,
        fontSize: size * (fb.label.length > 2 ? 0.3 : 0.38),
        // Logo zemini: hafif gri (#ececed) → beyaz/açık logolar (Visa, Apple, KO,
        // Amazon) artık kaybolmaz; renkli logolar da temiz durur. + ince halka.
        background: showLogo ? "#ececed" : fb.bg,
        color: showLogo ? "#000" : fb.fg,
        boxShadow: showLogo
          ? "inset 0 0 0 1px rgba(0,0,0,0.06)"
          : "inset 0 0 0 1px rgba(255,255,255,0.12)",
      }}
    >
      {showLogo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={symbol}
          width={size}
          height={size}
          className="h-full w-full object-contain p-[14%]"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        fb.label
      )}
    </span>
  );
}
