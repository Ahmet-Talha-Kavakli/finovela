"use client";

import { useState } from "react";
import { Topbar } from "@/components/dashboard/topbar";
import { useConfirm } from "@/components/dashboard/confirm";
import { useScrollLock } from "@/lib/dashboard/use-scroll-lock";
import { LiveGauge } from "@/components/dashboard/live-area-chart";
import {
  PageTitle,
  SectionCard,
  Card,
  Btn,
  Pill,
  Segmented,
  EmptyState,
  AIS_ACCENT,
  AIS_UP,
} from "@/components/dashboard/ais-kit";
import {
  useGoals,
  type Goal,
  type GoalKind,
  type RiskTolerance,
} from "@/lib/dashboard/use-goals";
import { useLivePortfolio } from "@/lib/dashboard/use-portfolio";
import {
  Target,
  Plus,
  Star,
  Trash,
  ChatCircleDots,
  PencilSimple,
  Check,
  X,
  CaretRight,
} from "@phosphor-icons/react";

const RISK_LABEL: Record<RiskTolerance, string> = {
  low: "Düşük risk",
  medium: "Dengeli",
  high: "Agresif",
};

export default function GoalsPage() {
  const { goals, main, sides, add, remove, setMain, update } = useGoals();
  const { summary } = useLivePortfolio();
  const confirm = useConfirm();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  async function removeGoal(g: Goal) {
    const ok = await confirm({
      title: "Hedefi sil",
      message: `"${g.title}" hedefi kalıcı olarak silinecek.`,
      confirmLabel: "Sil",
      cancelLabel: "Vazgeç",
      tone: "danger",
    });
    if (ok) remove(g.id);
  }

  return (
    <>
      <Topbar title="Hedefler" />
      <div className="ais min-h-[calc(100vh-64px)]">
        <div className="max-w-7xl px-8 py-10">
          <PageTitle
            title="Hedeflerin, Finovela'nın pusulası"
            desc="Bir ana hedef belirle — Finovela her kararını ona göre verir, sapmaz. Yan hedefler ana hedefi bozmadan kovalanır."
            actions={
              <Btn
                variant="primary"
                onClick={() => {
                  setEditing(null);
                  setOpen(true);
                }}
              >
                <Plus size={14} weight="regular" /> Hedef ekle
              </Btn>
            }
          />

          {/* ───────── ANA HEDEF ───────── */}
          <SectionCard label="Ana hedef" desc="Finovela kararlarını bu hedefe göre verir." className="mt-10">
            {main ? (
              <MainGoalBody
                goal={main}
                portfolioValue={summary.total}
                onEdit={() => {
                  setEditing(main.id);
                  setOpen(true);
                }}
                onRemove={() => removeGoal(main)}
              />
            ) : (
              <EmptyState
                icon={Target}
                title="Henüz ana hedef yok"
                desc="Bir hedef ekleyip ana hedef yap — Finovela ona göre çalışsın."
                action={
                  <Btn
                    variant="primary"
                    onClick={() => {
                      setEditing(null);
                      setOpen(true);
                    }}
                  >
                    İlk hedefini belirle
                  </Btn>
                }
              />
            )}
          </SectionCard>

          {/* ───────── YAN HEDEFLER ───────── */}
          <SectionCard
            label="Yan hedefler"
            desc="Ana hedefi bozmadan kovalamak istediğin başka hedefler."
            className="mt-3"
          >
            {sides.length === 0 ? (
              <p className="py-2 text-center text-[13px] text-[var(--ais-fg-muted)]">
                Yan hedef yok. Ana hedefi bozmadan kovalamak istediğin başka hedefler ekleyebilirsin.
              </p>
            ) : (
              <div className="space-y-2.5">
                {sides.map((g) => (
                  <SideGoalRow
                    key={g.id}
                    goal={g}
                    onMakeMain={() => setMain(g.id)}
                    onEdit={() => {
                      setEditing(g.id);
                      setOpen(true);
                    }}
                    onRemove={() => removeGoal(g)}
                    onToggleStatus={() =>
                      update(g.id, { status: g.status === "paused" ? "active" : "paused" })
                    }
                  />
                ))}
              </div>
            )}
          </SectionCard>

          {/* ───────── AI'ya götür ───────── */}
          <Card className="mt-3 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <ChatCircleDots size={18} weight="regular" style={{ color: AIS_ACCENT }} />
              <div>
                <p className="text-[13.5px] font-medium text-[var(--ais-fg)]">Hedefini Finovela ile işle</p>
                <p className="text-[12.5px] text-[var(--ais-fg-muted)]">
                  Finovela hedefini biliyor — &quot;hedefime uygun bir portföy kur&quot; de, gerisini halletsin.
                </p>
              </div>
            </div>
            <Btn href="/dashboard/chat">
              Finovela Sohbet&apos;e git <CaretRight size={13} weight="regular" />
            </Btn>
          </Card>
        </div>
      </div>

      {open && (
        <GoalEditor
          goal={editing ? goals.find((g) => g.id === editing) ?? null : null}
          onClose={() => setOpen(false)}
          onSave={(data, id) => {
            if (id) update(id, data);
            else add(data);
            setOpen(false);
          }}
        />
      )}
    </>
  );
}

function MainGoalBody({
  goal,
  portfolioValue,
  onEdit,
  onRemove,
}: {
  goal: Goal;
  portfolioValue: number;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const sym = goal.currency === "TRY" ? "₺" : "$";
  // İlerleme: hedef tutar varsa portföy/hedef, yoksa kayıtlı progress.
  const progress = goal.targetValue
    ? Math.min(100, Math.round((portfolioValue / goal.targetValue) * 100))
    : goal.progress;

  // kalan tutar / gün
  const remaining = goal.targetValue ? Math.max(0, goal.targetValue - portfolioValue) : null;
  const daysLeft = goal.deadline
    ? Math.max(0, Math.ceil((goal.deadline - Date.now()) / 86400000))
    : null;

  return (
    <>
      <div className="flex items-center justify-between">
        <Pill color={AIS_ACCENT} dot>
          Ana Hedef
        </Pill>
        <div className="flex gap-1">
          <button onClick={onEdit} className="grid h-8 w-8 place-items-center rounded-lg text-[var(--ais-fg-faint)] transition hover:bg-[var(--ais-surface-2)] hover:text-[var(--ais-fg)]" aria-label="Düzenle">
            <PencilSimple size={15} weight="regular" />
          </button>
          <button onClick={onRemove} className="grid h-8 w-8 place-items-center rounded-lg text-[var(--ais-fg-faint)] transition hover:bg-[var(--ais-surface-2)] hover:text-[var(--ais-fg)]" aria-label="Sil">
            <Trash size={15} weight="regular" />
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row sm:items-center">
        <div className="shrink-0">
          <LiveGauge value={progress} size={132} label={`%${progress}`} sublabel="ilerleme" color={AIS_ACCENT} />
        </div>
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <h3 className="text-[19px] font-medium tracking-tight text-[var(--ais-fg)]">{goal.title}</h3>
          {goal.detail && <p className="mt-1 text-[13px] text-[var(--ais-fg-muted)]">{goal.detail}</p>}

          {/* yolculuk metrikleri */}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:max-w-md sm:grid-cols-3">
            {goal.targetValue && (
              <JourneyStat label="Hedef" value={`${sym}${goal.targetValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}`} />
            )}
            {remaining != null && (
              <JourneyStat label="Kalan" value={`${sym}${remaining.toLocaleString("en-US", { maximumFractionDigits: 0 })}`} tone={AIS_UP} />
            )}
            {daysLeft != null && <JourneyStat label="Kalan gün" value={`${daysLeft}`} />}
          </div>

          <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
            <span className="rounded-full border border-[var(--ais-line-strong)] px-3 py-1 text-[12px] text-[var(--ais-fg-muted)]">{RISK_LABEL[goal.riskTolerance]}</span>
            {goal.targetValue && (
              <span className="rounded-full border border-[var(--ais-line-strong)] px-3 py-1 text-[12px] text-[var(--ais-fg-muted)]">
                Şu an: <span className="num font-medium text-[var(--ais-fg)]">{sym}{portfolioValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function JourneyStat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-lg border border-[var(--ais-line)] px-3 py-2">
      <p className="text-[11px] text-[var(--ais-fg-faint)]">{label}</p>
      <p className="num mt-0.5 text-[15px] font-medium" style={{ color: tone ?? "var(--ais-fg)" }}>{value}</p>
    </div>
  );
}

function SideGoalRow({
  goal,
  onMakeMain,
  onEdit,
  onRemove,
  onToggleStatus,
}: {
  goal: Goal;
  onMakeMain: () => void;
  onEdit: () => void;
  onRemove: () => void;
  onToggleStatus: () => void;
}) {
  const sym = goal.currency === "TRY" ? "₺" : "$";
  const paused = goal.status === "paused";
  return (
    <div className={`ais-card ais-card-hover group flex items-center gap-4 p-4 ${paused ? "opacity-50" : ""}`}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-[13.5px] font-medium text-[var(--ais-fg)]">{goal.title}</p>
          {paused && (
            <span className="rounded-full border border-[var(--ais-line-strong)] px-2 py-0.5 text-[10.5px] text-[var(--ais-fg-muted)]">
              Duraklatıldı
            </span>
          )}
        </div>
        {goal.detail && <p className="truncate text-[12.5px] text-[var(--ais-fg-muted)]">{goal.detail}</p>}
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {goal.targetValue && (
            <span className="num rounded-full border border-[var(--ais-line-strong)] px-2 py-0.5 text-[11px] text-[var(--ais-fg-muted)]">
              {sym}{goal.targetValue.toLocaleString("en-US")}
            </span>
          )}
          <span className="rounded-full border border-[var(--ais-line-strong)] px-2 py-0.5 text-[11px] text-[var(--ais-fg-muted)]">
            {RISK_LABEL[goal.riskTolerance]}
          </span>
        </div>
      </div>

      <button
        onClick={onMakeMain}
        title="Ana hedef yap"
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[var(--ais-fg-faint)] transition hover:bg-[var(--ais-surface-2)] hover:text-[var(--ais-accent)]"
      >
        <Star size={15} weight="regular" />
      </button>
      <button
        onClick={onToggleStatus}
        title={paused ? "Devam ettir" : "Duraklat"}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[var(--ais-fg-faint)] transition hover:bg-[var(--ais-surface-2)] hover:text-[var(--ais-fg)]"
      >
        {paused ? <Check size={15} weight="regular" /> : <X size={15} weight="regular" />}
      </button>
      <button
        onClick={onEdit}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[var(--ais-fg-faint)] opacity-0 transition hover:bg-[var(--ais-surface-2)] hover:text-[var(--ais-fg)] group-hover:opacity-100"
      >
        <PencilSimple size={15} weight="regular" />
      </button>
      <button
        onClick={onRemove}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[var(--ais-fg-faint)] opacity-0 transition hover:bg-[var(--ais-surface-2)] hover:text-[var(--ais-fg)] group-hover:opacity-100"
      >
        <Trash size={15} weight="regular" />
      </button>
    </div>
  );
}

function GoalEditor({
  goal,
  onClose,
  onSave,
}: {
  goal: Goal | null;
  onClose: () => void;
  onSave: (
    data: Omit<Goal, "id" | "createdAt" | "progress" | "status">,
    id?: string,
  ) => void;
}) {
  useScrollLock(true);
  const [title, setTitle] = useState(goal?.title ?? "");
  const [detail, setDetail] = useState(goal?.detail ?? "");
  const [amount, setAmount] = useState(goal?.targetValue ? String(goal.targetValue) : "");
  const [currency, setCurrency] = useState(goal?.currency ?? "USD");
  const [risk, setRisk] = useState<RiskTolerance>(goal?.riskTolerance ?? "medium");
  const [kind, setKind] = useState<GoalKind>(goal?.kind ?? "side");
  const [deadline, setDeadline] = useState(
    goal?.deadline ? new Date(goal.deadline).toISOString().slice(0, 10) : "",
  );

  const valid = title.trim().length > 1;

  function submit() {
    if (!valid) return;
    onSave(
      {
        kind,
        title: title.trim(),
        detail: detail.trim() || undefined,
        targetValue: amount ? Number(amount) : undefined,
        currency,
        riskTolerance: risk,
        deadline: deadline ? new Date(deadline).getTime() : undefined,
      },
      goal?.id,
    );
  }

  return (
    <div
      className="ais vela-modal-backdrop fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="vela-modal-card w-full max-w-md rounded-2xl border border-[var(--ais-line-strong)] bg-[#161618] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <Target size={18} weight="regular" style={{ color: AIS_ACCENT }} />
          <h2 className="text-[15px] font-medium text-[var(--ais-fg)]">
            {goal ? "Hedefi düzenle" : "Yeni hedef"}
          </h2>
        </div>

        <div className="mt-4 space-y-3">
          <Field label="Hedef başlığı">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn. Bu ay 10.000$ kazanmak"
              className="ais-input w-full"
            />
          </Field>

          <Field label="Açıklama (opsiyonel)">
            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              rows={2}
              placeholder="Finovela'nın bilmesi gereken detaylar — kısıtlar, tercihler…"
              className="ais-input w-full resize-none"
            />
          </Field>

          <div className="flex gap-2">
            <Field label="Hedef tutar (opsiyonel)" className="flex-1">
              <div className="ais-input flex items-center gap-1">
                <span className="text-[13px] text-[var(--ais-fg-faint)]">{currency === "TRY" ? "₺" : "$"}</span>
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                  inputMode="decimal"
                  placeholder="10000"
                  className="num w-full bg-transparent text-[13px] text-[var(--ais-fg)] placeholder:text-[var(--ais-fg-faint)] focus:outline-none"
                />
              </div>
            </Field>
            <Field label="Para birimi">
              <Segmented
                value={currency}
                onChange={setCurrency}
                options={[
                  { value: "USD", label: "USD" },
                  { value: "TRY", label: "TRY" },
                ]}
              />
            </Field>
          </div>

          <Field label="Son tarih (opsiyonel)">
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="ais-input w-full [color-scheme:dark]"
            />
          </Field>

          <Field label="Risk toleransı">
            <Segmented
              full
              value={risk}
              onChange={setRisk}
              options={[
                { value: "low", label: RISK_LABEL.low },
                { value: "medium", label: RISK_LABEL.medium },
                { value: "high", label: RISK_LABEL.high },
              ]}
            />
          </Field>

          <Field label="Hedef tipi">
            <Segmented
              full
              value={kind}
              onChange={setKind}
              options={[
                { value: "main", label: "Ana hedef" },
                { value: "side", label: "Yan hedef" },
              ]}
            />
            {kind === "main" && (
              <p className="mt-1.5 text-[11px] text-[var(--ais-fg-faint)]">
                Ana hedef yapılınca mevcut ana hedef yan hedefe düşer (tek ana hedef).
              </p>
            )}
          </Field>
        </div>

        <div className="mt-5 flex gap-2">
          <Btn variant="default" onClick={onClose} className="flex-1">
            Vazgeç
          </Btn>
          <Btn variant="primary" onClick={submit} disabled={!valid} className="flex-1">
            {goal ? "Kaydet" : "Hedef oluştur"}
          </Btn>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-[12px] font-medium text-[var(--ais-fg-muted)]">{label}</label>
      {children}
    </div>
  );
}
