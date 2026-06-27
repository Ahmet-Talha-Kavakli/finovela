import type { Metadata } from "next";
import Link from "next/link";
import { Topbar } from "@/components/dashboard/topbar";
import { Sparkline } from "@/components/dashboard/area-chart";
import { LEADERBOARD, fmtNum } from "@/lib/dashboard/data";
import { DemoCommunityNotice } from "@/components/dashboard/demo-community-notice";
import { Trophy } from "lucide-react";

/**
 * Finovela Kopya İşlem — lider tablosu + öne çıkan yatırımcılar.
 * Tasarım dili: Didit (business.didit.me) — açık tema, kutusuz, border-t ayraçlı
 * bölümler, ais-dt dense tablo, token renkleri.
 */

export const metadata: Metadata = { title: "Kopya İşlem — Finovela" };

// Didit açık-tema renkleri — beyaz zeminde okunur.
const UP = "var(--ais-green)";
const ACCENT = "var(--ais-accent)";

// risk göstergesi — mavi accent yoğunluğu (1–10 ölçeğinde dolgu).
function riskShade(r: number) {
  return `rgba(37,103,255,${0.18 + (r / 10) * 0.62})`;
}

export default function CopyTradingPage() {
  const ranked = [...LEADERBOARD].sort((a, b) => b.return1y - a.return1y);
  return (
    <>
      <Topbar title="Kopya İşlem" />
      <div className="ais ais-light min-h-[calc(100vh-64px)]">
        <div className="mx-auto max-w-5xl px-8 py-10">
          {/* ───────── Başlık ───────── */}
          <div>
            <h1 className="d-title">Kopya İşlem</h1>
            <p className="d-subtitle mt-2 max-w-2xl leading-relaxed">
              En iyi yatırımcıların işlemlerini tek dokunuşla kopyala. Geçmiş performans gelecekteki
              sonuçları garanti etmez.
            </p>
          </div>

          <div className="mt-6">
            <DemoCommunityNotice kind="copy" />
          </div>

          {/* ───────── Öne çıkanlar ───────── */}
          <section className="mt-9 border-t pt-8" style={{ borderColor: "var(--ais-line)" }}>
            <div className="mb-5">
              <h2 className="d-section">Öne çıkanlar</h2>
              <p className="mt-1 text-[12.5px] text-[var(--ais-fg-muted)]">
                1 yıllık getiriye göre en iyi üç yatırımcı.
              </p>
            </div>
            <div className="grid gap-3 lg:grid-cols-3">
              {ranked.slice(0, 3).map((t, i) => (
                <Link key={t.handle} href={`/dashboard/copy/${t.handle.replace("@", "")}`} className="block">
                  <div
                    className="relative h-full rounded-xl border p-5 transition hover:bg-[var(--ais-surface-2)]"
                    style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}
                  >
                    {i === 0 && (
                      <span
                        className="badge-soft badge-blue absolute right-5 top-5"
                      >
                        <Trophy size={13} /> #1
                      </span>
                    )}
                    <div className="flex items-center gap-3">
                      <span
                        className="grid h-12 w-12 place-items-center rounded-full border text-[15px] font-medium text-[var(--ais-fg)]"
                        style={{ borderColor: "var(--ais-line-strong)", background: "var(--ais-surface-2)" }}
                      >
                        {t.name[0]}
                      </span>
                      <div>
                        <p className="text-[14px] font-medium text-[var(--ais-fg)]">{t.name}</p>
                        <p className="text-[12px] text-[var(--ais-fg-muted)]">{t.handle}</p>
                      </div>
                    </div>
                    <div className="mt-5 flex items-end justify-between">
                      <div>
                        <p className="text-[12px] text-[var(--ais-fg-faint)]">1Y getiri</p>
                        <p className="num text-[20px] font-medium tracking-tight" style={{ color: UP }}>
                          +{t.return1y}%
                        </p>
                      </div>
                      <Sparkline seed={t.handle} up width={90} height={36} />
                    </div>
                    <div className="mt-4 flex items-center justify-between text-[12px] text-[var(--ais-fg-muted)]">
                      <span>{fmtNum(t.copiers)} kopyalayan</span>
                      <span>{t.style}</span>
                    </div>
                    <span
                      className="mt-4 block w-full rounded-lg py-2 text-center text-[12.5px] font-medium"
                      style={{ background: "var(--ais-accent-bg)", color: ACCENT }}
                    >
                      Yatırımcıyı kopyala
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* ───────── Lider Tablosu ───────── */}
          <section className="mt-10 border-t pt-8" style={{ borderColor: "var(--ais-line)" }}>
            <div className="mb-5">
              <h2 className="d-section">Lider Tablosu</h2>
              <p className="mt-1 text-[12.5px] text-[var(--ais-fg-muted)]">
                Tüm yatırımcılar 1Y getiriye göre sıralı.
              </p>
            </div>

            <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--ais-line)" }}>
              <table className="ais-dt min-w-[760px]">
                <thead>
                  <tr>
                    <th>YATIRIMCI</th>
                    <th>STİL</th>
                    <th className="!text-right">1Y GETİRİ</th>
                    <th className="!text-right">KAZANMA ORANI</th>
                    <th className="!text-center">RİSK</th>
                    <th className="!text-right">KOPYALAYAN</th>
                    <th className="!text-right"></th>
                  </tr>
                </thead>
                <tbody>
                  {ranked.map((t) => (
                    <tr key={t.handle}>
                      <td>
                        <Link
                          href={`/dashboard/copy/${t.handle.replace("@", "")}`}
                          className="flex items-center gap-3 transition hover:opacity-80"
                        >
                          <span
                            className="grid h-9 w-9 place-items-center rounded-full border text-[12px] font-medium text-[var(--ais-fg)]"
                            style={{ borderColor: "var(--ais-line-strong)", background: "var(--ais-surface-2)" }}
                          >
                            {t.name[0]}
                          </span>
                          <div>
                            <p className="text-[13px] font-medium text-[var(--ais-fg)]">{t.name}</p>
                            <p className="text-[12px] text-[var(--ais-fg-muted)]">{t.handle}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="text-[var(--ais-fg-muted)]">{t.style}</td>
                      <td className="num !text-right font-medium" style={{ color: UP }}>
                        +{t.return1y}%
                      </td>
                      <td className="num !text-right">{t.win}%</td>
                      <td className="!text-center">
                        <span
                          className="num inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-medium text-white"
                          style={{ background: riskShade(t.risk) }}
                        >
                          {t.risk}
                        </span>
                      </td>
                      <td className="num !text-right">{fmtNum(t.copiers)}</td>
                      <td className="!text-right">
                        <Link
                          href={`/dashboard/copy/${t.handle.replace("@", "")}`}
                          className="inline-flex items-center rounded-full border px-3 py-1.5 text-[12px] font-medium text-[var(--ais-fg)] transition hover:bg-[var(--ais-surface-2)]"
                          style={{ borderColor: "var(--ais-line-strong)" }}
                        >
                          Kopyala
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[11px] text-[var(--ais-fg-faint)]">
              Geçmiş performans gelecekteki sonuçları garanti etmez. Demo hesap.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
