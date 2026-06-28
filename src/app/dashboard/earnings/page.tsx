"use client";

/**
 * Finovela Bilançolar — yaklaşan + raporlanmış kazançlar, beat/miss, AI özeti.
 * Tasarım dili: Didit (business.didit.me) — açık tema, kutusuz, border-t ayraçlı
 * bölümler, satır deseni, token renkleri, Lucide ikonlar.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { Topbar } from "@/components/dashboard/topbar";
import { TickerBadge } from "@/components/dashboard/ticker-badge";
import { Markdown } from "@/components/dashboard/markdown";
import { Sparkles, CheckCircle2, XCircle } from "lucide-react";

// Didit açık-tema renkleri — beyaz zeminde okunur.
const UP = "var(--ais-green)";
const DOWN = "#d93025";
const ACCENT = "var(--ais-accent)";

type Earning = {
  symbol: string;
  name: string;
  when: string;
  status: "upcoming" | "reported";
  epsEst: number;
  epsActual?: number;
  revEst: string;
  surprise?: number; // %
};

// Gerçek API gelene/kullanılamadığında gösterilecek yedek (graceful fallback).
const FALLBACK_UPCOMING: Earning[] = [
  { symbol: "AAPL", name: "Apple Inc.", when: "Per · Kapanıştan sonra", status: "upcoming", epsEst: 2.41, revEst: "$124.8B" },
  { symbol: "MSFT", name: "Microsoft Corp.", when: "Çar · Kapanıştan sonra", status: "upcoming", epsEst: 3.18, revEst: "$74.2B" },
  { symbol: "NVDA", name: "NVIDIA Corp.", when: "Per · Kapanıştan sonra", status: "upcoming", epsEst: 1.04, revEst: "$57.1B" },
  { symbol: "GOOGL", name: "Alphabet Inc.", when: "Sal · Kapanıştan sonra", status: "upcoming", epsEst: 2.27, revEst: "$98.4B" },
];

const FALLBACK_REPORTED: Earning[] = [
  { symbol: "TSLA", name: "Tesla Inc.", when: "Raporlandı", status: "reported", epsEst: 0.74, epsActual: 0.80, revEst: "$28.1B", surprise: 8.1 },
  { symbol: "META", name: "Meta Platforms", when: "Raporlandı", status: "reported", epsEst: 6.72, epsActual: 7.14, revEst: "$47.3B", surprise: 6.3 },
  { symbol: "AMD", name: "Advanced Micro Devices", when: "Raporlandı", status: "reported", epsEst: 1.21, epsActual: 1.13, revEst: "$8.7B", surprise: -6.6 },
];

const HOUR_TR: Record<string, string> = { bmo: "Açılıştan önce", amc: "Kapanıştan sonra", dmh: "Gün içi" };

type ApiEarning = {
  symbol: string;
  date: string;
  hour?: string;
  epsEstimate?: number | null;
  epsActual?: number | null;
  revenueEstimate?: number | null;
  revenueActual?: number | null;
};

function fmtRev(n?: number | null): string {
  if (n == null) return "—";
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n}`;
}

function mapApi(e: ApiEarning, status: "upcoming" | "reported"): Earning {
  const d = new Date(e.date + "T00:00:00");
  const when =
    status === "upcoming"
      ? `${d.toLocaleDateString("tr-TR", { day: "2-digit", month: "short" })} · ${HOUR_TR[e.hour ?? ""] ?? "—"}`
      : d.toLocaleDateString("tr-TR", { day: "2-digit", month: "short" });
  const surprise =
    e.epsActual != null && e.epsEstimate != null && e.epsEstimate !== 0
      ? +(((e.epsActual - e.epsEstimate) / Math.abs(e.epsEstimate)) * 100).toFixed(1)
      : undefined;
  return {
    symbol: e.symbol,
    name: e.symbol,
    when,
    status,
    epsEst: e.epsEstimate ?? 0,
    epsActual: e.epsActual ?? undefined,
    revEst: fmtRev(e.revenueEstimate),
    surprise,
  };
}

export default function EarningsPage() {
  const [recap, setRecap] = useState<{ symbol: string; text: string; loading: boolean } | null>(null);
  const [UPCOMING, setUpcoming] = useState<Earning[]>(FALLBACK_UPCOMING);
  const [REPORTED, setReported] = useState<Earning[]>(FALLBACK_REPORTED);

  // Gerçek bilanço takvimini çek (Finnhub). Başarısız olursa yedek kalır.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/market/earnings", { cache: "no-store" });
        const data = await res.json();
        if (cancelled || !data.ok) return;
        const up = (data.upcoming as ApiEarning[])
          .map((e) => mapApi(e, "upcoming"))
          // EPS tahmini OLAN şirketler üstte (boş "—" satırlar altta toplanır).
          .sort((a, b) => (b.epsEst > 0 ? 1 : 0) - (a.epsEst > 0 ? 1 : 0));
        const rep = (data.reported as ApiEarning[]).map((e) => mapApi(e, "reported"));
        if (up.length) setUpcoming(up);
        if (rep.length) setReported(rep);
      } catch {
        /* yedek kalsın */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function getRecap(symbol: string) {
    setRecap({ symbol, text: "", loading: true });
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `${symbol} için özlü bir bilanço özeti ver: en son haberlerini ve güncel fiyatını al, ardından öne çıkan noktaları (beklentiyi aştı/kaçırdı havası, yönlendirme, hisseyi neyin hareket ettirdiği) 4-6 madde halinde özetle. Kısa tut. Türkçe yanıt ver.`,
            },
          ],
          locale: "Turkish",
        }),
      });
      if (!res.body) throw new Error();
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "", text = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() ?? "";
        for (const c of parts) {
          const ev = c.match(/^event: (.+)$/m)?.[1];
          const dl = c.split("\n").find((l) => l.startsWith("data: "))?.slice(6);
          if (ev === "text" && dl) {
            text += JSON.parse(dl).delta;
            setRecap({ symbol, text, loading: true });
          }
        }
      }
      setRecap({ symbol, text, loading: false });
    } catch {
      setRecap({ symbol, text: "Özet yüklenemedi. Lütfen tekrar deneyin.", loading: false });
    }
  }

  return (
    <>
      <Topbar title="Bilançolar" />
      <div className="ais ais-light min-h-[calc(100vh-64px)]">
        <div className="mx-auto max-w-5xl px-8 py-10">
          {/* ───────── Başlık ───────── */}
          <div>
            <h1 className="d-title">Bilançolar</h1>
            <p className="d-subtitle mt-2 max-w-2xl leading-relaxed">
              Bu haftanın bilanço takvimi, raporlanan sonuçlar ve yapay zeka özetleri.
            </p>
          </div>

          {/* AI recap paneli */}
          {recap && (
            <div
              className="mt-8 rounded-xl border p-5"
              style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}
            >
              <div className="mb-3 flex items-center gap-2">
                <span
                  className="grid h-7 w-7 place-items-center rounded-lg"
                  style={{ background: "var(--ais-accent-bg)", color: ACCENT }}
                >
                  <Sparkles size={14} />
                </span>
                <h2 className="text-[14px] font-medium text-[var(--ais-fg)]">{recap.symbol} — Yapay zeka özeti</h2>
                <button
                  onClick={() => setRecap(null)}
                  className="ml-auto text-[12px] text-[var(--ais-fg-faint)] transition hover:text-[var(--ais-fg)]"
                >
                  Kapat
                </button>
              </div>
              {recap.text ? <Markdown text={recap.text} tone="light" /> : (
                <span className="inline-flex gap-1">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--ais-fg-faint)]" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--ais-fg-faint)] [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--ais-fg-faint)] [animation-delay:300ms]" />
                </span>
              )}
            </div>
          )}

          {/* ───────── Takvim ───────── */}
          <section className="mt-9 border-t pt-8" style={{ borderColor: "var(--ais-line)" }}>
            <div className="grid gap-8 lg:grid-cols-2">
              {/* yaklaşan */}
              <div>
                <h2 className="d-section mb-4">Bu hafta</h2>
                <div className="overflow-hidden rounded-xl border" style={{ borderColor: "var(--ais-line)" }}>
                  {UPCOMING.map((e, i) => (
                    <div
                      key={`${e.symbol}-${i}`}
                      className="flex items-center gap-3 px-4 py-3 transition hover:bg-[var(--ais-surface-2)]"
                      style={{ borderTop: i === 0 ? "none" : "1px solid var(--ais-line)" }}
                    >
                      <Link href={`/dashboard/stock/${e.symbol}`}>
                        <TickerBadge symbol={e.symbol} size={34} />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13.5px] font-medium text-[var(--ais-fg)]">{e.symbol}</p>
                        <p className="truncate text-[12px] text-[var(--ais-fg-faint)]">{e.when}</p>
                      </div>
                      <div className="text-right text-[12px]">
                        <p className="text-[var(--ais-fg-faint)]">Tahmini EPS</p>
                        <p className="num font-medium text-[var(--ais-fg)]">
                          {e.epsEst != null && e.epsEst > 0 ? `$${e.epsEst.toFixed(2)}` : "—"}
                        </p>
                      </div>
                      <button
                        onClick={() => getRecap(e.symbol)}
                        className="inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-[12px] font-medium text-[var(--ais-fg)] transition hover:bg-[var(--ais-surface-2)]"
                        style={{ borderColor: "var(--ais-line-strong)" }}
                      >
                        <Sparkles size={12} /> Önizle
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* raporlanmış */}
              <div>
                <h2 className="d-section mb-4">Yakın zamanda raporlananlar</h2>
                <div className="overflow-hidden rounded-xl border" style={{ borderColor: "var(--ais-line)" }}>
                  {REPORTED.map((e, i) => {
                    const beat = (e.surprise ?? 0) >= 0;
                    return (
                      <div
                        key={`${e.symbol}-${i}`}
                        className="flex items-center gap-3 px-4 py-3 transition hover:bg-[var(--ais-surface-2)]"
                        style={{ borderTop: i === 0 ? "none" : "1px solid var(--ais-line)" }}
                      >
                        <Link href={`/dashboard/stock/${e.symbol}`}>
                          <TickerBadge symbol={e.symbol} size={34} />
                        </Link>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13.5px] font-medium text-[var(--ais-fg)]">{e.symbol}</p>
                          <p className="num truncate text-[12px] text-[var(--ais-fg-faint)]">
                            EPS ${e.epsActual?.toFixed(2)}
                            {e.epsEst > 0 ? ` (tahmin $${e.epsEst.toFixed(2)})` : ""}
                          </p>
                        </div>
                        <span
                          className="badge-soft"
                          style={{
                            background: beat ? "var(--ais-green-bg)" : "rgba(217,48,37,0.10)",
                            color: beat ? UP : DOWN,
                          }}
                        >
                          {beat ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          {beat ? "Aştı" : "Kaçırdı"} %{Math.abs(e.surprise ?? 0).toFixed(1)}
                        </span>
                        <button
                          onClick={() => getRecap(e.symbol)}
                          className="inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-[12px] font-medium text-[var(--ais-fg)] transition hover:bg-[var(--ais-surface-2)]"
                          style={{ borderColor: "var(--ais-line-strong)" }}
                        >
                          <Sparkles size={12} /> Özet
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <p className="mt-8 text-[12px] text-[var(--ais-fg-faint)]">
              Tahminler ve rakamlar bu demo hesap için örnek niteliğindedir. Yapay zeka özetleri canlı
              haberleri kullanır.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
