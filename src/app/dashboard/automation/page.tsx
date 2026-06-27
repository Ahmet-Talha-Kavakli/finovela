"use client";

/**
 * Finovela Otomasyon — sade-dil kuralları sürekli çalışan ajanlara çevirir.
 * Tasarım dili: Didit (business.didit.me) — açık tema, kutusuz, border-t ayraçlı
 * bölümler, ızgara-ayraçlı metrik şeridi, satır deseni, token renkleri.
 * Beyaz-sabit renk YOK — hepsi --ais-* token (açık temada okunur).
 */

import { useState } from "react";
import { Topbar } from "@/components/dashboard/topbar";
import { useAutomations, parseRule } from "@/lib/dashboard/use-automations";
import { useDecisions } from "@/lib/dashboard/use-decisions";
import { AutomationRunButton } from "@/components/dashboard/automation-run";
import { useConfirm } from "@/components/dashboard/confirm";
// Didit ince-çizgi ikon dili → Lucide.
import { Sparkles, Plus, Bot, Coins, ShieldCheck, X } from "lucide-react";

const ACCENT = "var(--ais-accent)";

const catIcon = { Trading: Bot, Cash: Coins, Risk: ShieldCheck } as const;
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
      <div className="ais ais-light min-h-[calc(100vh-64px)]">
        <div className="mx-auto max-w-5xl px-8 py-10">
          {/* ───────── Başlık ───────── */}
          <div>
            <h1 className="d-title">Otomasyon</h1>
            <p className="d-subtitle mt-2 max-w-2xl leading-relaxed">
              Bir kuralı sade bir dille anlat — Finovela onu sürekli çalışan bir ajana dönüştürsün.
            </p>
          </div>

          {/* Dürüst kapsam */}
          <div
            className="mt-6 flex items-start gap-2.5 rounded-xl border p-3.5"
            style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}
          >
            <Bot size={17} className="mt-px shrink-0" style={{ color: ACCENT }} />
            <p className="text-[12.5px] leading-relaxed text-[var(--ais-fg-muted)]">
              Aktif ajanlar <span className="text-[var(--ais-fg)]">canlı fiyatla</span> sürekli yoklanır;
              koşul sağlandığında <span className="text-[var(--ais-fg)]">simülasyon (paper) hesabında</span>{" "}
              gerçek işlem yürütülür ve Brain limitleri uygulanır. Bağlı borsanda gerçek-para otomasyon için
              hesabını bağla ve Brain&apos;de tam yetkiyi aç.
            </p>
          </div>

          {/* ───────── Otomasyon oluştur ───────── */}
          <section className="mt-10 border-t pt-8" style={{ borderColor: "var(--ais-line)" }}>
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 className="d-section">Otomasyon oluştur</h2>
                <p className="mt-1 text-[12.5px] text-[var(--ais-fg-muted)]">
                  Bir kuralı kendi cümlenle yaz; Finovela onu sürekli izleyen bir ajana çevirsin.
                </p>
              </div>
              <span className="badge-soft badge-blue shrink-0">
                <Sparkles size={13} />
                Yapay zeka
              </span>
            </div>

            {/* büyük, davetkar kural kutusu */}
            <div
              className="flex items-center gap-3 rounded-xl border px-4 py-2.5 transition focus-within:border-[var(--ais-accent)]"
              style={{ borderColor: "var(--ais-line-strong)", background: "var(--ais-surface)" }}
            >
              <Sparkles size={18} className="shrink-0" style={{ color: ACCENT }} />
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
                className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg px-4 text-[13px] font-medium transition hover:brightness-[1.04] disabled:cursor-not-allowed disabled:opacity-40"
                style={{ background: "var(--ais-accent-bg)", color: ACCENT }}
              >
                <Plus size={15} />
                Oluştur
              </button>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-[11.5px] text-[var(--ais-fg-faint)]">Örnekler:</span>
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => setDraft(ex)}
                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] text-[var(--ais-fg-muted)] transition hover:bg-[var(--ais-surface-2)] hover:text-[var(--ais-fg)]"
                  style={{ borderColor: "var(--ais-line-strong)" }}
                >
                  <Sparkles size={12} style={{ color: "var(--ais-fg-faint)" }} />
                  {ex}
                </button>
              ))}
            </div>
          </section>

          {/* ───────── Genel bakış (kutusuz ızgara-ayraçlı şerit) ───────── */}
          <section className="mt-10 border-t pt-8" style={{ borderColor: "var(--ais-line)" }}>
            <h2 className="d-section mb-5">Genel bakış</h2>
            <div
              className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border lg:grid-cols-3"
              style={{ borderColor: "var(--ais-line)", background: "var(--ais-line)" }}
            >
              <Stat label="Aktif ajanlar" value={`${active}`} color={active > 0 ? ACCENT : undefined} />
              <Stat label="Toplam ajan" value={`${list.length}`} />
              <Stat label="Yürütülen işlem" value={`${executedTrades}`} />
            </div>
          </section>

          {/* ───────── Ajanlar ───────── */}
          <section className="mt-10 border-t pt-8" style={{ borderColor: "var(--ais-line)" }}>
            <h2 className="d-section mb-5">Ajanların</h2>
            {list.length === 0 ? (
              <div
                className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-14 text-center"
                style={{ borderColor: "var(--ais-line-strong)" }}
              >
                <Sparkles size={22} style={{ color: "var(--ais-fg-faint)" }} />
                <p className="text-[14px] font-medium text-[var(--ais-fg)]">Henüz ajan yok</p>
                <p className="max-w-sm text-[12.5px] text-[var(--ais-fg-muted)]">
                  Yukarıdan bir kural tanımla — Finovela onu sürekli çalışan bir ajana dönüştürsün.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border" style={{ borderColor: "var(--ais-line)" }}>
                {list.map((a, i) => {
                  const Icon = catIcon[a.category];
                  return (
                    <div
                      key={a.id}
                      className="group flex items-center gap-4 px-4 py-3.5 transition hover:bg-[var(--ais-surface-2)]"
                      style={{ borderTop: i === 0 ? "none" : "1px solid var(--ais-line)" }}
                    >
                      <span
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-lg"
                        style={{ background: "var(--ais-accent-bg)", color: ACCENT }}
                      >
                        <Icon size={20} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-[13.5px] font-medium text-[var(--ais-fg)]">{a.name}</p>
                          <span className="badge-soft" style={{ background: "var(--ais-soft)", color: "var(--ais-fg-muted)" }}>
                            {catLabel[a.category]}
                          </span>
                          {a.status === "paused" && (
                            <span className="badge-soft" style={{ background: "var(--ais-soft)", color: "var(--ais-fg-muted)" }}>
                              Duraklatıldı
                            </span>
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
                        style={{ background: a.status === "active" ? ACCENT : "var(--ais-surface-2)" }}
                        aria-label="Ajanı aç/kapat"
                      >
                        <span
                          className={`h-5 w-5 rounded-full transition ${a.status === "active" ? "translate-x-5" : ""}`}
                          style={{ background: a.status === "active" ? "#fff" : "var(--ais-fg-faint)" }}
                        />
                      </button>
                      <button
                        onClick={() => removeAgent(a.id, a.name)}
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[var(--ais-fg-faint)] opacity-0 transition hover:bg-[var(--ais-surface-2)] hover:text-[var(--ais-fg)] group-hover:opacity-100"
                        aria-label="Ajanı sil"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

/* ── Üst metrik (kutusuz ızgara şeridi — Didit Usage) ── */
function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-[var(--ais-surface)] px-5 py-4">
      <p className="text-[11.5px] text-[var(--ais-fg-faint)]">{label}</p>
      <p className="num mt-2 text-[19px] font-medium tracking-tight" style={{ color: color ?? "var(--ais-fg)" }}>
        {value}
      </p>
    </div>
  );
}
