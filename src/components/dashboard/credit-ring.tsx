"use client";

/**
 * CreditRing — kullanıcı avatarı etrafına ince SVG kredi halkası.
 * Kalan günlük yapay zeka kredisi oranını (remaining/limit) gösterir.
 *  - Sınırsız plan → tam, yumuşak yeşil halka.
 *  - Free → dolan halka; kaldıkça yeşil → amber → kırmızı.
 * Çocuk (avatar) ortada render edilir.
 */

import { useUsage } from "@/lib/dashboard/use-usage";

function ringColor(ratio: number): string {
  // ratio = kalan / limit (0..1). Yüksek = yeşil, düşük = kırmızı.
  if (ratio > 0.5) return "var(--ais-green, #16a34a)";
  if (ratio > 0.2) return "#f59e0b";
  return "#ef4444";
}

export function CreditRing({
  size = 36,
  stroke = 2.5,
  children,
  title,
}: {
  size?: number;
  stroke?: number;
  children: React.ReactNode;
  title?: string;
}) {
  const { limit, remaining, unlimited, loading } = useUsage();

  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  // Kalan oran (0..1). Sınırsızda tam halka.
  const ratio = unlimited
    ? 1
    : limit > 0
      ? Math.max(0, Math.min(1, remaining / limit))
      : 0;

  const color = unlimited ? "var(--ais-green, #16a34a)" : ringColor(ratio);
  const dash = c * ratio;

  const tip =
    title ??
    (unlimited
      ? "Sınırsız yapay zeka"
      : loading
        ? "Kredi yükleniyor…"
        : `Bugün ${remaining}/${limit} sohbet hakkın kaldı`);

  return (
    <span
      className="relative inline-grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
      title={tip}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 -rotate-90"
        aria-hidden
      >
        {/* iz */}
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={stroke} />
        {/* dolgu */}
        {!loading && (ratio > 0 || unlimited) && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c}`}
            style={{
              transition: "stroke-dasharray 0.5s ease, stroke 0.4s ease",
              filter: unlimited ? "drop-shadow(0 0 3px rgba(22,163,74,0.5))" : undefined,
            }}
          />
        )}
      </svg>
      {/* avatar ortada, halkanın içinde kalsın */}
      <span className="grid place-items-center" style={{ width: size - stroke * 2 - 3, height: size - stroke * 2 - 3 }}>
        {children}
      </span>
    </span>
  );
}
