"use client";

/**
 * Yeni nesil görselleştirmeler (saf SVG, bağımlılıksız).
 * Monokrom çekirdek + tek nötr-mor/mavi accent + gradyan dolgu + glow.
 * Linear/Arc/Vercel hissi: derinlikli, canlı ama abartısız.
 */

import { useId } from "react";

// Marka accent'i (monokromu bozmadan canlılık) — soğuk mor-mavi.
const ACCENT = "#a9b4ff";
const ACCENT_HI = "#c9d2ff";

export function AreaChart({
  data,
  height = 220,
  positive = true,
  benchmark,
  benchmarkLabel = "S&P 500",
}: {
  data: { t: number; v: number }[];
  height?: number;
  positive?: boolean;
  /** Opsiyonel karşılaştırma serisi (örn. SPY) — soluk gri ikinci çizgi. */
  benchmark?: number[];
  benchmarkLabel?: string;
}) {
  const uid = useId().replace(/:/g, "");
  if (!data.length) return null;
  const w = 800;
  const h = height;
  const vs = data.map((d) => d.v);
  // benchmark verilirse onu da ölçeğe kat (aynı eksende otursun)
  const hasBench = !!benchmark && benchmark.length === data.length;
  const allVs = hasBench ? [...vs, ...benchmark!] : vs;
  const min = Math.min(...allVs);
  const max = Math.max(...allVs);
  const range = max - min || 1;
  const pad = range * 0.1;
  const x = (i: number) => (i / (data.length - 1)) * w;
  const y = (v: number) => h - ((v - min + pad) / (range + pad * 2)) * h;
  // yumuşak (catmull-rom → bezier) eğri — daha organik, "yeni nesil"
  const pts = data.map((d, i) => [x(i), y(d.v)] as [number, number]);
  const line = smoothPath(pts);
  const area = `${line} L${w},${h} L0,${h} Z`;
  const benchLine = hasBench
    ? smoothPath(benchmark!.map((v, i) => [x(i), y(v)] as [number, number]))
    : "";
  const up = positive;
  const c1 = up ? "#3ecf8e" : "#ff5c5c";

  const svg = (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-full w-full overflow-visible">
      <defs>
        <linearGradient id={`area-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c1} stopOpacity="0.28" />
          <stop offset="55%" stopColor={c1} stopOpacity="0.08" />
          <stop offset="100%" stopColor={c1} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`line-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.65" />
          <stop offset="100%" stopColor={c1} stopOpacity="1" />
        </linearGradient>
        <filter id={`glow-${uid}`} x="-20%" y="-40%" width="140%" height="180%">
          <feGaussianBlur stdDeviation="3.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path d={area} fill={`url(#area-${uid})`} />
      {/* benchmark — soluk gri kesikli ikinci çizgi (S&P 500) */}
      {hasBench && (
        <path
          d={benchLine}
          fill="none"
          stroke="rgba(255,255,255,0.30)"
          strokeWidth="1.5"
          strokeDasharray="5 5"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      )}
      <path
        d={line}
        fill="none"
        stroke={`url(#line-${uid})`}
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        filter={`url(#glow-${uid})`}
      />
    </svg>
  );

  if (!hasBench) return svg;

  return (
    <div className="flex h-full w-full flex-col">
      <div className="min-h-0 flex-1">{svg}</div>
      <div className="mt-2 flex items-center gap-4 text-[11px] text-white/45">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-3.5 rounded-full" style={{ background: c1 }} />
          Portföy
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-3.5 rounded-full" style={{ background: "rgba(255,255,255,0.4)" }} />
          {benchmarkLabel}
        </span>
      </div>
    </div>
  );
}

/** Catmull-Rom → cubic bezier yumuşatma. */
function smoothPath(pts: [number, number][]): string {
  if (pts.length < 2) return "";
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

/** Mini sparkline — kar/zarar renkli + hafif gradyan dolgu. */
export function Sparkline({
  seed,
  up,
  width = 80,
  height = 28,
}: {
  seed: string;
  up: boolean;
  width?: number;
  height?: number;
}) {
  const uid = useId().replace(/:/g, "");
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) % 9973;
  const pts: number[] = [];
  for (let i = 0; i < 16; i++) {
    h = (h * 1103515245 + 12345) % 2147483648;
    pts.push((h % 100) / 100);
  }
  const trended = pts.map((p, i) => p * 0.5 + (up ? i : 15 - i) / 30);
  const min = Math.min(...trended);
  const max = Math.max(...trended);
  const range = max - min || 1;
  const X = (i: number) => (i / (trended.length - 1)) * width;
  const Y = (v: number) => height - ((v - min) / range) * (height - 3) - 1.5;
  const coords = trended.map((v, i) => [X(i), Y(v)] as [number, number]);
  const line = smoothPath(coords);
  const col = up ? "#3ecf8e" : "#ff5c5c";
  return (
    <svg
      width={width}
      height={height}
      className="overflow-visible"
      role="img"
      aria-label="Temsili trend göstergesi"
    >
      {/* Dürüstlük: bu mini-çizgi temsili bir trend yönü göstergesidir,
          birebir geçmiş fiyat serisi değildir (hover'da görünür). */}
      <title>Temsili trend göstergesi — birebir fiyat geçmişi değildir</title>
      <defs>
        <linearGradient id={`sl-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={col} stopOpacity="0.25" />
          <stop offset="100%" stopColor={col} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${width},${height} L0,${height} Z`} fill={`url(#sl-${uid})`} />
      <path d={line} fill="none" stroke={col} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Yeni nesil RADIAL GAUGE — gradyan ilerleme + glow + parlak uç noktası.
 */
export function RadialGauge({
  value,
  size = 132,
  stroke = 10,
  label,
  sublabel,
  tone = "white",
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
  sublabel?: string;
  tone?: "white" | "up" | "down";
}) {
  const uid = useId().replace(/:/g, "");
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const dash = (pct / 100) * c;
  const g =
    tone === "up"
      ? ["#3ecf8e", "#86f0c0"]
      : tone === "down"
        ? ["#ff5c5c", "#ff9d9d"]
        : [ACCENT, ACCENT_HI];
  // ilerleme ucunun açısı (uç nokta parlaması için)
  const ang = (pct / 100) * 2 * Math.PI - Math.PI / 2;
  const cx = size / 2 + r * Math.cos(ang);
  const cy = size / 2 + r * Math.sin(ang);

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={`rg-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={g[0]} />
            <stop offset="100%" stopColor={g[1]} />
          </linearGradient>
          <filter id={`rgglow-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#rg-${uid})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          filter={`url(#rgglow-${uid})`}
        />
        {pct > 1 && pct < 99 && <circle cx={cx} cy={cy} r={stroke / 2 + 1} fill={g[1]} />}
      </svg>
      {(label || sublabel) && (
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            {label && <p className="font-display text-2xl font-bold text-white tabular-nums">{label}</p>}
            {sublabel && <p className="mt-0.5 text-[11px] uppercase tracking-wide text-white/40">{sublabel}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Yeni nesil DONUT (allocation) — accent gradyan dilimler + glow + ince boşluk.
 * Her dilim mor-mavi → beyaz gradyanın farklı doygunluğunda; derinlikli görünür.
 */
export function MonoDonut({
  data,
  size = 168,
  stroke = 16,
}: {
  data: { pct: number; label?: string }[];
  size?: number;
  stroke?: number;
}) {
  const uid = useId().replace(/:/g, "");
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  // accent'ten beyaza kademeli renkli dilimler (cansız gri DEĞİL)
  const palette = [ACCENT_HI, ACCENT, "#8d97e6", "#6f7ad0", "#565fb0", "#414a90"];
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <filter id={`ddglow-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
        {data.map((d, i) => {
          const len = (d.pct / 100) * c;
          const gap = 3;
          const seg = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={palette[i % palette.length]}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${Math.max(0, len - gap)} ${c - len + gap}`}
              strokeDashoffset={-offset}
              filter={`url(#ddglow-${uid})`}
            />
          );
          offset += len;
          return seg;
        })}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-white/40">Varlık</p>
          <p className="font-display text-2xl font-bold text-white">{data.length}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Yeni nesil BAR/SÜTUN grafik — boş kartları (gelir/temettü/faiz) doldurmak için.
 * Gradyan dolgulu, yuvarlatılmış sütunlar + opsiyonel etiketler.
 */
export function BarChart({
  data,
  height = 150,
  highlightLast = false,
}: {
  data: { label?: string; value: number }[];
  height?: number;
  highlightLast?: boolean;
}) {
  const uid = useId().replace(/:/g, "");
  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex w-full items-end gap-1.5" style={{ height }}>
      {data.map((d, i) => {
        const hPct = Math.max(4, (d.value / max) * 100);
        const isLast = highlightLast && i === data.length - 1;
        return (
          <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1.5" style={{ height: "100%" }}>
            <div
              className="w-full rounded-t-md transition-all"
              style={{
                height: `${hPct}%`,
                background: isLast
                  ? `linear-gradient(180deg, ${ACCENT_HI}, ${ACCENT}88)`
                  : "linear-gradient(180deg, rgba(169,180,255,0.55), rgba(169,180,255,0.08))",
                boxShadow: isLast ? `0 0 12px ${ACCENT}66` : "none",
              }}
            />
            {d.label && <span className="text-[10px] text-white/35">{d.label}</span>}
          </div>
        );
      })}
      <svg width="0" height="0">
        <defs>
          <linearGradient id={`bar-${uid}`} />
        </defs>
      </svg>
    </div>
  );
}
