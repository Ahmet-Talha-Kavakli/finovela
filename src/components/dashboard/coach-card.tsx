"use client";

/**
 * Finovela Coach kartı — kullanıcının paper işlem geçmişini AI ile analiz eder.
 * Didit açık-tema (token renkler, Lucide ikon). /api/coach'a orders POST eder,
 * SSE (event: text / done) akışını okur, sonucu Markdown (tone="light") gösterir.
 * Streaming SSE parse mantığı chat-experience.tsx'ten basitleştirilerek alındı.
 */

import { useCallback, useMemo, useRef, useState } from "react";
import { Sparkles, RotateCcw } from "lucide-react";
import { Markdown } from "@/components/dashboard/markdown";
import { usePaper } from "@/lib/dashboard/use-portfolio";

const BLUE = "var(--ais-accent)";

type Phase = "idle" | "streaming" | "done" | "error";

/** Client tarafı hızlı metrik şeridi — AI'dan bağımsız anında görünsün. */
function useQuickMetrics() {
  const { orders } = usePaper();
  return useMemo(() => {
    if (orders.length === 0) {
      return { count: 0, winRate: null as number | null, topSymbol: null as string | null };
    }
    // FIFO ile kapatılan pozisyon kazanma oranı (sunucu mantığının hafif kopyası).
    const sorted = [...orders].sort((a, b) => a.ts - b.ts);
    const lots: Record<string, { shares: number; price: number }[]> = {};
    let wins = 0;
    let closed = 0;
    for (const o of sorted) {
      if (o.side === "BUY") {
        (lots[o.symbol] ??= []).push({ shares: o.shares, price: o.price });
      } else {
        let remaining = o.shares;
        const q = lots[o.symbol] ?? [];
        while (remaining > 1e-9 && q.length > 0) {
          const lot = q[0];
          const matched = Math.min(lot.shares, remaining);
          const pnl = matched * (o.price - lot.price);
          closed++;
          if (pnl > 0) wins++;
          lot.shares = +(lot.shares - matched).toFixed(6);
          remaining = +(remaining - matched).toFixed(6);
          if (lot.shares <= 1e-9) q.shift();
        }
      }
    }
    const bySymbol: Record<string, number> = {};
    for (const o of orders) bySymbol[o.symbol] = (bySymbol[o.symbol] ?? 0) + 1;
    const top = Object.entries(bySymbol).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    return {
      count: orders.length,
      winRate: closed > 0 ? wins / closed : null,
      topSymbol: top,
    };
  }, [orders]);
}

export function CoachCard() {
  const { orders } = usePaper();
  const [phase, setPhase] = useState<Phase>("idle");
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const quick = useQuickMetrics();
  const abortRef = useRef<AbortController | null>(null);

  const analyze = useCallback(async () => {
    if (orders.length === 0) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setPhase("streaming");
    setText("");
    setError("");

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orders }),
        signal: ctrl.signal,
      });

      if (!res.ok || !res.body) {
        let msg = "Analiz başlatılamadı. Tekrar dener misin?";
        try {
          const j = (await res.json()) as { error?: string };
          if (j?.error) msg = j.error;
        } catch {
          /* JSON değilse varsayılan mesaj */
        }
        setError(msg);
        setPhase("error");
        return;
      }

      // 0 işlem / boş veri → sunucu JSON döner (stream değil).
      const ctype = res.headers.get("content-type") ?? "";
      if (ctype.includes("application/json")) {
        const j = (await res.json()) as { message?: string };
        setText(j.message ?? "Henüz analiz edilecek işlem yok.");
        setPhase("done");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let full = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const chunks = buf.split("\n\n");
        buf = chunks.pop() ?? "";
        for (const chunk of chunks) {
          const ev = chunk.match(/^event: (.+)$/m)?.[1];
          const dataLine = chunk.split("\n").find((l) => l.startsWith("data: "))?.slice(6);
          if (!ev || !dataLine) continue;
          const data = JSON.parse(dataLine);
          if (ev === "text") {
            full += data.delta;
            setText(full);
          } else if (ev === "error") {
            setError(data.message ?? "Bir hata oluştu");
            setPhase("error");
          }
        }
      }
      setPhase((p) => (p === "error" ? p : "done"));
      window.dispatchEvent(new Event("vela:usage-changed"));
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return;
      setError("Bağlantı koptu. Tekrar dener misin?");
      setPhase("error");
    }
  }, [orders]);

  const hasOrders = orders.length > 0;
  const streaming = phase === "streaming";

  return (
    <section
      className="mt-8 rounded-2xl border p-6"
      style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}
    >
      {/* Başlık satırı */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span
            className="grid size-9 shrink-0 place-items-center rounded-xl"
            style={{ background: "var(--ais-accent-bg)", color: BLUE }}
          >
            <Sparkles size={18} />
          </span>
          <div>
            <h2 className="text-[16px] font-semibold text-[var(--ais-fg)]">Finovela Coach</h2>
            <p className="mt-0.5 text-[12.5px] text-[var(--ais-fg-muted)]">
              İşlem geçmişini analiz eden kişisel trading koçun.
            </p>
          </div>
        </div>

        {hasOrders && (
          <button
            onClick={analyze}
            disabled={streaming}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium text-white transition disabled:opacity-60"
            style={{ background: BLUE }}
          >
            {phase === "done" || phase === "error" ? (
              <RotateCcw size={15} />
            ) : (
              <Sparkles size={15} />
            )}
            {streaming
              ? "Analiz ediliyor…"
              : phase === "done" || phase === "error"
                ? "Tekrar analiz et"
                : "İşlemlerimi analiz et"}
          </button>
        )}
      </div>

      {/* Hızlı metrik şeridi (client'ta hesaplanır, AI'dan bağımsız) */}
      {hasOrders && (phase !== "idle") && (
        <div
          className="mt-5 grid grid-cols-3 gap-px overflow-hidden rounded-xl border"
          style={{ borderColor: "var(--ais-line)", background: "var(--ais-line)" }}
        >
          <QuickMetric label="İşlem sayısı" value={String(quick.count)} />
          <QuickMetric
            label="Kazanma oranı"
            value={quick.winRate == null ? "—" : `%${Math.round(quick.winRate * 100)}`}
          />
          <QuickMetric label="En çok işlem" value={quick.topSymbol ?? "—"} />
        </div>
      )}

      {/* İçerik */}
      <div className="mt-5">
        {!hasOrders ? (
          <p className="text-[13.5px] leading-relaxed text-[var(--ais-fg-muted)]">
            Birkaç paper işlem yap, sonra koçun seni analiz etsin.
          </p>
        ) : streaming && !text ? (
          <ShimmerLines />
        ) : phase === "error" && !text ? (
          <p className="text-[13.5px] text-[#d93025]">{error}</p>
        ) : text ? (
          <div className="text-[14px]">
            <Markdown text={text} tone="light" />
            {streaming && (
              <span className="ml-0.5 inline-block h-3.5 w-2 animate-pulse align-middle" style={{ background: BLUE }} />
            )}
          </div>
        ) : (
          <p className="text-[13.5px] leading-relaxed text-[var(--ais-fg-muted)]">
            İşlemlerini değerlendirip performans, davranış pattern&apos;leri ve somut tavsiyeler için
            yukarıdaki butona bas.
          </p>
        )}
      </div>
    </section>
  );
}

function QuickMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--ais-surface)] px-4 py-3">
      <p className="text-[11px] text-[var(--ais-fg-faint)]">{label}</p>
      <p className="num mt-1 text-[16px] font-medium tracking-tight text-[var(--ais-fg)]">{value}</p>
    </div>
  );
}

/** "Analiz ediliyor…" sırasında shimmer placeholder. */
function ShimmerLines() {
  return (
    <div className="space-y-2.5">
      {["92%", "78%", "85%", "60%"].map((w, i) => (
        <div
          key={i}
          className="h-3.5 animate-pulse rounded"
          style={{ width: w, background: "var(--ais-surface-2)" }}
        />
      ))}
    </div>
  );
}
