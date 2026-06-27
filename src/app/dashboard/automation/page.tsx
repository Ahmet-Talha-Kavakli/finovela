"use client";

import { useState } from "react";
import { Topbar } from "@/components/dashboard/topbar";
import {
  PageTitle,
  SectionCard,
  Card,
  Metric,
  Pill,
  IconChip,
  EmptyState,
  AIS_ACCENT,
} from "@/components/dashboard/ais-kit";
import { useAutomations, parseRule } from "@/lib/dashboard/use-automations";
import { useDecisions } from "@/lib/dashboard/use-decisions";
import { AutomationRunButton } from "@/components/dashboard/automation-run";
import { useConfirm } from "@/components/dashboard/confirm";
import { Sparkle, Plus, Robot, Coins, ShieldCheck, X } from "@phosphor-icons/react";

const catIcon = { Trading: Robot, Cash: Coins, Risk: ShieldCheck } as const;
const catLabel = { Trading: "İşlem", Cash: "Nakit", Risk: "Risk" } as const;

const EXAMPLES = [
  "RSI 30'un altına düştüğünde 500$'lık NVDA al",
  "TSLA 300$'ın altına düşerse sat",
  "GRAMALTIN 5500₺ altına inerse 1000₺ al",
  "THYAO 280₺ altına düşerse al",
  "Her Cuma 200$'lık QQQ al",
];

export default function AutomationPage() {
  const { list, create, toggle, remove } = useAutomations();
  const { decisions } = useDecisions();
  const confirm = useConfirm();
  const [draft, setDraft] = useState("");
  const active = list.filter((a) => a.status === "active").length;
  // GERÇEK metrik: bu ajanların ürettiği uygulanmış işlem kararı sayısı
  // (karar defterinden — uydurma "$4,200" yerine).
  const executedTrades = (Array.isArray(decisions) ? decisions : []).filter(
    (d) => d.kind === "trade" && d.executed,
  ).length;

  function submit() {
    if (!draft.trim()) return;
    create(draft);
    setDraft("");
  }

  async function removeAgent(id: string, name: string) {
    const ok = await confirm({
      title: "Ajanı sil",
      message: `"${name}" otomasyon ajanı kalıcı olarak silinecek ve artık çalışmayacak.`,
      confirmLabel: "Sil",
      cancelLabel: "Vazgeç",
      tone: "danger",
    });
    if (!ok) return;
    remove(id);
  }

  return (
    <>
      <Topbar title="Otomasyon" />
      <div className="ais min-h-[calc(100vh-64px)]">
        <div className="max-w-7xl px-8 py-10">
          <PageTitle
            title="Otomasyon"
            desc="Bir kuralı sade bir dille anlat — Finovela onu sürekli çalışan bir ajana dönüştürsün."
          />

          {/* Dürüst kapsam: ajanlar canlı fiyatla çalışır, simülasyon hesabında işlem yapar. */}
          <div
            className="mt-5 flex items-start gap-2.5 rounded-xl border p-3.5"
            style={{ borderColor: "var(--ais-line-strong)", background: "var(--ais-surface-2)" }}
          >
            <Robot size={17} weight="fill" className="mt-px shrink-0" style={{ color: AIS_ACCENT }} />
            <p className="text-[12.5px] leading-relaxed text-[var(--ais-fg-muted)]">
              Aktif ajanlar <span className="text-[var(--ais-fg)]">canlı fiyatla</span> sürekli yoklanır;
              koşul sağlandığında <span className="text-[var(--ais-fg)]">simülasyon (paper) hesabında</span>{" "}
              gerçek işlem yürütülür ve Brain limitleri uygulanır. Bağlı borsanda gerçek-para otomasyon için
              hesabını bağla ve Brain'de tam yetkiyi aç.
            </p>
          </div>

          {/* ───────── Otomasyon oluştur ───────── */}
          <SectionCard
            label="Otomasyon oluştur"
            desc="Bir kuralı kendi cümlenle yaz; Finovela onu sürekli izleyen bir ajana çevirsin."
            className="mt-10"
            action={
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--ais-accent-bg)] px-2.5 py-1 text-[11px] font-medium text-[var(--ais-accent)]">
                <Sparkle size={13} weight="fill" />
                Yapay zeka
              </span>
            }
          >
            {/* büyük, davetkar kural kutusu */}
            <div className="ais-card-hover flex items-center gap-3 rounded-xl border border-[var(--ais-line-strong)] bg-[var(--ais-surface-2)]/40 px-4 py-2.5 transition focus-within:border-[var(--ais-accent)]/50">
              <Sparkle size={18} weight="regular" className="shrink-0 text-[var(--ais-accent)]" />
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="Bir kural yaz… ör. Her Cuma 200$'lık QQQ al"
                className="flex-1 bg-transparent text-[14px] text-[var(--ais-fg)] placeholder:text-[var(--ais-fg-faint)] focus:outline-none"
              />
              <button
                onClick={submit}
                disabled={!draft.trim()}
                className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg px-4 text-[13px] font-medium text-[var(--ais-accent)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                style={{ background: "var(--ais-accent-bg)" }}
              >
                <Plus size={15} weight="bold" />
                Oluştur
              </button>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-[11.5px] text-[var(--ais-fg-faint)]">Örnekler:</span>
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => setDraft(ex)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--ais-line-strong)] px-3 py-1 text-[12px] text-[var(--ais-fg-muted)] transition hover:border-[var(--ais-accent)]/40 hover:bg-[var(--ais-surface-2)] hover:text-[var(--ais-fg)]"
                >
                  <Sparkle size={12} weight="regular" className="text-[var(--ais-fg-faint)]" />
                  {ex}
                </button>
              ))}
            </div>
          </SectionCard>

          {/* ───────── Genel bakış ───────── */}
          <SectionCard label="Genel bakış" className="mt-3" bodyClassName="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <Metric label="Aktif ajanlar" value={`${active}`} accent={active > 0} />
            <Metric label="Toplam ajan" value={`${list.length}`} />
            <Metric label="Yürütülen işlem" value={`${executedTrades}`} />
          </SectionCard>

          {/* ───────── Ajanlar ───────── */}
          <SectionCard label="Ajanların" className="mt-3" bodyClassName={list.length === 0 ? "p-0" : "space-y-2"}>
            {list.length === 0 ? (
              <EmptyState
                icon={Sparkle}
                title="Henüz ajan yok"
                desc="Yukarıdan bir kural tanımla — Finovela onu sürekli çalışan bir ajana dönüştürsün."
              />
            ) : (
              list.map((a) => {
                const Icon = catIcon[a.category];
                return (
                  <Card key={a.id} className="group flex items-center gap-4 p-4">
                    <IconChip icon={Icon} color={AIS_ACCENT} size={40} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-[13.5px] font-medium text-[var(--ais-fg)]">{a.name}</p>
                        <span className="rounded-full border border-[var(--ais-line-strong)] px-2 py-0.5 text-[10.5px] text-[var(--ais-fg-muted)]">
                          {catLabel[a.category]}
                        </span>
                        {a.status === "paused" && (
                          <Pill color="#9a9aa0">Duraklatıldı</Pill>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-[12.5px] text-[var(--ais-fg-muted)]">&ldquo;{a.rule}&rdquo;</p>
                    </div>
                    <span className="num hidden text-[11px] text-[var(--ais-fg-faint)] sm:block">{a.lastRun}</span>
                    {(() => {
                      const parsed = parseRule(a.rule);
                      const sym = parsed.kind !== "none" ? parsed.symbol : null;
                      return <AutomationRunButton rule={a.rule} symbol={sym} />;
                    })()}
                    <button
                      onClick={() => toggle(a.id)}
                      className="flex h-6 w-11 shrink-0 items-center rounded-full px-0.5 transition"
                      style={{ background: a.status === "active" ? AIS_ACCENT : "rgba(255,255,255,0.15)" }}
                      aria-label="Ajanı aç/kapat"
                    >
                      <span className={`h-5 w-5 rounded-full bg-white transition ${a.status === "active" ? "translate-x-5" : ""}`} />
                    </button>
                    <button
                      onClick={() => removeAgent(a.id, a.name)}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[var(--ais-fg-faint)] opacity-0 transition hover:bg-[var(--ais-surface-2)] hover:text-[var(--ais-fg)] group-hover:opacity-100"
                      aria-label="Ajanı sil"
                    >
                      <X size={14} weight="regular" />
                    </button>
                  </Card>
                );
              })
            )}
          </SectionCard>
        </div>
      </div>
    </>
  );
}
