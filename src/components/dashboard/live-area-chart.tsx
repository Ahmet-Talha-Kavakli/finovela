"use client";

/**
 * Yaşayan alan grafiği — açılışta soldan sağa KENDİNİ ÇİZER, ardından uç noktada
 * sürekli nabız atan canlı bir ışık ucu kalır. Veri değişince yumuşak geçer.
 * Framer Motion ile pathLength animasyonu + sürekli devinen endpoint glow.
 */

import { useId, useMemo, useRef } from "react";
import { motion, useInView } from "framer-motion";

const ACCENT = "#2567ff";

/** Canlı dolan ilerleme halkası — mount'ta 0'dan değere akar + parlak uç. */
export function LiveGauge({
  value, // 0..100
  size = 132,
  stroke = 12,
  label,
  sublabel,
  color = ACCENT,
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
  sublabel?: string;
  color?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const pct = Math.max(0, Math.min(100, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <div ref={ref} className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={`lg-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#5e8dff" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
          <filter id={`lgglow-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--ais-surface-2)" strokeWidth={stroke} />
        <motion.circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={`url(#lg-${uid})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          filter={`url(#lgglow-${uid})`}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: inView ? c - (pct / 100) * c : c }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          {label && <p className="font-display text-2xl font-bold tabular-nums text-[var(--ais-fg)]">{label}</p>}
          {sublabel && <p className="text-[11px] text-[var(--ais-fg-faint)]">{sublabel}</p>}
        </div>
      </div>
    </div>
  );
}

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

export function LiveAreaChart({
  data,
  height = 260,
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
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, amount: 0.3 });
  const hasBench = !!benchmark && benchmark.length === data.length;

  const { line, area, benchLine, endX, endY, c1 } = useMemo(() => {
    const w = 800;
    const h = height;
    if (!data.length) return { line: "", area: "", benchLine: "", endX: 0, endY: 0, c1: "#1f9d57" };
    const vs = data.map((d) => d.v);
    const allVs = hasBench ? [...vs, ...benchmark!] : vs;
    const min = Math.min(...allVs);
    const max = Math.max(...allVs);
    const range = max - min || 1;
    const pad = range * 0.1;
    const x = (i: number) => (i / (data.length - 1)) * w;
    const y = (v: number) => h - ((v - min + pad) / (range + pad * 2)) * h;
    const pts = data.map((d, i) => [x(i), y(d.v)] as [number, number]);
    const ln = smoothPath(pts);
    return {
      line: ln,
      area: `${ln} L${w},${h} L0,${h} Z`,
      benchLine: hasBench
        ? smoothPath(benchmark!.map((v, i) => [x(i), y(v)] as [number, number]))
        : "",
      endX: pts[pts.length - 1][0],
      endY: pts[pts.length - 1][1],
      c1: positive ? "#1f9d57" : "#d93025",
    };
  }, [data, height, positive, hasBench, benchmark]);

  if (!data.length) return null;
  const w = 800;

  return (
    <div ref={ref} className="flex h-full w-full flex-col">
      <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className="min-h-0 w-full flex-1 overflow-visible">
        <defs>
          <linearGradient id={`la-area-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c1} stopOpacity="0.30" />
            <stop offset="55%" stopColor={c1} stopOpacity="0.08" />
            <stop offset="100%" stopColor={c1} stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`la-line-${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={ACCENT} stopOpacity="0.55" />
            <stop offset="60%" stopColor={ACCENT} stopOpacity="0.9" />
            <stop offset="100%" stopColor={c1} stopOpacity="1" />
          </linearGradient>
          <filter id={`la-glow-${uid}`} x="-20%" y="-60%" width="140%" height="220%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* alan — çizgiyle birlikte belirir */}
        <motion.path
          d={area}
          fill={`url(#la-area-${uid})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: inView ? 1 : 0 }}
          transition={{ duration: 0.9, delay: 0.5 }}
        />

        {/* benchmark — soluk gri kesikli ikinci çizgi (S&P 500) */}
        {hasBench && (
          <motion.path
            d={benchLine}
            fill="none"
            stroke="var(--ais-fg-faint)"
            strokeOpacity="0.5"
            strokeWidth="1.5"
            strokeDasharray="5 5"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: inView ? 1 : 0 }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          />
        )}

        {/* çizgi — soldan sağa kendini çizer */}
        <motion.path
          d={line}
          fill="none"
          stroke={`url(#la-line-${uid})`}
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          filter={`url(#la-glow-${uid})`}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: inView ? 1 : 0 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        />

        {/* canlı uç — sürekli nabız atan ışık ucu.
            initial+r sayı olarak verilir; aksi halde Framer 'r'yi ara karede
            undefined'a çözüp <circle r="undefined"> konsol hatası veriyordu. */}
        <motion.circle
          cx={endX}
          cy={endY}
          fill={c1}
          opacity="0.25"
          initial={{ r: 6, opacity: 0.35 }}
          animate={{ r: [6, 13, 6], opacity: [0.35, 0, 0.35] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
        />
        <motion.circle
          cx={endX}
          cy={endY}
          r="3.5"
          fill="var(--ais-surface)"
          initial={{ scale: 0 }}
          animate={{ scale: inView ? 1 : 0 }}
          transition={{ delay: 1.4, type: "spring", stiffness: 300 }}
        />
      </svg>

      {/* lejant — yalnızca benchmark verilince */}
      {hasBench && (
        <div className="mt-2 flex items-center gap-4 text-[11px] text-[var(--ais-fg-faint)]">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3.5 rounded-full" style={{ background: c1 }} />
            Portföy
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3.5 rounded-full" style={{ background: "var(--ais-line-strong)" }} />
            {benchmarkLabel}
          </span>
        </div>
      )}
    </div>
  );
}
