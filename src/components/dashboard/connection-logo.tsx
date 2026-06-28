"use client";

import { useState } from "react";

/**
 * Bağlantı platformu marka logoları — çok-kaynaklı gerçek logo.
 *
 * Kaynak zinciri (ticker-badge.tsx deseni): simple-icons CDN → Clearbit →
 * markaya tonlu baş-harf rozeti. <img onError> ile bir sonraki kaynağa düşülür;
 * tüm kaynaklar başarısız olursa asla kırık resim göstermez — zarif tipografik
 * rozete iner. Açık tema (Didit): logo zemini açık-gri, fallback token renkli.
 */

// Her platform için marka rengi (fallback rozet tonu + bağlı vurgusu).
export const CONNECTION_BRAND: Record<string, string> = {
  alpaca: "#ffd400",
  ibkr: "#d81222",
  midas: "#7c5cff",
  binance: "#f0b90b",
  coinbase: "#0052ff",
  metamask: "#f6851b",
  ziraat: "#e30613",
  finnhub: "#1db954",
  twelvedata: "#0a66c2",
};

/**
 * Logo kaynak zinciri — id başına denenecek URL'ler (sırayla).
 * - simple-icons CDN: https://cdn.simpleicons.org/{slug}  (renkli marka SVG)
 * - Clearbit:        https://logo.clearbit.com/{domain}   (şirket logosu)
 * - Google favicon:  her domain için çalışır, 128px (son-çare gerçek logo).
 *   simple-icons'ta olmayan (metamask/alpaca/ibkr) ve Clearbit'in tutmadığı
 *   TR markaları (ziraat/midas) burada yakalanır → harf-rozete inilmez.
 */
function logoSources(id: string): string[] {
  const si = (slug: string) => `https://cdn.simpleicons.org/${slug}`;
  const cb = (domain: string) => `https://logo.clearbit.com/${domain}`;
  const gf = (domain: string) => `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  // Her platformun birincil alan adı (Clearbit + Google favicon ortak kullanır).
  const DOMAIN: Record<string, string> = {
    binance: "binance.com",
    coinbase: "coinbase.com",
    metamask: "metamask.io",
    alpaca: "alpaca.markets",
    ibkr: "interactivebrokers.com",
    midas: "midas.com.tr",
    ziraat: "ziraatbank.com.tr",
    finnhub: "finnhub.io",
    twelvedata: "twelvedata.com",
  };
  const domain = DOMAIN[id];
  // simple-icons'ta DOĞRULANMIŞ renkli SVG'si olanlar (CDN'de 200 dönen slug'lar).
  // metamask/alpaca/ibkr/finnhub/twelvedata CDN'de 404 → simple-icons atlanır,
  // Clearbit + Google favicon devreye girer (harf-rozete inilmez).
  const SI_SLUG: Record<string, string> = {
    binance: "binance",
    coinbase: "coinbase",
  };
  const out: string[] = [];
  if (SI_SLUG[id]) out.push(si(SI_SLUG[id]));
  if (domain) out.push(cb(domain), gf(domain));
  return out;
}

/**
 * Çok-kaynaklı gerçek logo. `name` baş harfi son-çare rozet için kullanılır.
 * `on` (bağlı) ise rozet markaya tonlanır; `size` kutu boyutu (px).
 */
export function ConnectionLogo({
  id,
  name,
  size = 44,
  on = false,
}: {
  id: string;
  name: string;
  size?: number;
  on?: boolean;
}) {
  const sources = logoSources(id);
  const [idx, setIdx] = useState(0);
  const color = CONNECTION_BRAND[id] ?? "var(--ais-accent)";
  const url = idx < sources.length ? sources[idx] : null;
  const radius = Math.round(size * 0.27); // ~12px @ 44

  return (
    <span
      className="relative grid shrink-0 place-items-center overflow-hidden font-semibold transition"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.34,
        borderRadius: radius,
        // Logo varken: açık-gri zemin (beyaz/şeffaf logolar kaybolmasın) + ince halka.
        // Logo yokken: markaya tonlu fallback (bağlıysa daha belirgin).
        background: url
          ? "#f4f4f5"
          : on
            ? `${color}1f`
            : "var(--ais-surface-2)",
        color: url ? "#000" : on ? color : "var(--ais-fg-muted)",
        boxShadow: url
          ? "inset 0 0 0 1px rgba(0,0,0,0.06)"
          : `inset 0 0 0 1px ${on ? `${color}40` : "var(--ais-line)"}`,
      }}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={url}
          src={url}
          alt={name}
          width={size}
          height={size}
          className="h-full w-full object-contain p-[20%]"
          loading="lazy"
          onError={() => setIdx((i) => i + 1)}
        />
      ) : (
        name[0]
      )}
    </span>
  );
}
