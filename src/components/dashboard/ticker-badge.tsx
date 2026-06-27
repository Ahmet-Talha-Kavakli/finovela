"use client";

import { useState } from "react";
import { logoSources, getUniverseEntry } from "@/lib/market/universe";

// Varlık sınıfına göre fallback rozet stili (logo zinciri tükenince) — açık temada
// (Didit) okunur tonlar. Forex/metal/emtia için anlamlı sembol.
function fallbackFor(symbol: string): { label: string; bg: string; fg: string } {
  const t = getUniverseEntry(symbol).type;
  const s = symbol.toUpperCase();
  switch (t) {
    case "forex":
      return { label: s.slice(0, 3), bg: "rgba(37,103,255,0.12)", fg: "#2567ff" };
    case "metal":
      return {
        label: s.startsWith("XAU") || s.includes("ALTIN") ? "Au" : s.startsWith("XAG") ? "Ag" : s.slice(0, 2),
        bg: "rgba(180,140,20,0.14)",
        fg: "#a87f12",
      };
    case "commodity":
      return { label: s.slice(0, 3), bg: "rgba(217,119,48,0.14)", fg: "#c2691f" };
    case "bist":
      return { label: s.slice(0, 2), bg: "rgba(15,125,74,0.12)", fg: "#0f7d4a" };
    default:
      return { label: s.slice(0, 2), bg: "var(--ais-surface-2)", fg: "var(--ais-fg-muted)" };
  }
}

/**
 * Ticker rozeti — çok-kaynaklı gerçek logo (Clearbit → FMP → kripto/BIST CDN);
 * tüm kaynaklar başarısız olursa varlık-sınıfına göre okunaklı harf-rozeti.
 * Açık tema (Didit) uyumlu: logo zemini açık-gri, fallback token renkli.
 */
export function TickerBadge({
  symbol,
  size = 36,
}: {
  symbol: string;
  size?: number;
}) {
  const sources = logoSources(symbol);
  // Hangi kaynaktayız — onError'da bir sonrakine geç; hepsi biterse fallback.
  const [idx, setIdx] = useState(0);
  const fb = fallbackFor(symbol);
  const url = idx < sources.length ? sources[idx] : null;

  return (
    <span
      className="relative grid shrink-0 place-items-center overflow-hidden rounded-full font-semibold"
      style={{
        width: size,
        height: size,
        fontSize: size * (fb.label.length > 2 ? 0.3 : 0.36),
        // Logo zemini açık-gri (beyaz/şeffaf logolar kaybolmasın) + ince halka.
        background: url ? "#f4f4f5" : fb.bg,
        color: url ? "#000" : fb.fg,
        boxShadow: url
          ? "inset 0 0 0 1px rgba(0,0,0,0.06)"
          : "inset 0 0 0 1px var(--ais-line)",
      }}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={url}
          src={url}
          alt={symbol}
          width={size}
          height={size}
          className="h-full w-full object-contain p-[15%]"
          loading="lazy"
          onError={() => setIdx((i) => i + 1)}
        />
      ) : (
        fb.label
      )}
    </span>
  );
}
