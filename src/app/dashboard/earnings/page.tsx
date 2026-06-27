"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Topbar } from "@/components/dashboard/topbar";
import {
  PageTitle,
  SectionCard,
  Card,
  Btn,
  Pill,
  AIS_ACCENT,
  AIS_UP,
  AIS_DOWN,
} from "@/components/dashboard/ais-kit";
import { TickerBadge } from "@/components/dashboard/ticker-badge";
import { Markdown } from "@/components/dashboard/markdown";
import { Sparkle, CheckCircle, XCircle } from "@phosphor-icons/react";

/** Earnings Hub — yaklaşan + raporlanmış kazançlar, beat/miss, AI özeti. */

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
        const up = (data.upcoming as ApiEarning[]).map((e) => mapApi(e, "upcoming"));
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
      <div className="ais min-h-[calc(100vh-64px)]">
        <div className="max-w-7xl px-8 py-10">
          <PageTitle
            title="Bilançolar"
            desc="Bu haftanın bilanço takvimi, raporlanan sonuçlar ve yapay zeka özetleri."
          />

          {/* AI recap paneli */}
          {recap && (
            <Card className="mt-8">
              <div className="mb-3 flex items-center gap-2">
                <span
                  className="grid h-7 w-7 place-items-center rounded-lg"
                  style={{ background: "var(--ais-accent-bg)", color: AIS_ACCENT }}
                >
                  <Sparkle size={14} weight="regular" />
                </span>
                <h2 className="text-[14px] font-medium text-[var(--ais-fg)]">{recap.symbol} — Yapay zeka özeti</h2>
                <button
                  onClick={() => setRecap(null)}
                  className="ml-auto text-[12px] text-[var(--ais-fg-faint)] hover:text-[var(--ais-fg)]"
                >
                  Kapat
                </button>
              </div>
              {recap.text ? <Markdown text={recap.text} /> : (
                <span className="inline-flex gap-1">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--ais-fg-faint)]" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--ais-fg-faint)] [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--ais-fg-faint)] [animation-delay:300ms]" />
                </span>
              )}
            </Card>
          )}

          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            {/* yaklaşan */}
            <SectionCard label="Bu hafta">
              <div className="space-y-2">
                {UPCOMING.map((e, i) => (
                  <div key={`${e.symbol}-${i}`} className="ais-card flex items-center gap-3 p-3">
                    <Link href={`/dashboard/stock/${e.symbol}`}><TickerBadge symbol={e.symbol} size={34} /></Link>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-medium text-[var(--ais-fg)]">{e.symbol}</p>
                      <p className="truncate text-[12px] text-[var(--ais-fg-faint)]">{e.when}</p>
                    </div>
                    <div className="text-right text-[12px]">
                      <p className="text-[var(--ais-fg-faint)]">Tahmini EPS</p>
                      <p className="num font-medium text-[var(--ais-fg)]">${e.epsEst.toFixed(2)}</p>
                    </div>
                    <Btn variant="default" size="sm" onClick={() => getRecap(e.symbol)}>
                      <Sparkle size={12} weight="regular" /> Önizle
                    </Btn>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* raporlanmış */}
            <SectionCard label="Yakın zamanda raporlananlar">
              <div className="space-y-2">
                {REPORTED.map((e, i) => {
                  const beat = (e.surprise ?? 0) >= 0;
                  return (
                    <div key={`${e.symbol}-${i}`} className="ais-card flex items-center gap-3 p-3">
                      <Link href={`/dashboard/stock/${e.symbol}`}><TickerBadge symbol={e.symbol} size={34} /></Link>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13.5px] font-medium text-[var(--ais-fg)]">{e.symbol}</p>
                        <p className="num truncate text-[12px] text-[var(--ais-fg-faint)]">
                          EPS ${e.epsActual?.toFixed(2)} (tahmin ${e.epsEst.toFixed(2)})
                        </p>
                      </div>
                      <Pill color={beat ? AIS_UP : AIS_DOWN}>
                        {beat ? <CheckCircle size={12} weight="regular" /> : <XCircle size={12} weight="regular" />}
                        {beat ? "Aştı" : "Kaçırdı"} %{Math.abs(e.surprise ?? 0).toFixed(1)}
                      </Pill>
                      <Btn variant="default" size="sm" onClick={() => getRecap(e.symbol)}>
                        <Sparkle size={12} weight="regular" /> Özet
                      </Btn>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          </div>

          <p className="mt-8 text-[12px] text-[var(--ais-fg-faint)]">
            Tahminler ve rakamlar bu demo hesap için örnek niteliğindedir. Yapay zeka özetleri canlı haberleri kullanır.
          </p>
        </div>
      </div>
    </>
  );
}
