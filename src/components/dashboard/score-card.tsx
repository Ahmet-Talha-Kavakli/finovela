"use client";

// Sohbet içi Vela Skoru kartı — get_vela_score tool sonucu.
// Skor gauge (halka) + harf notu + faktör kırılımı barları. Koyu tema.

const UP = "#3ecf8e";
const DOWN = "#ff5c5c";
const NEUTRAL = "#8ab4f8";

type ScoreFactor = { key: string; label: string; value: number; weight: number };

export type VelaScoreData = {
  symbol: string;
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  label: string;
  factors: ScoreFactor[];
  summary?: string;
};

function scoreColor(v: number): string {
  if (v >= 65) return UP;
  if (v >= 50) return NEUTRAL;
  if (v >= 35) return "#fdd663";
  return DOWN;
}

export function ScoreCard({ s }: { s: VelaScoreData }) {
  const color = scoreColor(s.score);
  const R = 30;
  const C = 2 * Math.PI * R;
  const dash = (s.score / 100) * C;

  return (
    <div className="max-w-md rounded-3xl border border-white/[0.1] bg-white/[0.04] p-4">
      <p className="text-xs uppercase tracking-wide text-white/40">Finovela Skoru · {s.symbol}</p>

      <div className="mt-3 flex items-center gap-4">
        {/* Gauge halkası */}
        <div className="relative grid h-[76px] w-[76px] shrink-0 place-items-center">
          <svg width="76" height="76" className="-rotate-90">
            <circle cx="38" cy="38" r={R} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
            <circle
              cx="38"
              cy="38"
              r={R}
              fill="none"
              stroke={color}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${C}`}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="font-display text-xl font-bold leading-none text-white tabular-nums">{s.score}</span>
            <span className="text-[10px] text-white/40">/100</span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className="grid h-7 w-7 place-items-center rounded-lg text-sm font-bold"
              style={{ background: `${color}26`, color }}
            >
              {s.grade}
            </span>
            <span className="text-sm font-semibold text-white">{s.label}</span>
          </div>
          {s.summary && <p className="mt-1.5 text-[12px] leading-relaxed text-white/55">{s.summary}</p>}
        </div>
      </div>

      {/* Faktör kırılımı */}
      <div className="mt-3 space-y-2">
        {s.factors.map((f) => {
          const fc = scoreColor(f.value);
          return (
            <div key={f.key}>
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-white/55">
                  {f.label} <span className="text-white/30">· %{Math.round(f.weight * 100)}</span>
                </span>
                <span className="font-semibold tabular-nums" style={{ color: fc }}>{f.value}</span>
              </div>
              <div className="relative mt-1 h-1.5 rounded-full bg-white/10">
                <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${f.value}%`, background: fc }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
