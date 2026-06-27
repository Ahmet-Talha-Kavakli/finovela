"use client";

import { useState } from "react";
import { Topbar } from "@/components/dashboard/topbar";
import { TickerBadge } from "@/components/dashboard/ui";
import {
  PageTitle,
  SectionCard,
  Card,
  Metric,
  Btn,
  Pill,
  Segmented,
  EmptyState,
  AIS_ACCENT,
  AIS_UP,
  AIS_DOWN,
} from "@/components/dashboard/ais-kit";
import { useAlerts, type Alert } from "@/lib/dashboard/use-alerts";
import { useConfirm } from "@/components/dashboard/confirm";
import { BellRinging, Plus, TrendUp, TrendDown, X, Check } from "@phosphor-icons/react";

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
      <div className="ais min-h-[calc(100vh-64px)]">
        <div className="max-w-7xl px-8 py-10">
          <PageTitle
            title="Alarmlar"
            desc="Bir hisse hedef fiyatını geçtiği anda haberdar ol."
          />

          {/* Dürüst kapsam notu: izleme canlı ama uygulama açıkken çalışır. */}
          <div
            className="mt-5 flex items-start gap-2.5 rounded-xl border p-3.5"
            style={{ borderColor: "var(--ais-line-strong)", background: "var(--ais-surface)" }}
          >
            <BellRinging size={17} weight="fill" className="mt-px shrink-0" style={{ color: AIS_ACCENT }} />
            <p className="text-[12.5px] leading-relaxed text-[var(--ais-fg-muted)]">
              Alarmlar <span className="text-[var(--ais-fg)]">canlı fiyatla</span> sürekli yoklanır ve
              koşul sağlandığında bildirim çanına düşer. Şu an izleme yalnızca Finovela
              <span className="text-[var(--ais-fg)]"> sekmesi açıkken</span> çalışır; cihaz/tarayıcı
              kapalıyken anlık push bildirimi henüz gönderilmez (yakında).
            </p>
          </div>

          {/* ───────── Alarm oluştur ───────── */}
          <SectionCard label="Alarm oluştur" desc="Sembol, koşul ve hedef fiyatı belirle." className="mt-10">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="Sembol"
                className="ais-input w-full uppercase tracking-wide sm:w-36"
              />

              <Segmented
                value={condition}
                onChange={setCondition}
                options={[
                  { value: "above", label: "Üzerinde", icon: TrendUp },
                  { value: "below", label: "Altında", icon: TrendDown },
                ]}
              />

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

              <Btn variant="primary" onClick={submit} disabled={!valid} className="shrink-0">
                <Plus size={14} weight="regular" />
                Alarm oluştur
              </Btn>
            </div>
          </SectionCard>

          {/* ───────── Genel bakış ───────── */}
          <SectionCard label="Genel bakış" className="mt-3" bodyClassName="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <Metric label="Aktif alarmlar" value={`${active.length}`} accent={active.length > 0} />
            <Metric label="Tetiklenen" value={`${triggered.length}`} />
            <Metric label="Toplam alarm" value={`${list.length}`} />
          </SectionCard>

          {/* ───────── Aktif ───────── */}
          <SectionCard label="Aktif" className="mt-3" bodyClassName={active.length === 0 ? "p-0" : "space-y-2"}>
            {active.length === 0 ? (
              <EmptyState
                icon={BellRinging}
                title="Aktif alarm yok"
                desc="Yukarıdan bir tane oluştur — hedef fiyat geçilince haberdar olursun."
              />
            ) : (
              active.map((a) => (
                <AlertRow key={a.id} alert={a} onToggle={() => toggle(a.id)} onRemove={() => removeAlert(a)} />
              ))
            )}
          </SectionCard>

          {/* ───────── Tetiklenen ───────── */}
          {triggered.length > 0 && (
            <SectionCard label="Tetiklenen" className="mt-3" bodyClassName="space-y-2">
              {triggered.map((a) => (
                <AlertRow key={a.id} alert={a} onToggle={() => toggle(a.id)} onRemove={() => removeAlert(a)} />
              ))}
            </SectionCard>
          )}
        </div>
      </div>
    </>
  );
}

function AlertRow({
  alert,
  onToggle,
  onRemove,
}: {
  alert: Alert;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const isTriggered = alert.status === "triggered";
  const isAbove = alert.condition === "above";
  const accent = isAbove ? AIS_UP : AIS_DOWN;

  return (
    <Card className="group flex items-center gap-4 p-4">
      <TickerBadge symbol={alert.symbol} size={36} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-[13.5px] font-medium text-[var(--ais-fg)]">{alert.symbol}</p>
          {isTriggered ? (
            <Pill color={AIS_UP}>
              <Check size={10} weight="regular" />
              Tetiklendi
            </Pill>
          ) : (
            <span className="rounded-full border border-[var(--ais-line-strong)] px-2 py-0.5 text-[10.5px] text-[var(--ais-fg-muted)]">
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
        style={{ background: !isTriggered ? AIS_ACCENT : "rgba(255,255,255,0.15)" }}
        aria-label="Alarmı aç/kapat"
      >
        <span className={`h-5 w-5 rounded-full bg-white transition ${!isTriggered ? "translate-x-5" : ""}`} />
      </button>

      <button
        onClick={onRemove}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[var(--ais-fg-faint)] opacity-0 transition hover:bg-[var(--ais-surface-2)] hover:text-[var(--ais-fg)] group-hover:opacity-100"
        aria-label="Alarmı sil"
      >
        <X size={14} weight="regular" />
      </button>
    </Card>
  );
}
