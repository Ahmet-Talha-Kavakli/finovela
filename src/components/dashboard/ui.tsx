import { cn } from "@/lib/utils";

// Ticker rozeti artık gerçek logo çeken client component'te (re-export — tüm
// import yerleri "@/components/dashboard/ui" üzerinden çalışmaya devam etsin).
export { TickerBadge } from "./ticker-badge";

/**
 * Dashboard tasarım dili — MONOKROM / yeni nesil.
 * Zemin: tam siyah (#0a0a0a). Yüzeyler: çok koyu nötr gri, ince beyaz çizgi.
 * Vurgu: BEYAZ/nötr (mor değil). Tek renk istisna: kar=yeşil, zarar=kırmızı.
 * Linear/Arc/Vercel hissi: bol boşluk, ince kenar, yumuşak.
 */

// Paylaşılan token sabitleri (component'ler bunları kullansın)
export const T = {
  bg: "#0a0a0a",
  surface: "#0f0f10",
  surfaceHover: "#151517",
  border: "rgba(255,255,255,0.08)",
  borderStrong: "rgba(255,255,255,0.14)",
  text: "#fafafa",
  muted: "rgba(255,255,255,0.55)",
  faint: "rgba(255,255,255,0.38)",
  up: "#3ecf8e",
  down: "#ff5c5c",
};

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.08] bg-[#0f0f10] p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-center justify-between">
      <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-white/45">
        {children}
      </h2>
      {action}
    </div>
  );
}

/** Renkli yüzde rozeti — yalnızca kar/zarar renkli, gerisi monokrom. */
export function Delta({ value, className }: { value: number; className?: string }) {
  const up = value >= 0;
  return (
    <span
      className={cn("font-medium tabular-nums", className)}
      style={{ color: up ? T.up : T.down }}
    >
      {up ? "▲" : "▼"} {Math.abs(value).toFixed(2)}%
    </span>
  );
}

