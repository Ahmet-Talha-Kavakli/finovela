"use client";

/**
 * Finovela Hedefler — AI'nın pusulası (Blok 2). Tek ana hedef + yan hedefler.
 * Tasarım dili: Didit (business.didit.me) — açık tema, kutusuz, border-t ayraçlı
 * bölümler, Didit ilerleme çubuğu, satır deseni, açık-tema modal.
 */

import { useState } from "react";
import Link from "next/link";
import { Topbar } from "@/components/dashboard/topbar";
import { useConfirm } from "@/components/dashboard/confirm";
import { useScrollLock } from "@/lib/dashboard/use-scroll-lock";
import {
  useGoals,
  type Goal,
  type GoalKind,
  type RiskTolerance,
} from "@/lib/dashboard/use-goals";
import { useLivePortfolio } from "@/lib/dashboard/use-portfolio";
import { DiditToggle } from "@/components/dashboard/ais-kit";
// Didit ince-çizgi ikon dili → Lucide.
import {
  Target,
  Plus,
  Star,
  Trash2,
  MessageCircle,
  Pencil,
  Play,
  Pause,
  ChevronRight,
  X,
  Flag,
} from "lucide-react";

const ACCENT = "var(--ais-accent)";

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

  function openNew() {
    setEditing(null);
    setOpen(true);
  }

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
      <div className="ais ais-light min-h-[calc(100vh-64px)]">
        <div className="mx-auto max-w-5xl px-8 py-10">
          {/* ───────── Başlık ───────── */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="d-title">Hedeflerin, Finovela&apos;nın pusulası</h1>
              <p className="d-subtitle mt-2 max-w-2xl leading-relaxed">
                Bir ana hedef belirle — Finovela her kararını ona göre verir, sapmaz. Yan hedefler ana
                hedefi bozmadan kovalanır.
              </p>
            </div>
            <button onClick={openNew} className="pill-primary shrink-0">
              <Plus size={16} /> Hedef ekle
            </button>
          </div>

          {/* ───────── ANA HEDEF ───────── */}
          <section className="mt-9 border-t pt-8" style={{ borderColor: "var(--ais-line)" }}>
            <div className="mb-5">
              <h2 className="d-section">Ana hedef</h2>
              <p className="mt-1 text-[12.5px] text-[var(--ais-fg-muted)]">
                Finovela tüm kararlarını bu hedefe göre verir.
              </p>
            </div>

            {main ? (
              <MainGoalCard
                goal={main}
                portfolioValue={summary.total}
                onEdit={() => {
                  setEditing(main.id);
                  setOpen(true);
                }}
                onRemove={() => removeGoal(main)}
              />
            ) : (
              <div
                className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-14 text-center"
                style={{ borderColor: "var(--ais-line-strong)" }}
              >
                <Target size={22} style={{ color: "var(--ais-fg-faint)" }} />
                <p className="text-[14px] font-medium text-[var(--ais-fg)]">Henüz ana hedef yok</p>
                <p className="max-w-sm text-[12.5px] text-[var(--ais-fg-muted)]">
                  Bir hedef belirle ve ana hedef yap — Finovela ona göre çalışmaya başlasın.
                </p>
                <button onClick={openNew} className="pill-primary mt-2">
                  <Flag size={15} /> İlk hedefini belirle
                </button>
              </div>
            )}
          </section>

          {/* ───────── YAN HEDEFLER ───────── */}
          <section className="mt-10 border-t pt-8" style={{ borderColor: "var(--ais-line)" }}>
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 className="d-section">Yan hedefler</h2>
                <p className="mt-1 text-[12.5px] text-[var(--ais-fg-muted)]">
                  Ana hedefi bozmadan kovalamak istediğin başka hedefler.
                </p>
              </div>
              {sides.length > 0 && (
                <button
                  onClick={openNew}
                  className="text-[12.5px] font-medium transition hover:underline"
                  style={{ color: ACCENT }}
                >
                  + Yeni ekle
                </button>
              )}
            </div>

            {sides.length === 0 ? (
              <div
                className="rounded-xl border border-dashed px-6 py-10 text-center"
                style={{ borderColor: "var(--ais-line-strong)" }}
              >
                <p className="text-[12.5px] text-[var(--ais-fg-muted)]">
                  Yan hedef yok. Ana hedefi bozmadan kovalamak istediğin başka hedefler ekleyebilirsin.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border" style={{ borderColor: "var(--ais-line)" }}>
                {sides.map((g, i) => (
                  <SideGoalRow
                    key={g.id}
                    goal={g}
                    first={i === 0}
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
          </section>

          {/* ───────── AI'ya götür (Didit soft footer satırı) ───────── */}
          <Link
            href="/dashboard/chat"
            className="mt-8 flex items-center justify-between gap-3 rounded-xl px-5 py-4 transition hover:brightness-[0.99]"
            style={{ background: "var(--ais-accent-bg)" }}
          >
            <div className="flex items-center gap-3">
              <span
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
                style={{ background: "rgba(37,103,255,0.14)", color: ACCENT }}
              >
                <MessageCircle size={17} />
              </span>
              <div>
                <p className="text-[13.5px] font-medium text-[var(--ais-fg)]">Hedefini Finovela ile işle</p>
                <p className="text-[12.5px] text-[var(--ais-fg-muted)]">
                  Finovela hedefini biliyor — &quot;hedefime uygun bir portföy kur&quot; de, gerisini halletsin.
                </p>
              </div>
            </div>
            <span className="flex shrink-0 items-center gap-1 text-[12.5px] font-medium" style={{ color: ACCENT }}>
              Sohbet&apos;e git <ChevronRight size={14} />
            </span>
          </Link>
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

/* ── ANA HEDEF kartı — Didit "Needs review" kartı + yatay ilerleme çubuğu ── */
function MainGoalCard({
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
  const progress = goal.targetValue
    ? Math.min(100, Math.round((portfolioValue / goal.targetValue) * 100))
    : goal.progress;
  const remaining = goal.targetValue ? Math.max(0, goal.targetValue - portfolioValue) : null;
  // Kalan gün: Date.now() saf değil → lazy useState initializer'da bir kez okunur
  // (render saf kalır; SSR'da 0, istemcide gerçek now ile hesaplanır → lint temiz).
  const [now] = useState(() => (typeof window === "undefined" ? 0 : Date.now()));
  const daysLeft =
    goal.deadline && now > 0
      ? Math.max(0, Math.ceil((goal.deadline - now) / 86400000))
      : null;

  return (
    <div className="rounded-xl border p-6" style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}>
      {/* üst: rozet + başlık + aksiyonlar */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
            style={{ background: "var(--ais-accent-bg)", color: ACCENT }}
          >
            <Target size={18} />
          </span>
          <div>
            <span className="badge-soft badge-blue">Ana Hedef</span>
            <h3 className="mt-1.5 text-[17px] font-medium tracking-tight text-[var(--ais-fg)]">{goal.title}</h3>
          </div>
        </div>
        <div className="flex shrink-0 gap-1">
          <IconBtn onClick={onEdit} label="Düzenle" tone="accent">
            <Pencil size={15} />
          </IconBtn>
          <IconBtn onClick={onRemove} label="Sil" tone="danger">
            <Trash2 size={15} />
          </IconBtn>
        </div>
      </div>

      {goal.detail && (
        <p className="mt-3 text-[13px] leading-relaxed text-[var(--ais-fg-muted)]">{goal.detail}</p>
      )}

      {/* ilerleme çubuğu (Didit dashboard barı) */}
      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[12px] text-[var(--ais-fg-muted)]">İlerleme</span>
          <span className="num text-[13px] font-medium text-[var(--ais-fg)]">%{progress}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: "var(--ais-surface-2)" }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${progress}%`, background: ACCENT }}
          />
        </div>
      </div>

      {/* yolculuk metrikleri (kutusuz, ızgara ayraçlı şerit) */}
      <div
        className="mt-5 grid gap-px overflow-hidden rounded-lg border"
        style={{
          borderColor: "var(--ais-line)",
          background: "var(--ais-line)",
          gridTemplateColumns: `repeat(${
            [goal.targetValue, remaining != null, daysLeft != null, true].filter(Boolean).length
          }, minmax(0,1fr))`,
        }}
      >
        {goal.targetValue && (
          <JourneyStat label="Hedef tutar" value={`${sym}${goal.targetValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}`} />
        )}
        {remaining != null && (
          <JourneyStat label="Kalan" value={`${sym}${remaining.toLocaleString("en-US", { maximumFractionDigits: 0 })}`} tone="var(--ais-green)" />
        )}
        {daysLeft != null && <JourneyStat label="Kalan gün" value={`${daysLeft}`} />}
        <JourneyStat label="Risk" value={RISK_LABEL[goal.riskTolerance]} />
      </div>

      {goal.targetValue && (
        <p className="mt-3 text-[12px] text-[var(--ais-fg-muted)]">
          Şu anki portföy:{" "}
          <span className="num font-medium text-[var(--ais-fg)]">
            {sym}{portfolioValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </span>
        </p>
      )}
    </div>
  );
}

function JourneyStat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="bg-[var(--ais-surface)] px-4 py-3">
      <p className="text-[11px] text-[var(--ais-fg-faint)]">{label}</p>
      <p className="num mt-1 text-[15px] font-medium" style={{ color: tone ?? "var(--ais-fg)" }}>
        {value}
      </p>
    </div>
  );
}

/* ── YAN HEDEF satırı — Didit liste satırı (border-b ayraçlı, hover) ── */
function SideGoalRow({
  goal,
  first,
  onMakeMain,
  onEdit,
  onRemove,
  onToggleStatus,
}: {
  goal: Goal;
  first: boolean;
  onMakeMain: () => void;
  onEdit: () => void;
  onRemove: () => void;
  onToggleStatus: () => void;
}) {
  const sym = goal.currency === "TRY" ? "₺" : "$";
  const paused = goal.status === "paused";
  return (
    <div
      className={`group flex items-center gap-4 px-4 py-3.5 transition hover:bg-[var(--ais-surface-2)] ${
        paused ? "opacity-55" : ""
      }`}
      style={{ borderTop: first ? "none" : "1px solid var(--ais-line)" }}
    >
      <span
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
        style={{ background: "var(--ais-surface-2)", color: "var(--ais-fg-muted)" }}
      >
        <Flag size={15} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[13.5px] font-medium text-[var(--ais-fg)]">{goal.title}</p>
          {paused && (
            <span className="badge-soft" style={{ background: "var(--ais-soft)", color: "var(--ais-fg-muted)" }}>
              Duraklatıldı
            </span>
          )}
        </div>
        {goal.detail && <p className="mt-0.5 truncate text-[12px] text-[var(--ais-fg-muted)]">{goal.detail}</p>}
      </div>

      {/* meta rozetler */}
      <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
        {goal.targetValue && (
          <span className="num badge-soft" style={{ background: "var(--ais-soft)", color: "var(--ais-fg-muted)" }}>
            {sym}{goal.targetValue.toLocaleString("en-US")}
          </span>
        )}
        <span className="badge-soft" style={{ background: "var(--ais-soft)", color: "var(--ais-fg-muted)" }}>
          {RISK_LABEL[goal.riskTolerance]}
        </span>
      </div>

      {/* aksiyonlar */}
      <div className="flex shrink-0 items-center gap-0.5">
        <IconBtn onClick={onMakeMain} label="Ana hedef yap" accentHover>
          <Star size={15} />
        </IconBtn>
        <IconBtn onClick={onToggleStatus} label={paused ? "Devam ettir" : "Duraklat"}>
          {paused ? <Play size={15} /> : <Pause size={15} />}
        </IconBtn>
        <span className="opacity-0 transition group-hover:opacity-100">
          <IconBtn onClick={onEdit} label="Düzenle">
            <Pencil size={15} />
          </IconBtn>
        </span>
        <span className="opacity-0 transition group-hover:opacity-100">
          <IconBtn onClick={onRemove} label="Sil">
            <Trash2 size={15} />
          </IconBtn>
        </span>
      </div>
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  label,
  accentHover,
  tone,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  accentHover?: boolean;
  /** Renkli ikon: accent = mavi düzenle, danger = kırmızı sil (madde 3). */
  tone?: "accent" | "danger";
}) {
  // Renkli tonlarda taban renk belirgin, hover'da daha koyu/dolgulu.
  const toneCls =
    tone === "accent"
      ? "text-[var(--ais-accent)] hover:bg-[var(--ais-accent-bg)]"
      : tone === "danger"
        ? "text-[#d93025] hover:bg-[rgba(217,48,37,0.10)]"
        : `text-[var(--ais-fg-faint)] hover:bg-[var(--ais-surface-2)] ${
            accentHover ? "hover:text-[var(--ais-accent)]" : "hover:text-[var(--ais-fg)]"
          }`;
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`grid h-8 w-8 place-items-center rounded-lg transition ${toneCls}`}
    >
      {children}
    </button>
  );
}

/* ── HEDEF EDİTÖRÜ — Didit açık-tema modal (yuvarlak köşe, beyaz, soft gölge) ── */
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
    // Overlay: bulunduğumuz sayfa arkada KALIR — üstüne hafif karartma + gerçek blur.
    // .ais-light'ı overlay'e VERME (zemini beyazlatıyordu); sadece modal kartına ver.
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4"
      style={{
        background: "rgba(17,17,20,0.32)",
        backdropFilter: "blur(8px) saturate(120%)",
        WebkitBackdropFilter: "blur(8px) saturate(120%)",
      }}
      onClick={onClose}
    >
      <div
        className="ais ais-light w-full max-w-md overflow-hidden rounded-2xl border bg-[var(--ais-surface)] shadow-[0_32px_80px_-20px_rgba(0,0,0,0.45)]"
        style={{ borderColor: "var(--ais-line)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* başlık */}
        <div className="flex items-center justify-between gap-3 px-6 pt-5 pb-4">
          <div className="flex items-center gap-2.5">
            <span
              className="grid h-8 w-8 place-items-center rounded-lg"
              style={{ background: "var(--ais-accent-bg)", color: ACCENT }}
            >
              <Target size={16} />
            </span>
            <h2 className="text-[15px] font-medium text-[var(--ais-fg)]">
              {goal ? "Hedefi düzenle" : "Yeni hedef"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-[var(--ais-fg-faint)] transition hover:bg-[var(--ais-surface-2)] hover:text-[var(--ais-fg)]"
            aria-label="Kapat"
          >
            <X size={16} />
          </button>
        </div>

        {/* gövde */}
        <div className="space-y-4 px-6 pb-2">
          <Field label="Hedef başlığı">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn. Bu ay 10.000$ kazanmak"
              className="ais-input w-full"
              autoFocus
            />
          </Field>

          <Field label="Açıklama (opsiyonel)">
            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              rows={2}
              placeholder="Finovela'nın bilmesi gereken detaylar — kısıtlar, tercihler…"
              className="ais-input w-full resize-none py-2.5"
            />
          </Field>

          <div className="flex gap-3">
            <Field label="Hedef tutar (opsiyonel)" className="flex-1">
              <div className="ais-input flex items-center gap-1.5">
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
              <DiditToggle
                value={currency}
                onChange={setCurrency}
                options={[
                  { value: "USD", label: "USD", tone: "green" },
                  { value: "TRY", label: "TRY", tone: "blue" },
                ]}
              />
            </Field>
          </div>

          <Field label="Son tarih (opsiyonel)">
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="ais-input w-full"
            />
          </Field>

          <Field label="Risk toleransı">
            <DiditToggle
              full
              value={risk}
              onChange={setRisk}
              options={[
                { value: "low", label: RISK_LABEL.low, tone: "green" },
                { value: "medium", label: RISK_LABEL.medium, tone: "blue" },
                { value: "high", label: RISK_LABEL.high, tone: "red" },
              ]}
            />
          </Field>

          <Field label="Hedef tipi">
            <DiditToggle
              full
              value={kind}
              onChange={setKind}
              options={[
                { value: "main", label: "Ana hedef", tone: "blue" },
                { value: "side", label: "Yan hedef", tone: "amber" },
              ]}
            />
            {kind === "main" && (
              <p className="mt-1.5 text-[11px] text-[var(--ais-fg-faint)]">
                Ana hedef yapılınca mevcut ana hedef yan hedefe düşer (tek ana hedef).
              </p>
            )}
          </Field>
        </div>

        {/* alt aksiyon (Didit modal footer) */}
        <div className="mt-4 flex gap-2.5 border-t px-6 py-4" style={{ borderColor: "var(--ais-line)" }}>
          <button
            onClick={onClose}
            className="flex-1 rounded-full border py-2.5 text-[13px] font-medium text-[var(--ais-fg)] transition hover:bg-[var(--ais-surface-2)]"
            style={{ borderColor: "var(--ais-line-strong)" }}
          >
            Vazgeç
          </button>
          <button
            onClick={submit}
            disabled={!valid}
            className="flex-1 rounded-full py-2.5 text-[13px] font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-40"
            style={{ background: ACCENT }}
          >
            {goal ? "Kaydet" : "Hedef oluştur"}
          </button>
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
