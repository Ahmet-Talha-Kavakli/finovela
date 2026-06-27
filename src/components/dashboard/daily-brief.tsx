"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/dashboard/cinematic";
import { useLivePortfolio } from "@/lib/dashboard/use-portfolio";
import { fmtUsd } from "@/lib/dashboard/data";
import { Sparkle, ArrowRight, ArrowsClockwise } from "@phosphor-icons/react";

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
        <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-white to-white/80 shadow-[0_0_20px_rgba(169,180,255,0.4)]">
          <Sparkle size={16} weight="fill" className="text-black" />
        </span>
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-white/45">
          Finovela&apos;nın günlük özeti
        </h2>
        <button
          onClick={load}
          disabled={loading}
          className="ml-auto grid h-7 w-7 place-items-center rounded-lg text-white/35 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
          aria-label="Yenile"
          title="Yeniden üret"
        >
          <ArrowsClockwise size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <ul className="mt-5 flex-1 space-y-4">
        {/* Asla boş kalmasın: yüklenirken statik brief'i soluk göster, AI gelince değiştir. */}
        {shown.map((line, i) => (
          <li
            key={i}
            className={`flex gap-2.5 text-sm leading-relaxed transition-opacity ${
              loading && lines === null ? "text-white/40" : "text-white/70"
            }`}
          >
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/50" />
            {line}
          </li>
        ))}
        {loading && lines === null && (
          <li className="flex items-center gap-2 pt-1 text-xs text-white/30">
            <span className="h-1 w-1 animate-pulse rounded-full bg-white/40" />
            Finovela portföyünü analiz ediyor…
          </li>
        )}
      </ul>

      <Link
        href="/dashboard/chat"
        className="mt-5 flex items-center justify-center gap-2 rounded-full bg-white py-2.5 text-sm font-semibold text-black transition hover:bg-white/90"
      >
        Finovela&apos;ya soru sor
        <ArrowRight size={15} weight="bold" />
      </Link>
    </GlassCard>
  );
}
