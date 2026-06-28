"use client";

/* ============================================================
   AIS KIT — Vela dashboard standart bileşenleri.
   aistudio.google.com damıtması, SİYAH mod.
   Saf siyah zemin, neredeyse borderless mat kartlar, bol nefes,
   ince tipografi, tek Google-mavi vurgu (çok az). Görselsiz, sade.

   Her dashboard sayfası en dışta `.ais` scope ile sarılır:
     <div className="ais min-h-[calc(100vh-64px)]">
       <div className="mx-auto max-w-5xl px-8 py-10"> ... </div>
     </div>
   ============================================================ */

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Icon } from "@phosphor-icons/react";
import { AnimatedNumber, LiveDot } from "@/components/dashboard/animated-number";

// Koyu tema için açık tonlar — siyah zeminde net okunur.
export const AIS_ACCENT = "#93baf9"; // Finovela mavisi
export const AIS_UP = "#3ecf8e";     // yükseliş yeşili
export const AIS_DOWN = "#ff6b6b";   // düşüş kırmızısı
export const AIS_WARN = "#fbbf24";   // uyarı sarısı

/* ──────────────────────────────────────────────────────────
   ANLAMLI ÇİP RENKLERİ (.ais-light) — seçili filtre vurgusu
   etiketin TEMSİL ETTİĞİ şeye göre değişir, hep mavi değil.
   Kullanım: const c = TONE[f.tone]; ... background: c.bg, color: c.fg
   ────────────────────────────────────────────────────────── */
export type AisTone = "blue" | "green" | "red" | "amber" | "neutral";

/** Anlam tonu → seçili çip {fg, bg}. Açık tema token renkleri. */
export const TONE: Record<AisTone, { fg: string; bg: string }> = {
  blue: { fg: "var(--ais-accent)", bg: "var(--ais-accent-bg)" },
  green: { fg: "var(--ais-green)", bg: "var(--ais-green-bg)" },
  red: { fg: "#d93025", bg: "rgba(217,48,37,0.10)" },
  amber: { fg: "var(--ais-amber)", bg: "var(--ais-amber-bg)" },
  neutral: { fg: "var(--ais-fg)", bg: "var(--ais-line)" },
};

/**
 * Varlık/kategori filtreleri için tutarlı renk haritası — her sınıf
 * sabit ama farklı tonda (ör. kripto=turuncu, BIST=kırmızımsı, döviz=teal).
 * Anahtarlar AssetType + yaygın eş anlamlılar; bulunamazsa mavi accent döner.
 */
export const CATEGORY_TONE: Record<string, { fg: string; bg: string }> = {
  all: { fg: "var(--ais-accent)", bg: "var(--ais-accent-bg)" },
  stock: { fg: "var(--ais-accent)", bg: "var(--ais-accent-bg)" },   // ABD Hisse → mavi
  bist: { fg: "#d93025", bg: "rgba(217,48,37,0.10)" },              // BIST → kırmızımsı
  crypto: { fg: "#f7931a", bg: "rgba(247,147,26,0.12)" },           // Kripto → turuncu
  forex: { fg: "#0f8a8a", bg: "rgba(15,138,138,0.12)" },            // Döviz → teal
  metal: { fg: "var(--ais-amber)", bg: "var(--ais-amber-bg)" },     // Metal → amber
  commodity: { fg: "#7c5e10", bg: "rgba(124,94,16,0.12)" },         // Emtia → koyu amber
  etf: { fg: "#6d4aff", bg: "rgba(109,74,255,0.12)" },              // ETF → mor
};

/** Kategori anahtarı → renk (bulunamazsa mavi accent). */
export function categoryTone(key: string): { fg: string; bg: string } {
  return CATEGORY_TONE[key] ?? CATEGORY_TONE.all;
}

/** Sayfa başlığı — "Başlık • durum etiketi" deseni (AI Studio "Gemini API Usage • Free tier"). */
export function PageTitle({
  title,
  desc,
  actions,
}: {
  title: string;
  desc?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[22px] font-normal tracking-tight text-[var(--ais-fg)]">{title}</h1>
        {desc && (
          <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-[var(--ais-fg-muted)]">{desc}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Bölüm başlığı (AI Studio "Overview" stili) — başlık + opsiyonel açıklama + sağ aksiyon. */
export function Section({
  label,
  desc,
  action,
  className,
}: {
  label: string;
  desc?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex items-end justify-between gap-3", className)}>
      <div>
        <h2 className="text-[15px] font-medium text-[var(--ais-fg)]">{label}</h2>
        {desc && <p className="mt-1 text-[12.5px] text-[var(--ais-fg-muted)]">{desc}</p>}
      </div>
      {action}
    </div>
  );
}

/**
 * Bölüm kutusu (AI Studio Usage paneli) — başlık + açıklama + sağ aksiyon ÜSTTE,
 * içerik aynı mat kartın İÇİNDE (ince ayraçla). Bölümleri kutuya almak için kullan.
 */
export function SectionCard({
  label,
  desc,
  action,
  className,
  bodyClassName,
  children,
}: {
  label: string;
  desc?: string;
  action?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("ais-card overflow-hidden", className)}>
      <div className="flex items-start justify-between gap-3 border-b border-[var(--ais-line)] px-5 py-4">
        <div className="min-w-0">
          <h2 className="text-[14px] font-medium text-[var(--ais-fg)]">{label}</h2>
          {desc && <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--ais-fg-muted)]">{desc}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </div>
  );
}

/** Mat kart — cam/blur yok, sade dolgu + çok ince border. */
export function Card({
  className,
  hover,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { hover?: boolean }) {
  return (
    <div className={cn("ais-card p-5", hover && "ais-card-hover", className)} {...rest}>
      {children}
    </div>
  );
}

/** KPI metriği. */
export function Metric({
  label,
  value,
  sub,
  accent,
  color,
  animate,
  format,
}: {
  label: string;
  value?: React.ReactNode;
  sub?: React.ReactNode;
  accent?: boolean;
  color?: string;
  /** Sayısal değer verilirse count-up animasyonu uygulanır. */
  animate?: number;
  format?: (n: number) => string;
}) {
  return (
    <div className="ais-card p-4">
      <p className="text-[12px] text-[var(--ais-fg-faint)]">{label}</p>
      <p
        className="num mt-2 text-[20px] font-normal tracking-tight"
        style={{ color: color ?? (accent ? AIS_ACCENT : "var(--ais-fg)") }}
      >
        {typeof animate === "number" ? (
          <AnimatedNumber value={animate} format={format} />
        ) : (
          value
        )}
      </p>
      {sub && <p className="mt-1 text-[12px] text-[var(--ais-fg-muted)]">{sub}</p>}
    </div>
  );
}

/** Buton — primary (mavi-soft), default (ince border), ghost. */
export function Btn({
  children,
  variant = "default",
  size = "md",
  href,
  onClick,
  type = "button",
  disabled,
  className,
}: {
  children: React.ReactNode;
  variant?: "primary" | "default" | "ghost" | "danger";
  size?: "sm" | "md";
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
}) {
  const v = {
    primary: "text-[var(--ais-accent)]",
    default: "border border-[var(--ais-line-strong)] text-[var(--ais-fg)] hover:bg-[var(--ais-surface-2)]",
    ghost: "text-[var(--ais-fg-muted)] hover:bg-[var(--ais-surface-2)]",
    danger: "border border-[#f28b82]/30 text-[#f28b82] hover:bg-[#f28b82]/10",
  }[variant];
  const s = size === "sm" ? "h-7 px-2.5 text-[12px] gap-1" : "h-8 px-3 text-[12.5px] gap-1.5";
  const style = variant === "primary" ? { background: "var(--ais-accent-bg)" } : undefined;
  const cls = cn(
    "inline-flex items-center justify-center rounded-lg font-medium transition",
    v,
    s,
    disabled && "cursor-not-allowed opacity-40",
    className,
  );
  if (href) {
    return (
      <Link href={href} className={cls} style={style}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls} style={style}>
      {children}
    </button>
  );
}

/**
 * Segment seçici (toggle group) — Üzerinde/Altında, USD/TRY, risk seviyesi vb.
 * Tutarlı hizalama: dış konteyner ince border + iç buton tam oturur (köşe taşması yok).
 */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  full,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: React.ReactNode; icon?: Icon }[];
  className?: string;
  /** Tam genişlik — butonlar eşit pay alır (form alanları için). */
  full?: boolean;
}) {
  return (
    <div
      className={cn(
        "gap-1 rounded-full border border-[var(--ais-line)] bg-[var(--ais-surface)] p-1",
        full ? "flex w-full" : "inline-flex shrink-0",
        className,
      )}
    >
      {options.map((o) => {
        const on = value === o.value;
        const Ico = o.icon;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors",
              full && "flex-1",
              on
                ? "bg-[var(--ais-accent-bg)] text-[var(--ais-accent)]"
                : "text-[var(--ais-fg-muted)] hover:text-[var(--ais-fg)]",
            )}
          >
            {Ico && <Ico size={14} weight="regular" />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Durum etiketi (pill). */
export function Pill({
  children,
  color = AIS_ACCENT,
  dot,
}: {
  children: React.ReactNode;
  color?: string;
  dot?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{ background: `${color}1f`, color }}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />}
      {children}
    </span>
  );
}

/** İkon kabı (rounded, soft bg). */
export function IconChip({
  icon: Icon,
  color = AIS_ACCENT,
  size = 36,
}: {
  icon: Icon;
  color?: string;
  size?: number;
}) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-lg"
      style={{ width: size, height: size, background: `${color}1f`, color }}
    >
      <Icon size={Math.round(size * 0.5)} weight="regular" />
    </span>
  );
}

/** İnce mavi slider. */
export function Slider({
  label,
  value,
  min,
  max,
  step,
  prefix = "",
  suffix = "",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  prefix?: string;
  suffix?: string;
  onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-[13px] text-[var(--ais-fg-muted)]">{label}</span>
        <span className="num text-[13px] font-medium text-[var(--ais-fg)]">
          {prefix}
          {value.toLocaleString("en-US")}
          {suffix}
        </span>
      </div>
      <div className="relative h-1 rounded-full" style={{ background: "var(--ais-line-strong)" }}>
        <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${pct}%`, background: AIS_ACCENT }} />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
        <div
          className="pointer-events-none absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full"
          style={{ left: `calc(${pct}% - 7px)`, background: AIS_ACCENT, boxShadow: "0 0 0 4px var(--ais-bg)" }}
        />
      </div>
    </div>
  );
}

/** Boş durum. */
export function EmptyState({
  icon: Icon,
  title,
  desc,
  action,
}: {
  icon?: Icon;
  title: string;
  desc?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      {Icon && <Icon size={22} className="text-[var(--ais-fg-faint)]" />}
      <p className="text-[15px] font-medium text-[var(--ais-fg)]">{title}</p>
      {desc && <p className="max-w-sm text-[13px] text-[var(--ais-fg-muted)]">{desc}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

/** Liste satırı (hover'lı). */
export function Row({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("ais-row flex items-center gap-3 px-3 py-3", className)}>{children}</div>;
}

/**
 * Didit segment toggle — seçenek başına ANLAMLI renk (madde 4/7).
 * Her option'a `tone` ver: seçiliyken o renk dolgusu/metni kullanılır.
 * tone yoksa accent (mavi) varsayılır. Açık tema (.ais-light) için.
 * Kullanım:
 *   <DiditToggle value={risk} onChange={setRisk} full options={[
 *     {value:"low", label:"Düşük risk", tone:"green"},
 *     {value:"medium", label:"Dengeli", tone:"blue"},
 *     {value:"high", label:"Agresif", tone:"red"},
 *   ]} />
 */
export function DiditToggle<T extends string>({
  value,
  onChange,
  options,
  full,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: React.ReactNode; tone?: "blue" | "green" | "red" | "amber" }[];
  full?: boolean;
  className?: string;
}) {
  const toneColor = (tone?: string) => {
    switch (tone) {
      case "green": return { fg: "var(--ais-green)", bg: "var(--ais-green-bg)" };
      case "red": return { fg: "#d93025", bg: "rgba(217,48,37,0.10)" };
      case "amber": return { fg: "var(--ais-amber)", bg: "var(--ais-amber-bg)" };
      default: return { fg: "var(--ais-accent)", bg: "var(--ais-accent-bg)" };
    }
  };
  return (
    <div
      className={cn(
        "gap-1 rounded-full border p-1",
        full ? "flex w-full" : "inline-flex",
        className,
      )}
      style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}
    >
      {options.map((o) => {
        const on = value === o.value;
        const c = toneColor(o.tone);
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors",
              full && "flex-1",
            )}
            style={{
              background: on ? c.bg : "transparent",
              color: on ? c.fg : "var(--ais-fg-muted)",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
