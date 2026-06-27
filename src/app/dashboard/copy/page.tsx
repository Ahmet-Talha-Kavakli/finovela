import type { Metadata } from "next";
import Link from "next/link";
import { Topbar } from "@/components/dashboard/topbar";
import { PageTitle, Section, Card, Btn, AIS_UP } from "@/components/dashboard/ais-kit";
import { Sparkline } from "@/components/dashboard/area-chart";
import { LEADERBOARD, fmtNum } from "@/lib/dashboard/data";
import { DemoCommunityNotice } from "@/components/dashboard/demo-community-notice";
import { Trophy } from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = { title: "Kopya İşlem — Finovela" };

// risk göstergesi monokrom: düşük=soluk beyaz, yüksek=parlak beyaz (renk yok)
function riskShade(r: number) {
  return `rgba(255,255,255,${0.25 + (r / 10) * 0.7})`;
}

export default function CopyTradingPage() {
  const ranked = [...LEADERBOARD].sort((a, b) => b.return1y - a.return1y);
  return (
    <>
      <Topbar title="Kopya İşlem" />
      <div className="ais min-h-[calc(100vh-64px)]">
        <div className="max-w-7xl px-8 py-10">
          <PageTitle
            title="Kopya İşlem"
            desc="En iyi yatırımcıların işlemlerini tek dokunuşla kopyalayın. Geçmiş performans gelecekteki sonuçları garanti etmez."
          />

          <DemoCommunityNotice kind="copy" />

          {/* öne çıkan 3 */}
          <Section label="Öne çıkanlar" className="mt-10" desc="1 yıllık getiriye göre en iyi üç yatırımcı." />
          <div className="grid gap-3 lg:grid-cols-3">
            {ranked.slice(0, 3).map((t, i) => (
              <Link
                key={t.handle}
                href={`/dashboard/copy/${t.handle.replace("@", "")}`}
                className="block"
              >
                <Card hover className="relative h-full">
                  {i === 0 && (
                    <span
                      className="absolute right-5 top-5 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium"
                      style={{ background: "var(--ais-accent-bg)", color: "var(--ais-accent)" }}
                    >
                      <Trophy size={13} weight="regular" /> #1
                    </span>
                  )}
                  <div className="flex items-center gap-3">
                    <span className="grid h-12 w-12 place-items-center rounded-full border border-[var(--ais-line-strong)] bg-white/[0.04] text-[15px] font-medium text-[var(--ais-fg)]">
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
                      <p className="num text-[20px] font-normal tracking-tight" style={{ color: AIS_UP }}>
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
                    style={{ background: "var(--ais-accent-bg)", color: "var(--ais-accent)" }}
                  >
                    Yatırımcıyı kopyala
                  </span>
                </Card>
              </Link>
            ))}
          </div>

          {/* tam leaderboard */}
          <Section label="Lider Tablosu" className="mt-10" desc="Tüm yatırımcılar 1Y getiriye göre sıralı." />
          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="ais-dt min-w-[760px]">
                <thead>
                  <tr>
                    <th className="text-left">Yatırımcı</th>
                    <th className="text-left">Stil</th>
                    <th className="text-right">1Y getiri</th>
                    <th className="text-right">Kazanma oranı</th>
                    <th className="text-center">Risk</th>
                    <th className="text-right">Kopyalayan</th>
                    <th className="text-right"></th>
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
                          <span className="grid h-9 w-9 place-items-center rounded-full border border-[var(--ais-line-strong)] bg-white/[0.04] text-[12px] font-medium text-[var(--ais-fg)]">
                            {t.name[0]}
                          </span>
                          <div>
                            <p className="text-[13px] font-medium text-[var(--ais-fg)]">{t.name}</p>
                            <p className="text-[12px] text-[var(--ais-fg-muted)]">{t.handle}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="text-[var(--ais-fg-muted)]">{t.style}</td>
                      <td className="num text-right font-medium" style={{ color: AIS_UP }}>
                        +{t.return1y}%
                      </td>
                      <td className="num text-right">{t.win}%</td>
                      <td className="text-center">
                        <span
                          className="num inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-medium text-black"
                          style={{ background: riskShade(t.risk) }}
                        >
                          {t.risk}
                        </span>
                      </td>
                      <td className="num text-right">{fmtNum(t.copiers)}</td>
                      <td className="text-right">
                        <Btn href={`/dashboard/copy/${t.handle.replace("@", "")}`} size="sm">
                          Kopyala
                        </Btn>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="px-4 py-3 text-[11px] text-[var(--ais-fg-faint)]">
              Geçmiş performans gelecekteki sonuçları garanti etmez. Demo hesap.
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}
