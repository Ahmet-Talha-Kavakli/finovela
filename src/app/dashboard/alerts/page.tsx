"use client";

/**
 * Finovela Alarmlar — fiyat alarmları (oluştur + aktif + tetiklenen).
 * Tasarım dili: Didit (business.didit.me) — açık tema, kutusuz, border-t ayraçlı
 * bölümler, ızgara-ayraçlı metrik şeridi, soft rozetler, token renkleri.
 * Beyaz-sabit renk YOK — hepsi --ais-* token (açık temada okunur).
 */

import { useState } from "react";
import { Topbar } from "@/components/dashboard/topbar";
import { TickerBadge } from "@/components/dashboard/ui";
import { useAlerts, type Alert } from "@/lib/dashboard/use-alerts";
import { useConfirm } from "@/components/dashboard/confirm";
// Didit ince-çizgi ikon dili → Lucide.
import { BellRing, Plus, TrendingUp, TrendingDown, X, Check } from "lucide-react";

// Didit açık-tema renkleri — beyaz zeminde okunur.
const ACCENT = "var(--ais-accent)";
const UP = "var(--ais-green)";
const DOWN = "#d93025";

export default function AlertsPage() {
  const { list, create, remove, toggle } = useAlerts();
  const confirm = useConfirm();

  async function removeAlert(a: Alert) {
    const ok = await confirm({
      title: "Alarmı sil",
      message: `${a.symbol} ${a.condition === "above" ? "üzerine çıkınca" : "altına inince"} $${a.price.toLocaleString()} alarmı kalıcı olarak silinecek.`,
      confirmLabel: "Sil",
      cancelLabel: "Vazgeç",
      tone: "danger",
    });
    if (!ok) return;
    remove(a.id);
  }
  const [symbol, setSymbol] = useState("");
  const [condition, setCondition] = useState<Alert["condition"]>("above");
  const [price, setPrice] = useState("");

  const valid = symbol.trim().length > 0 && Number(price) > 0;

  function submit() {
    if (!valid) return;
    create(symbol, condition, Number(price));
    setSymbol("");
    setPrice("");
    setCondition("above");
  }

  const active = list.filter((a) => a.status === "active");
  const triggered = list.filter((a) => a.status === "triggered");

  return (
    <>
      <Topbar title="Alarmlar" />
      <div className="ais ais-light min-h-[calc(100vh-64px)]">
        <div className="mx-auto max-w-5xl px-8 py-10">
          {/* ───────── Başlık ───────── */}
          <div>
            <h1 className="d-title">Alarmlar</h1>
            <p className="d-subtitle mt-2 max-w-2xl leading-relaxed">
              Bir hisse hedef fiyatını geçtiği anda haberdar ol.
            </p>
          </div>

          {/* Dürüst kapsam notu */}
          <div
            className="mt-6 flex items-start gap-2.5 rounded-xl border p-3.5"
            style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}
          >
            <BellRing size={17} className="mt-px shrink-0" style={{ color: ACCENT }} />
            <p className="text-[12.5px] leading-relaxed text-[var(--ais-fg-muted)]">
              Alarmlar <span className="text-[var(--ais-fg)]">canlı fiyatla</span> sürekli yoklanır ve
              koşul sağlandığında bildirim çanına düşer. Şu an izleme yalnızca Finovela
              <span className="text-[var(--ais-fg)]"> sekmesi açıkken</span> çalışır; cihaz/tarayıcı
              kapalıyken anlık push bildirimi henüz gönderilmez (yakında).
            </p>
          </div>

          {/* ───────── Alarm oluştur ───────── */}
          <section className="mt-10 border-t pt-8" style={{ borderColor: "var(--ais-line)" }}>
            <div className="mb-5">
              <h2 className="d-section">Alarm oluştur</h2>
              <p className="mt-1 text-[12.5px] text-[var(--ais-fg-muted)]">
                Sembol, koşul ve hedef fiyatı belirle.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="Sembol"
                className="ais-input w-full uppercase tracking-wide sm:w-36"
              />

              {/* Didit segment toggle */}
              <div
                className="inline-flex shrink-0 gap-1 rounded-full border p-1"
                style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}
              >
                {([
                  { value: "above", label: "Üzerinde", Icon: TrendingUp },
                  { value: "below", label: "Altında", Icon: TrendingDown },
                ] as const).map((o) => {
                  const on = condition === o.value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => setCondition(o.value)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors"
                      style={{
                        background: on ? "var(--ais-accent-bg)" : "transparent",
                        color: on ? ACCENT : "var(--ais-fg-muted)",
                      }}
                    >
                      <o.Icon size={14} />
                      {o.label}
                    </button>
                  );
                })}
              </div>

              <div className="ais-input flex flex-1 items-center gap-1.5">
                <span className="text-[var(--ais-fg-faint)]">$</span>
                <input
                  value={price}
                  onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ""))}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  inputMode="decimal"
                  placeholder="0.00"
                  className="num w-full bg-transparent text-[var(--ais-fg)] placeholder:text-[var(--ais-fg-faint)] focus:outline-none"
                />
              </div>

              <button onClick={submit} disabled={!valid} className="pill-primary shrink-0 disabled:cursor-not-allowed disabled:opacity-40">
                <Plus size={16} /> Alarm oluştur
              </button>
            </div>
          </section>

          {/* ───────── Genel bakış (kutusuz ızgara-ayraçlı şerit) ───────── */}
          <section className="mt-10 border-t pt-8" style={{ borderColor: "var(--ais-line)" }}>
            <h2 className="d-section mb-5">Genel bakış</h2>
            <div
              className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border lg:grid-cols-3"
              style={{ borderColor: "var(--ais-line)", background: "var(--ais-line)" }}
            >
              <Stat label="Aktif alarmlar" value={`${active.length}`} color={active.length > 0 ? ACCENT : undefined} />
              <Stat label="Tetiklenen" value={`${triggered.length}`} />
              <Stat label="Toplam alarm" value={`${list.length}`} />
            </div>
          </section>

          {/* ───────── Aktif ───────── */}
          <section className="mt-10 border-t pt-8" style={{ borderColor: "var(--ais-line)" }}>
            <h2 className="d-section mb-5">Aktif</h2>
            {active.length === 0 ? (
              <div
                className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-14 text-center"
                style={{ borderColor: "var(--ais-line-strong)" }}
              >
                <BellRing size={22} style={{ color: "var(--ais-fg-faint)" }} />
                <p className="text-[14px] font-medium text-[var(--ais-fg)]">Aktif alarm yok</p>
                <p className="max-w-sm text-[12.5px] text-[var(--ais-fg-muted)]">
                  Yukarıdan bir tane oluştur — hedef fiyat geçilince haberdar olursun.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border" style={{ borderColor: "var(--ais-line)" }}>
                {active.map((a, i) => (
                  <AlertRow key={a.id} alert={a} first={i === 0} onToggle={() => toggle(a.id)} onRemove={() => removeAlert(a)} />
                ))}
              </div>
            )}
          </section>

          {/* ───────── Tetiklenen ───────── */}
          {triggered.length > 0 && (
            <section className="mt-10 border-t pt-8" style={{ borderColor: "var(--ais-line)" }}>
              <h2 className="d-section mb-5">Tetiklenen</h2>
              <div className="overflow-hidden rounded-xl border" style={{ borderColor: "var(--ais-line)" }}>
                {triggered.map((a, i) => (
                  <AlertRow key={a.id} alert={a} first={i === 0} onToggle={() => toggle(a.id)} onRemove={() => removeAlert(a)} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}

function AlertRow({
  alert,
  first,
  onToggle,
  onRemove,
}: {
  alert: Alert;
  first: boolean;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const isTriggered = alert.status === "triggered";
  const isAbove = alert.condition === "above";
  const accent = isAbove ? UP : DOWN;

  return (
    <div
      className="group flex items-center gap-4 px-4 py-3.5 transition hover:bg-[var(--ais-surface-2)]"
      style={{ borderTop: first ? "none" : "1px solid var(--ais-line)" }}
    >
      <TickerBadge symbol={alert.symbol} size={36} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-[13.5px] font-medium text-[var(--ais-fg)]">{alert.symbol}</p>
          {isTriggered ? (
            <span className="badge-soft badge-green">
              <Check size={11} />
              Tetiklendi
            </span>
          ) : (
            <span className="badge-soft" style={{ background: "var(--ais-soft)", color: "var(--ais-fg-muted)" }}>
              Aktif
            </span>
          )}
        </div>
        <p className="mt-0.5 text-[12.5px] text-[var(--ais-fg-muted)]">
          {alert.symbol}{" "}
          <span className="font-medium" style={{ color: accent }}>
            {isAbove ? "üzerine çıkınca" : "altına inince"}
          </span>{" "}
          <span className="num text-[var(--ais-fg)]">${alert.price.toLocaleString("en-US")}</span>{" "}
          bildir
        </p>
      </div>

      <button
        onClick={onToggle}
        className="flex h-6 w-11 shrink-0 items-center rounded-full px-0.5 transition"
        style={{ background: !isTriggered ? ACCENT : "var(--ais-surface-2)" }}
        aria-label="Alarmı aç/kapat"
      >
        <span
          className={`h-5 w-5 rounded-full transition ${!isTriggered ? "translate-x-5" : ""}`}
          style={{ background: !isTriggered ? "#fff" : "var(--ais-fg-faint)" }}
        />
      </button>

      <button
        onClick={onRemove}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[var(--ais-fg-faint)] opacity-0 transition hover:bg-[var(--ais-surface-2)] hover:text-[var(--ais-fg)] group-hover:opacity-100"
        aria-label="Alarmı sil"
      >
        <X size={15} />
      </button>
    </div>
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
