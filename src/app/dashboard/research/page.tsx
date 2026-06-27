"use client";

/**
 * Finovela Araştırma — AI araştırma promtu + haber/sentiment + bilanço + analist + radar.
 * Tasarım dili: Didit (business.didit.me) — açık tema, kutusuz, border-t ayraçlı
 * bölümler, ince-kenarlı satırlar, token renkleri. Beyaz-sabit renk YOK.
 */

import { useCallback, useRef, useState } from "react";
import { Topbar } from "@/components/dashboard/topbar";
import { Delta, TickerBadge } from "@/components/dashboard/ui";
import { Markdown } from "@/components/dashboard/markdown";
import { EARNINGS } from "@/lib/dashboard/data";
import { usePaper } from "@/lib/dashboard/use-portfolio";
import { getUniverseEntry } from "@/lib/market/universe";
import {
  sentimentScore,
  analystConsensus,
  newsSentiment,
  type SentimentLabel,
} from "@/lib/dashboard/sentiment";
import { Sparkles, Newspaper, Star, Activity, Calendar, ArrowUp } from "lucide-react";

// Didit açık-tema renkleri — beyaz zeminde okunur.
const UP = "var(--ais-green)";
const DOWN = "#d93025";

// title: ekranda gösterilen TR başlık. enTitle: sentiment hesaplaması için
// orijinal İngilizce metin (newsSentiment İngilizce anahtar kelimelere bakıyor).
const NEWS = [
  { sym: "NVDA", title: "Nvidia, veri merkezi talebi sıcak kalırken yapay zeka liderliğini genişletiyor", enTitle: "Nvidia extends AI lead as data-center demand stays hot", time: "1sa" },
  { sym: "AAPL", title: "Apple, bilanço öncesi cihaz üstü yapay zeka özelliklerini tanıttı", enTitle: "Apple unveils on-device AI features ahead of earnings", time: "3sa" },
  { sym: "TSLA", title: "Analistler Tesla teslimat tahminlerini düşürdü", enTitle: "Tesla delivery estimates trimmed by analysts", time: "5sa" },
  { sym: "BTC", title: "Bitcoin ETF girişleri yeni bir haftalık rekora ulaştı", enTitle: "Bitcoin ETF inflows hit a new weekly record", time: "6sa" },
  { sym: "MSFT", title: "Microsoft bulut büyümesinin 4. çeyreğe doğru hızlanacağı öngörülüyor", enTitle: "Microsoft cloud growth seen accelerating into Q4", time: "8sa" },
];

// Analist konsensüs widget'ı için izlenen semboller (deterministik veriden).
const ANALYST_SYMBOLS = ["NVDA", "AAPL", "TSLA", "MSFT"];
// Sentiment paneli için varsayılan semboller — portföy boşsa bunlara düşülür.
const SENTIMENT_FALLBACK = ["NVDA", "AAPL", "TSLA", "META", "AMD"];

const sentColor = { positive: UP, negative: DOWN, neutral: "var(--ais-fg-muted)" } as const;
// Haber sentiment etiketinin TR gösterimi (mantık değeri değişmiyor).
const sentLabelTr = { positive: "Olumlu", negative: "Olumsuz", neutral: "Nötr" } as const;
const labelColor: Record<SentimentLabel, string> = {
  Bullish: UP,
  Bearish: DOWN,
  Neutral: "var(--ais-fg-muted)",
};
// Sentiment etiketinin TR gösterimi (logic değeri korunur).
const labelTr: Record<SentimentLabel, string> = {
  Bullish: "Yükseliş",
  Bearish: "Düşüş",
  Neutral: "Nötr",
};
// Analist derecesinin TR gösterimi (logic değeri korunur).
const ratingTr: Record<string, string> = {
  "Strong Buy": "Güçlü Al",
  Buy: "Al",
  Hold: "Tut",
  Sell: "Sat",
};

// EARNINGS verisinin (paylaşılan, İngilizce) gösterim çevirileri — logic değişmez.
const EARNINGS_DAY_TR: Record<string, string> = {
  Mon: "Pzt", Tue: "Sal", Wed: "Çar", Thu: "Per", Fri: "Cum",
  Reported: "Raporlandı",
};
function earningsDayTr(s: string): string {
  return EARNINGS_DAY_TR[s] ?? s;
}
function earningsTimeTr(s: string): string {
  if (s === "After close") return "Kapanıştan sonra";
  if (s === "Before open") return "Açılıştan önce";
  const beat = s.match(/^Beat by (.+)$/);
  if (beat) return `%${beat[1].replace("%", "")} aştı`;
  return s;
}

const SUGGESTIONS = [
  "Analistler NVDA hakkında ne diyor?",
  "TSLA ile RIVN'i karşılaştır",
  "Palantir için yükseliş ve düşüş senaryosu",
  "Apple'ın son bilanço görüşmesini özetle",
];

export default function ResearchPage() {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [asked, setAsked] = useState(false);
  const rafRef = useRef(0);
  const pendingRef = useRef("");

  // Duyarlılık radarı kullanıcının gerçek portföyüne bağlı — holdings'ten ilk 5
  // sembol; portföy boşsa varsayılan listeye düşülür.
  const paper = usePaper();
  const portfolioSyms = paper.holdings.map((h) => h.symbol).slice(0, 5);
  const sentimentSymbols = portfolioSyms.length ? portfolioSyms : SENTIMENT_FALLBACK;

  // Hafif SSE okuyucu — chat-experience'taki rAF batching'in sade hâli.
  const ask = useCallback(async (text: string) => {
    if (!text.trim() || busy) return;
    setBusy(true);
    setAsked(true);
    setAnswer("");
    setQuery("");
    pendingRef.current = "";

    const flush = () => {
      rafRef.current = 0;
      if (!pendingRef.current) return;
      const add = pendingRef.current;
      pendingRef.current = "";
      setAnswer((a) => a + add);
    };
    const queueText = (delta: string) => {
      pendingRef.current += delta;
      if (!rafRef.current) rafRef.current = requestAnimationFrame(flush);
    };

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Sen Finovela'nın hisse senedi araştırma asistanısın. Bu araştırma sorusunu Türkçe ve özlü bir şekilde markdown ile yanıtla (başlıklar, maddeler, faydalıysa bir tablo): ${text}`,
            },
          ],
          locale: "Turkish",
        }),
      });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({}));
        setAnswer(
          err?.error === "ANTHROPIC_API_KEY missing"
            ? "Yapay zeka yapılandırılmadı — araştırma yanıtlarını etkinleştirmek için ANTHROPIC_API_KEY ekleyin."
            : "Finovela araştırmaya ulaşılamadı. Lütfen tekrar deneyin.",
        );
        setBusy(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
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
          try {
            const data = JSON.parse(dataLine);
            if (ev === "text") queueText(data.delta);
            else if (ev === "error") setAnswer((a) => a || `Hata: ${data.message}`);
          } catch {
            /* parça parçalı JSON — yoksay */
          }
        }
      }
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      flush();
    } catch {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      flush();
      setAnswer((a) => a || "Bağlantı koptu. Lütfen tekrar deneyin.");
    } finally {
      setBusy(false);
    }
  }, [busy]);

  return (
    <>
      <Topbar title="Araştırma" />
      <div className="ais ais-light min-h-[calc(100vh-64px)]">
        <div className="mx-auto max-w-5xl px-8 py-10">
          {/* ───────── Başlık ───────── */}
          <div>
            <h1 className="d-title">Araştırma</h1>
            <p className="d-subtitle mt-2 max-w-2xl leading-relaxed">
              Finovela&apos;ya bir hisse veya tema sor; haberleri, bilançoları, analist konsensüsünü
              ve duyarlılığı tek yerde gör.
            </p>
          </div>

          {/* ───────── AI araştırma promtu — gerçek /api/chat akışına bağlı ───────── */}
          <section className="mt-10 border-t pt-8" style={{ borderColor: "var(--ais-line)" }}>
            <div className="mb-5 flex items-center gap-2">
              <h2 className="d-section">Finovela araştırmaya sor</h2>
              <Sparkles size={16} className="text-[var(--ais-accent)]" />
            </div>

            <div className="flex items-center gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); ask(query); }
                }}
                placeholder="Apple'ın son bilanço görüşmesini özetle…"
                className="ais-input flex-1"
              />
              <button
                onClick={() => ask(query)}
                disabled={!query.trim() || busy}
                className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-4 text-[13px] font-medium text-[var(--ais-accent)] transition disabled:opacity-40"
                style={{ background: "var(--ais-accent-bg)" }}
              >
                <ArrowUp size={15} />
                {busy ? "Düşünüyor…" : "Sor"}
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {SUGGESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => ask(q)}
                  disabled={busy}
                  className="rounded-lg border px-3 py-1 text-[12px] text-[var(--ais-fg-muted)] transition hover:bg-[var(--ais-surface-2)] disabled:opacity-40"
                  style={{ borderColor: "var(--ais-line-strong)" }}
                >
                  {q}
                </button>
              ))}
            </div>

            {asked && (
              <div className="mt-4 rounded-xl border p-4" style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}>
                {answer ? (
                  <Markdown text={answer} tone="light" />
                ) : (
                  <span className="inline-flex gap-1">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--ais-fg-muted)]" />
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--ais-fg-muted)] [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--ais-fg-muted)] [animation-delay:300ms]" />
                  </span>
                )}
              </div>
            )}
          </section>

          {/* ───────── Haberler + bilançolar ───────── */}
          <section className="mt-10 border-t pt-8" style={{ borderColor: "var(--ais-line)" }}>
            <div className="grid gap-8 lg:grid-cols-3">
              {/* haber + sentiment */}
              <div className="lg:col-span-2">
                <div className="mb-4 flex items-center gap-2">
                  <h2 className="d-section">Haberler ve duyarlılık</h2>
                  <Newspaper size={15} className="text-[var(--ais-fg-faint)]" />
                </div>
                <div className="rounded-xl border" style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}>
                  {NEWS.map((n, i) => {
                    const sent = newsSentiment(n.enTitle);
                    return (
                      <div
                        key={n.title}
                        className="flex items-start gap-3 px-4 py-3.5 transition hover:bg-[var(--ais-surface-2)]"
                        style={{ borderTop: i === 0 ? "none" : "1px solid var(--ais-line)" }}
                      >
                        <TickerBadge symbol={n.sym} size={32} />
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-medium text-[var(--ais-fg)]">{n.title}</p>
                          <div className="mt-1 flex items-center gap-2 text-[12px]">
                            <span
                              className="rounded-full px-2 py-0.5 font-medium"
                              style={{ background: `${sentColor[sent]}1f`, color: sentColor[sent] }}
                            >
                              {sentLabelTr[sent]}
                            </span>
                            <span className="text-[var(--ais-fg-faint)]">{n.time} önce</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* earnings takvimi */}
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <h2 className="d-section">Bu haftaki bilançolar</h2>
                  <Calendar size={15} className="text-[var(--ais-fg-faint)]" />
                </div>
                <div className="space-y-2">
                  {EARNINGS.map((e) => (
                    <div
                      key={e.symbol}
                      className="flex items-center gap-3 rounded-xl border p-3"
                      style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}
                    >
                      <TickerBadge symbol={e.symbol} size={32} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-[var(--ais-fg)]">{e.symbol}</p>
                        <p className="truncate text-[12px] text-[var(--ais-fg-muted)]">{earningsTimeTr(e.time)}</p>
                      </div>
                      {e.status === "beat" ? (
                        <span
                          className="rounded-full px-2.5 py-1 text-[11px] font-medium"
                          style={{ background: "var(--ais-green-bg)", color: UP }}
                        >
                          Aştı
                        </span>
                      ) : (
                        <span className="num text-[13px] font-medium text-[var(--ais-fg)]">{earningsDayTr(e.date)}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ───────── Analist + sentiment radar ───────── */}
          <section className="mt-10 border-t pt-8" style={{ borderColor: "var(--ais-line)" }}>
            <div className="grid gap-8 lg:grid-cols-2">
              {/* analist konsensüsü */}
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <h2 className="d-section">Analist konsensüsü</h2>
                  <Star size={15} className="text-[var(--ais-fg-faint)]" />
                </div>
                <div className="rounded-xl border" style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}>
                  {ANALYST_SYMBOLS.map((sym, i) => {
                    const c = analystConsensus(sym, getUniverseEntry(sym).basePrice);
                    const buyPct = Math.round((c.buy / c.total) * 100);
                    const holdPct = Math.round((c.hold / c.total) * 100);
                    const sellPct = 100 - buyPct - holdPct;
                    return (
                      <div
                        key={sym}
                        className="px-4 py-3"
                        style={{ borderTop: i === 0 ? "none" : "1px solid var(--ais-line)" }}
                      >
                        <div className="flex items-center gap-3">
                          <TickerBadge symbol={sym} size={32} />
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-medium text-[var(--ais-fg)]">{sym}</p>
                            <p className="truncate text-[12px] text-[var(--ais-fg-muted)]">{ratingTr[c.rating] ?? c.rating} · {c.total} analist</p>
                          </div>
                          <div className="text-right">
                            <p className="num text-[13px] text-[var(--ais-fg-muted)]">Hedef ${c.target}</p>
                            <Delta value={c.upsidePct} className="text-[12px]" />
                          </div>
                        </div>
                        {/* buy/hold/sell çubuğu */}
                        <div className="mt-2 flex h-1.5 overflow-hidden rounded-full">
                          <div style={{ width: `${buyPct}%`, background: UP }} />
                          <div style={{ width: `${holdPct}%`, background: "var(--ais-line-strong)" }} />
                          <div style={{ width: `${sellPct}%`, background: DOWN }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* sentiment radar */}
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <h2 className="d-section">Duyarlılık radarı</h2>
                  <Activity size={15} className="text-[var(--ais-fg-faint)]" />
                </div>
                <div className="rounded-xl border p-5" style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}>
                  <div className="space-y-3.5">
                    {sentimentSymbols.map((sym) => {
                      const s = sentimentScore(sym);
                      // -100..100 → 0..100 doluluk
                      const fill = Math.round((s.score + 100) / 2);
                      return (
                        <div key={sym}>
                          <div className="flex items-center justify-between text-[13px]">
                            <span className="font-medium text-[var(--ais-fg)]">{sym}</span>
                            <span className="num font-medium" style={{ color: labelColor[s.label] }}>
                              {labelTr[s.label]} · {s.score > 0 ? "+" : ""}{s.score}
                            </span>
                          </div>
                          <div className="mt-1.5 h-2 overflow-hidden rounded-full" style={{ background: "var(--ais-surface-2)" }}>
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${fill}%`, background: labelColor[s.label] }}
                            />
                          </div>
                          <div className="num mt-1.5 flex gap-3 text-[11px] text-[var(--ais-fg-faint)]">
                            <span>Sosyal {s.social}</span>
                            <span>Haber {s.news}</span>
                            <span>Analist {s.analyst}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-4 text-[11px] text-[var(--ais-fg-faint)]">
                    Sosyal, haber ve analist sinyalinin birleşimi. Yalnızca bilgilendirme amaçlıdır.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
