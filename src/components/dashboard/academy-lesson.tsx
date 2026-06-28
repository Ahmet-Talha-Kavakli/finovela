"use client";

/**
 * AcademyLesson — seçili dersi gösterir: markdown içerik + ders sonu mini quiz +
 * "Finovela'ya sor" (AI eğitmen, ders bağlamında SSE stream). Quiz doğru
 * cevaplanınca ders tamamlanır (XP eklenir, academyStore).
 *
 * Tasarım dili: Didit açık-tema (token renkler, kutusuz/ince-kenarlı, Lucide).
 */

import { useRef, useState } from "react";
import { Markdown } from "@/components/dashboard/markdown";
import { academyStore, useAcademy } from "@/lib/dashboard/use-academy";
import { lessonId, type Lesson } from "@/lib/dashboard/academy-content";
import {
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  Send,
  Award,
  Lightbulb,
} from "lucide-react";

const GREEN = "var(--ais-green)";
const RED = "#d93025";
const ACCENT = "var(--ais-accent)";

export function AcademyLesson({
  trackSlug,
  lesson,
}: {
  trackSlug: string;
  lesson: Lesson;
}) {
  const id = lessonId(trackSlug, lesson.slug);
  const { isDone } = useAcademy();
  const done = isDone(id);

  // Quiz durumu
  const [picked, setPicked] = useState<number | null>(null);
  const correctIdx = lesson.quiz.options.findIndex((o) => o.correct);
  const answered = picked !== null;
  const isCorrect = answered && lesson.quiz.options[picked]?.correct;

  // AI eğitmen
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiErr, setAiErr] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  function pick(i: number) {
    if (answered) return; // tek deneme
    setPicked(i);
    if (lesson.quiz.options[i]?.correct && !done) {
      academyStore.completeLesson(id, lesson.xp);
    }
  }

  async function askTutor(e?: React.FormEvent) {
    e?.preventDefault();
    const question = q.trim();
    if (!question || loading) return;
    setLoading(true);
    setAiErr(null);
    setAnswer("");
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      const res = await fetch("/api/academy-tutor", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          lessonTitle: lesson.title,
          lessonBody: lesson.body,
          question,
        }),
        signal: ac.signal,
      });
      if (res.status === 402) {
        setAiErr("Günlük AI hakkın doldu. Sınırsız öğrenme için Pro'ya yükselt.");
        setLoading(false);
        return;
      }
      if (!res.ok || !res.body) {
        setAiErr("Bir hata oluştu, tekrar dene.");
        setLoading(false);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      // Basit SSE parse (event/data satırları).
      while (true) {
        const { done: rdone, value } = await reader.read();
        if (rdone) break;
        buf += decoder.decode(value, { stream: true });
        const chunks = buf.split("\n\n");
        buf = chunks.pop() ?? "";
        for (const c of chunks) {
          const ev = /event: (\w+)/.exec(c)?.[1];
          const dataLine = /data: ([\s\S]*)/.exec(c)?.[1];
          if (!dataLine) continue;
          try {
            const data = JSON.parse(dataLine);
            if (ev === "text" && data.delta) setAnswer((p) => p + data.delta);
            if (ev === "error") setAiErr(data.message ?? "Hata");
          } catch {
            /* parça tamam değil */
          }
        }
      }
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        setAiErr("Bağlantı hatası, tekrar dene.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ais ais-light">
      {/* Başlık şeridi */}
      <div className="flex items-center gap-3">
        {done ? (
          <CheckCircle2 size={22} style={{ color: GREEN }} />
        ) : (
          <Circle size={22} style={{ color: "var(--ais-fg-faint)" }} />
        )}
        <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-[var(--ais-fg)]">
          {lesson.title}
        </h2>
      </div>
      <div className="mt-2 flex items-center gap-4 text-[12.5px] text-[var(--ais-fg-muted)]">
        <span className="inline-flex items-center gap-1.5">
          <Clock size={14} /> {lesson.minutes} dk
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Award size={14} style={{ color: ACCENT }} /> {lesson.xp} XP
        </span>
        {done && (
          <span className="inline-flex items-center gap-1.5 font-medium" style={{ color: GREEN }}>
            <CheckCircle2 size={14} /> Tamamlandı
          </span>
        )}
      </div>

      {/* İçerik */}
      <div className="mt-6">
        <Markdown text={lesson.body} tone="light" />
      </div>

      {/* Uygula köprüsü */}
      {lesson.applyHint && (
        <div
          className="mt-6 flex items-start gap-2.5 rounded-xl border p-4"
          style={{ borderColor: "var(--ais-line)", background: "var(--ais-accent-bg, rgba(37,103,255,0.06))" }}
        >
          <Lightbulb size={18} style={{ color: ACCENT }} className="mt-0.5 shrink-0" />
          <p className="text-[13.5px] leading-relaxed text-[var(--ais-fg)]">
            <span className="font-semibold">Hemen dene:</span> {lesson.applyHint}
          </p>
        </div>
      )}

      {/* ───── Mini Quiz ───── */}
      <section className="mt-10 border-t pt-8" style={{ borderColor: "var(--ais-line)" }}>
        <h3 className="text-[13px] font-semibold uppercase tracking-wide text-[var(--ais-fg-muted)]">
          Mini Quiz
        </h3>
        <p className="mt-3 text-[15px] font-medium text-[var(--ais-fg)]">{lesson.quiz.question}</p>
        <div className="mt-4 flex flex-col gap-2.5">
          {lesson.quiz.options.map((opt, i) => {
            const showCorrect = answered && i === correctIdx;
            const showWrong = answered && i === picked && !opt.correct;
            return (
              <button
                key={i}
                onClick={() => pick(i)}
                disabled={answered}
                className="flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-[14px] transition disabled:cursor-default"
                style={{
                  borderColor: showCorrect ? GREEN : showWrong ? RED : "var(--ais-line)",
                  background: showCorrect
                    ? "rgba(22,163,74,0.08)"
                    : showWrong
                      ? "rgba(217,48,37,0.06)"
                      : "var(--ais-surface)",
                  color: "var(--ais-fg)",
                }}
              >
                <span
                  className="grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[11px] font-semibold"
                  style={{
                    borderColor: showCorrect ? GREEN : showWrong ? RED : "var(--ais-line)",
                    color: showCorrect ? GREEN : showWrong ? RED : "var(--ais-fg-muted)",
                  }}
                >
                  {showCorrect ? "✓" : showWrong ? "✕" : String.fromCharCode(65 + i)}
                </span>
                {opt.text}
              </button>
            );
          })}
        </div>
        {answered && (
          <div
            className="mt-4 rounded-xl border p-4 text-[13.5px] leading-relaxed"
            style={{
              borderColor: "var(--ais-line)",
              background: "var(--ais-surface-2)",
              color: "var(--ais-fg)",
            }}
          >
            <span className="font-semibold" style={{ color: isCorrect ? GREEN : RED }}>
              {isCorrect ? "Doğru! " : "Tekrar bak. "}
            </span>
            {lesson.quiz.explain}
          </div>
        )}
      </section>

      {/* ───── AI Eğitmen ───── */}
      <section className="mt-10 border-t pt-8" style={{ borderColor: "var(--ais-line)" }}>
        <h3 className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-[var(--ais-fg-muted)]">
          <Sparkles size={15} style={{ color: ACCENT }} /> Bu ders hakkında Finovela&apos;ya sor
        </h3>
        <form onSubmit={askTutor} className="mt-4 flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Anlamadığın bir yeri sor…"
            className="h-11 flex-1 rounded-full border px-4 text-[14px] outline-none transition focus:border-[var(--ais-accent)]"
            style={{
              borderColor: "var(--ais-line)",
              background: "var(--ais-surface)",
              color: "var(--ais-fg)",
            }}
          />
          <button
            type="submit"
            disabled={loading || !q.trim()}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-white transition disabled:opacity-40"
            style={{ background: ACCENT }}
            aria-label="Sor"
          >
            <Send size={17} />
          </button>
        </form>

        {(answer || loading || aiErr) && (
          <div
            className="mt-4 rounded-xl border p-4"
            style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}
          >
            {aiErr ? (
              <p className="text-[13.5px]" style={{ color: RED }}>
                {aiErr}
              </p>
            ) : answer ? (
              <Markdown text={answer} tone="light" />
            ) : (
              <p className="text-[13.5px] text-[var(--ais-fg-muted)]">Finovela düşünüyor…</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
