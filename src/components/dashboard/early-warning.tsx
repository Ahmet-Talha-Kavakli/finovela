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
import { Warning, ShieldCheck, CaretRight } from "@phosphor-icons/react";

const DOWN = "#ff5c5c";
const WARN = "#f5d77a";
const UP = "#3ecf8e";

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
            <Warning size={18} weight="fill" style={{ color: WARN }} />
          ) : (
            <ShieldCheck size={18} weight="fill" style={{ color: UP }} />
          )}
          <h2 className="font-display text-base font-bold text-white">Erken Uyarı Radarı</h2>
        </div>
        <span className="text-xs text-white/40">{positions.length} varlık tarandı</span>
      </div>

      {flagged.length === 0 ? (
        <div className="flex items-center gap-3 rounded-2xl border border-[#3ecf8e]/20 bg-[#3ecf8e]/[0.06] p-4">
          <ShieldCheck size={20} weight="fill" style={{ color: UP }} />
          <div>
            <p className="text-sm font-semibold text-white">Portföyün sağlıklı görünüyor</p>
            <p className="text-xs text-white/55">
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
                className="group flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 transition hover:border-white/12 hover:bg-white/[0.04]"
              >
                <TickerBadge symbol={s.symbol} size={38} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-white">{s.symbol}</p>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{ background: `${tone}1f`, color: tone }}
                    >
                      Skor {s.score}
                    </span>
                  </div>
                  <p className="truncate text-xs text-white/50">{s.summary}</p>
                </div>
                {/* mini skor çubuğu */}
                <div className="hidden w-20 shrink-0 sm:block">
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${s.score}%`, background: tone }}
                    />
                  </div>
                </div>
                <CaretRight
                  size={16}
                  className="shrink-0 text-white/25 transition group-hover:text-white/60"
                />
              </Link>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
}
