"use client";

/**
 * Erken Uyarı Radarı — kullanıcının holdinglerini Vela Skoru'na göre tarar,
 * zayıf/riskli olanları (skor < 50) sen sormadan öne çıkarır. Rakiplerde yok:
 * proaktif, açıklamalı, tıkla-aksiyon-al.
 */

import Link from "next/link";
import { useMemo } from "react";
import { useLivePortfolio } from "@/lib/dashboard/use-portfolio";
import { computeVelaScore } from "@/lib/dashboard/vela-score";
import { GlassCard } from "@/components/dashboard/cinematic";
import { TickerBadge } from "@/components/dashboard/ticker-badge";
import { AlertTriangle, ShieldCheck, ChevronRight } from "lucide-react";

const DOWN = "#d93025";
const WARN = "#b8860b";
const UP = "#1f9d57";

function toneFor(score: number) {
  if (score >= 65) return UP;
  if (score >= 50) return WARN;
  return DOWN;
}

export function EarlyWarning() {
  const { positions } = useLivePortfolio();

  const scored = useMemo(() => {
    return positions
      .map((p) => {
        // Hafif skor: candle yok, ama changePct'yi momentum ipucu olarak kat.
        const base = computeVelaScore(p.symbol, { basePrice: p.price });
        // Günlük sert düşüş skoru aşağı çeker (erken sinyal).
        const adj = Math.max(
          0,
          Math.min(100, base.score + Math.max(-15, Math.min(10, p.changePct * 1.5))),
        );
        return { ...p, score: Math.round(adj), summary: base.summary };
      })
      .sort((a, b) => a.score - b.score);
  }, [positions]);

  const flagged = scored.filter((s) => s.score < 55);

  if (positions.length === 0) return null;

  return (
    <GlassCard hover>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {flagged.length > 0 ? (
            <AlertTriangle size={18} style={{ color: WARN }} />
          ) : (
            <ShieldCheck size={18} style={{ color: UP }} />
          )}
          <h2 className="font-display text-base font-bold text-[var(--ais-fg)]">Erken Uyarı Radarı</h2>
        </div>
        <span className="text-xs text-[var(--ais-fg-faint)]">{positions.length} varlık tarandı</span>
      </div>

      {flagged.length === 0 ? (
        <div className="flex items-center gap-3 rounded-2xl border border-[#1f9d57]/20 bg-[#1f9d57]/[0.06] p-4">
          <ShieldCheck size={20} style={{ color: UP }} />
          <div>
            <p className="text-sm font-semibold text-[var(--ais-fg)]">Portföyün sağlıklı görünüyor</p>
            <p className="text-xs text-[var(--ais-fg-muted)]">
              Hiçbir varlık zayıflık eşiğinin altında değil. Finovela izlemeye devam ediyor.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {flagged.slice(0, 4).map((s) => {
            const tone = toneFor(s.score);
            return (
              <Link
                key={s.symbol}
                href={`/dashboard/stock/${s.symbol}`}
                className="group flex items-center gap-3 rounded-2xl border border-[var(--ais-line-strong)] bg-[var(--ais-surface-2)] p-3 transition hover:border-[var(--ais-accent)] hover:bg-[var(--ais-surface-2)]"
              >
                <TickerBadge symbol={s.symbol} size={38} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-[var(--ais-fg)]">{s.symbol}</p>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{ background: `${tone}1f`, color: tone }}
                    >
                      Skor {s.score}
                    </span>
                  </div>
                  <p className="truncate text-xs text-[var(--ais-fg-muted)]">{s.summary}</p>
                </div>
                {/* mini skor çubuğu */}
                <div className="hidden w-20 shrink-0 sm:block">
                  <div className="h-1.5 overflow-hidden rounded-full bg-[var(--ais-surface-2)]">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${s.score}%`, background: tone }}
                    />
                  </div>
                </div>
                <ChevronRight
                  size={16}
                  className="shrink-0 text-[var(--ais-fg-faint)] transition group-hover:text-[var(--ais-fg)]"
                />
              </Link>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
}
