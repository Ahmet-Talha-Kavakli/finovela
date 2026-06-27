"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/dashboard/cinematic";
import { useLivePortfolio } from "@/lib/dashboard/use-portfolio";
import { fmtUsd } from "@/lib/dashboard/data";
import { Sparkles, ArrowRight, RefreshCw } from "lucide-react";

// Portföy boşken gösterilecek gerçek-dürüst özet (sahte TSLA/SOL önerileri DEĞİL).
const EMPTY_BRIEF = [
  "Portföyün şu an boş — ilk işlemini yaparak başlayabilirsin.",
  "Sanal $100.000 ile risksiz dene; Finovela her hamleni analiz eder.",
  "Bir hisse ya da kripto ara, Finovela'ya \"ne alayım?\" diye sor.",
];

/**
 * Proaktif AI günlük brifing — kullanıcının CANLI portföyüne göre Vela'nın
 * gerçek-zamanlı ürettiği aksiyon maddeleri (sabit metin değil).
 */
export function DailyBrief() {
  const { positions, summary, risk } = useLivePortfolio();
  const [lines, setLines] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    if (positions.length === 0) return;
    setLoading(true);
    try {
      const portfolio = [
        `Toplam değer: ${fmtUsd(summary.total)} · Nakit: ${fmtUsd(summary.cash)} · Risk: ${risk.score}/10 (${risk.label})`,
        ...positions.map(
          (p) =>
            `${p.symbol}: ${p.shares} adet, değer ${fmtUsd(p.value)}, K/Z ${p.plPct >= 0 ? "+" : ""}${p.plPct}%, bugün ${p.changePct >= 0 ? "+" : ""}${p.changePct}%`,
        ),
      ].join("\n");
      const res = await fetch("/api/daily-brief", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ portfolio }),
      });
      const d = (await res.json()) as { lines?: string[] };
      setLines(d.lines && d.lines.length ? d.lines : EMPTY_BRIEF);
    } catch {
      setLines(EMPTY_BRIEF);
    } finally {
      setLoading(false);
    }
  }

  // portföy yüklenince bir kez üret
  useEffect(() => {
    if (positions.length > 0 && lines === null && !loading) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positions.length]);

  // Boş portföyde sahte AI_BRIEFING yerine dürüst boş-durum metni göster.
  const shown = lines ?? (positions.length === 0 ? EMPTY_BRIEF : EMPTY_BRIEF);

  return (
    <GlassCard hover className="flex h-full flex-col">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--ais-accent)] shadow-[0_0_20px_rgba(37,103,255,0.3)]">
          <Sparkles size={16} className="text-white" />
        </span>
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--ais-fg-faint)]">
          Finovela&apos;nın günlük özeti
        </h2>
        <button
          onClick={load}
          disabled={loading}
          className="ml-auto grid h-7 w-7 place-items-center rounded-lg text-[var(--ais-fg-faint)] transition hover:bg-[var(--ais-surface-2)] hover:text-[var(--ais-fg)] disabled:opacity-40"
          aria-label="Yenile"
          title="Yeniden üret"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <ul className="mt-5 flex-1 space-y-4">
        {/* Asla boş kalmasın: yüklenirken statik brief'i soluk göster, AI gelince değiştir. */}
        {shown.map((line, i) => (
          <li
            key={i}
            className={`flex gap-2.5 text-sm leading-relaxed transition-opacity ${
              loading && lines === null ? "text-[var(--ais-fg-faint)]" : "text-[var(--ais-fg-muted)]"
            }`}
          >
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--ais-fg-faint)]" />
            {line}
          </li>
        ))}
        {loading && lines === null && (
          <li className="flex items-center gap-2 pt-1 text-xs text-[var(--ais-fg-faint)]">
            <span className="h-1 w-1 animate-pulse rounded-full bg-[var(--ais-fg-faint)]" />
            Finovela portföyünü analiz ediyor…
          </li>
        )}
      </ul>

      <Link
        href="/dashboard/chat"
        className="mt-5 flex items-center justify-center gap-2 rounded-full bg-[var(--ais-accent)] py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
      >
        Finovela&apos;ya soru sor
        <ArrowRight size={15} />
      </Link>
    </GlassCard>
  );
}
