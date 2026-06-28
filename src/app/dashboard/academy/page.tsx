"use client";

/**
 * Finovela Academy — oyunlaştırılmış AI yatırım eğitimi (dashboard).
 * Sol: track + ders listesi (tamamlanan ✓). Sağ: seçili ders (içerik + quiz +
 * AI eğitmen). Üst: XP / seviye / streak şeridi.
 *
 * Tasarım dili: Didit açık-tema (kutusuz, ince-kenarlı, token renk, Lucide).
 * İçerik academy-content.ts'ten; ilerleme use-academy store'da (localStorage).
 */

import { useMemo, useState } from "react";
import { Topbar } from "@/components/dashboard/topbar";
import { AcademyLesson } from "@/components/dashboard/academy-lesson";
import { useAcademy } from "@/lib/dashboard/use-academy";
import {
  ACADEMY_TRACKS,
  academyTotals,
  lessonId,
  type Track,
} from "@/lib/dashboard/academy-content";
import {
  GraduationCap,
  Sparkles,
  TrendingUp,
  Layers,
  Coins,
  Scale,
  BookOpen,
  CheckCircle2,
  Flame,
  Star,
  Trophy,
} from "lucide-react";

const ACCENT = "var(--ais-accent)";
const GREEN = "var(--ais-green)";

// Track iconKey → Lucide ikon.
const TRACK_ICON: Record<Track["iconKey"], typeof BookOpen> = {
  intro: BookOpen,
  ai: Sparkles,
  markets: TrendingUp,
  options: Layers,
  crypto: Coins,
  tax: Scale,
};

export default function AcademyPage() {
  const totals = useMemo(() => academyTotals(), []);
  const { xp, level, progress, streak, completed, isDone } = useAcademy();

  // Seçili track + ders
  const [trackSlug, setTrackSlug] = useState(ACADEMY_TRACKS[0].slug);
  const track = ACADEMY_TRACKS.find((t) => t.slug === trackSlug) ?? ACADEMY_TRACKS[0];
  const [lessonSlug, setLessonSlug] = useState(track.lessons[0].slug);
  const lesson = track.lessons.find((l) => l.slug === lessonSlug) ?? track.lessons[0];

  const doneCount = completed.length;
  const overallPct = Math.round((doneCount / totals.lessons) * 100);

  function selectTrack(slug: string) {
    setTrackSlug(slug);
    const t = ACADEMY_TRACKS.find((x) => x.slug === slug);
    if (t) setLessonSlug(t.lessons[0].slug);
  }

  return (
    <>
      <Topbar title="Akademi" />
      <div className="ais ais-light min-h-[calc(100vh-64px)]">
        <div className="mx-auto max-w-6xl px-8 py-10">
          {/* ───────── Başlık + oyunlaştırma şeridi ───────── */}
          <div className="flex items-center gap-3">
            <div
              className="grid h-11 w-11 place-items-center rounded-2xl text-white"
              style={{ background: ACCENT }}
            >
              <GraduationCap size={22} />
            </div>
            <div>
              <h1 className="d-title">Finovela Akademi</h1>
              <p className="d-subtitle mt-1">
                Öğren, sanal portföyde dene, ustalaş — AI eğitmenin yanında.
              </p>
            </div>
          </div>

          {/* Oyunlaştırma metrikleri — kutusuz ızgara-ayraçlı şerit */}
          <div
            className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border sm:grid-cols-4"
            style={{ borderColor: "var(--ais-line)", background: "var(--ais-line)" }}
          >
            <Metric icon={Star} label="Seviye" value={`${level}`} sub={`${progress.inLevel}/${progress.toNext} XP`} />
            <Metric icon={Trophy} label="Toplam XP" value={`${xp}`} accent />
            <Metric
              icon={CheckCircle2}
              label="Tamamlanan"
              value={`${doneCount}/${totals.lessons}`}
              sub={`%${overallPct}`}
              green
            />
            <Metric icon={Flame} label="Seri" value={`${streak} gün`} />
          </div>

          {/* Seviye ilerleme çubuğu */}
          <div className="mt-5">
            <div className="flex items-center justify-between text-[12px] text-[var(--ais-fg-muted)]">
              <span>Seviye {level}</span>
              <span>Seviye {level + 1}</span>
            </div>
            <div
              className="mt-2 h-2 w-full overflow-hidden rounded-full"
              style={{ background: "var(--ais-surface-2)" }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${progress.pct}%`, background: ACCENT }}
              />
            </div>
          </div>

          {/* ───────── İçerik: track listesi + ders ───────── */}
          <div className="mt-10 grid gap-8 lg:grid-cols-[280px_1fr]">
            {/* Sol: track + ders navigasyonu */}
            <aside className="lg:sticky lg:top-4 lg:self-start">
              <div className="flex flex-col gap-1.5">
                {ACADEMY_TRACKS.map((t) => {
                  const Icon = TRACK_ICON[t.iconKey];
                  const active = t.slug === trackSlug;
                  const tDone = t.lessons.filter((l) => isDone(lessonId(t.slug, l.slug))).length;
                  const tAll = t.lessons.length;
                  return (
                    <button
                      key={t.slug}
                      onClick={() => selectTrack(t.slug)}
                      className="flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition"
                      style={{
                        borderColor: active ? ACCENT : "var(--ais-line)",
                        background: active ? "var(--ais-accent-bg, rgba(37,103,255,0.06))" : "var(--ais-surface)",
                      }}
                    >
                      <Icon size={18} style={{ color: active ? ACCENT : "var(--ais-fg-muted)" }} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] font-medium text-[var(--ais-fg)]">
                          {t.name}
                        </span>
                        <span className="block text-[11.5px] text-[var(--ais-fg-muted)]">
                          {t.level} · {tDone}/{tAll} ders
                        </span>
                      </span>
                      {tDone === tAll && tAll > 0 && (
                        <CheckCircle2 size={15} style={{ color: GREEN }} />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Seçili track'in dersleri */}
              <div className="mt-5 border-t pt-4" style={{ borderColor: "var(--ais-line)" }}>
                <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--ais-fg-muted)]">
                  {track.name} dersleri
                </p>
                <div className="mt-2 flex flex-col gap-0.5">
                  {track.lessons.map((l, i) => {
                    const lDone = isDone(lessonId(track.slug, l.slug));
                    const active = l.slug === lessonSlug;
                    return (
                      <button
                        key={l.slug}
                        onClick={() => setLessonSlug(l.slug)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] transition"
                        style={{
                          background: active ? "var(--ais-surface-2)" : "transparent",
                          color: active ? "var(--ais-fg)" : "var(--ais-fg-muted)",
                          fontWeight: active ? 600 : 400,
                        }}
                      >
                        {lDone ? (
                          <CheckCircle2 size={15} style={{ color: GREEN }} className="shrink-0" />
                        ) : (
                          <span
                            className="grid h-[15px] w-[15px] shrink-0 place-items-center rounded-full border text-[9px]"
                            style={{ borderColor: "var(--ais-line)" }}
                          >
                            {i + 1}
                          </span>
                        )}
                        <span className="truncate">{l.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </aside>

            {/* Sağ: seçili ders */}
            <main className="min-w-0">
              <AcademyLesson key={lessonId(track.slug, lesson.slug)} trackSlug={track.slug} lesson={lesson} />
            </main>
          </div>
        </div>
      </div>
    </>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  sub,
  accent,
  green,
}: {
  icon: typeof Star;
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  green?: boolean;
}) {
  const color = green ? "var(--ais-green)" : accent ? "var(--ais-accent)" : "var(--ais-fg)";
  return (
    <div className="bg-[var(--ais-surface)] px-5 py-4">
      <div className="flex items-center gap-1.5 text-[12px] text-[var(--ais-fg-muted)]">
        <Icon size={14} /> {label}
      </div>
      <div className="mt-1.5 flex items-baseline gap-2">
        <span className="text-[22px] font-semibold tracking-[-0.02em]" style={{ color }}>
          {value}
        </span>
        {sub && <span className="text-[12px] text-[var(--ais-fg-muted)]">{sub}</span>}
      </div>
    </div>
  );
}
