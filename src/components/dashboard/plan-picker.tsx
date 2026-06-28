"use client";

/**
 * PlanPicker — genel "Plan Seç" yükseltme modalı (kapatılabilir, PlanGate'in
 * kilitli/kapatılamaz modalından FARKLI). Tek pencerede iki sekme:
 *   - Abonelik: Pro + Ultra planları → startPaddleCheckout
 *   - Kredi Paketi: CREDIT_PACKS → startCreditCheckout
 *
 * Tasarım dili: Didit açık-tema modal (.ais ais-light SADECE kartta), overlay
 * şeffaf karartma + blur. createPortal (Overlay) ile <body>'ye taşınır
 * (koyu-blok blur bug'ı önlenir). GlassButton KULLANILMAZ — accent+beyaz buton.
 *
 * Açma: window event'i.
 *   openPlanPicker({ reason: "feature", feature: "copyTrading" })
 *   → window.dispatchEvent(new CustomEvent("vela:open-plan-picker", { detail }))
 *
 * Global mount: dashboard layout. PADDLE_ENABLED değilse checkout 503 döner →
 * burada nazik "Ödeme yakında" toast'ı gösterilir (çökme yok).
 */

import { useEffect, useState } from "react";
import { Overlay } from "@/components/dashboard/overlay";
import { toast } from "@/components/dashboard/toast";
import { PLANS, CREDIT_PACKS, type PlanId } from "@/lib/plans";
import { startPaddleCheckout, startCreditCheckout } from "@/lib/paddle-client";
import { useUsage } from "@/lib/dashboard/use-usage";
import { Sparkles, Check, X, Crown, Coins, Zap } from "lucide-react";

const ACCENT = "var(--ais-accent)";

type Reason = "limit" | "feature";
type OpenDetail = { reason?: Reason; feature?: string; title?: string; desc?: string };
type Tab = "subscription" | "credits";

const FEATURE_LABEL: Record<string, string> = {
  webResearch: "Web araştırması",
  copyTrading: "Kopya İşlem",
  taxCenter: "Vergi Merkezi",
  bestModel: "En güçlü model",
  fileUpload: "Dosya yükleme",
  advancedAnalytics: "Gelişmiş Analizler",
  aiPortfolios: "Yapay Zeka Portföyleri",
  strategyBuilder: "Strateji Kurucu",
  optionsAndBonds: "Opsiyon & Tahvil",
  pulse: "Finovela Pulse",
};

// Plan kart öne çıkan özellikleri (kısa, satışa dönük).
const PLAN_PERKS: Record<"pro" | "unlimited", string[]> = {
  pro: [
    "Günde 200 yapay zeka mesajı",
    "Web araştırması + dosya yükleme",
    "Kopya İşlem & gelişmiş analiz",
    "Strateji kurucu + AI portföyler",
  ],
  unlimited: [
    "Günde 1000 mesaj, en güçlü model",
    "Vergi Merkezi (zarar hasadı)",
    "Sınırsız bağlı hesap & otomasyon",
    "Pro'daki her şey",
  ],
};

const PLAN_ORDER: PlanId[] = ["free", "pro", "unlimited"];

/** Programatik açma yardımcısı. */
export function openPlanPicker(detail?: OpenDetail) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("vela:open-plan-picker", { detail }));
  }
}

export function PlanPicker() {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<OpenDetail>({});
  const [tab, setTab] = useState<Tab>("subscription");
  const [busy, setBusy] = useState<string | null>(null);
  const usage = useUsage();

  useEffect(() => {
    const onOpen = (e: Event) => {
      const d = (e as CustomEvent<OpenDetail>).detail ?? {};
      setDetail(d);
      setTab("subscription");
      setOpen(true);
    };
    window.addEventListener("vela:open-plan-picker", onOpen);
    return () => window.removeEventListener("vela:open-plan-picker", onOpen);
  }, []);

  // ESC ile kapat + açıkken sayfa scroll kilidi.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const reason: Reason = detail.reason ?? "limit";
  const featureName = detail.feature ? FEATURE_LABEL[detail.feature] ?? detail.feature : null;

  const title =
    detail.title ??
    (reason === "limit"
      ? "Planını yükselt"
      : featureName
        ? `${featureName} üst planlara özel`
        : "Planını yükselt");

  const desc =
    detail.desc ??
    (reason === "limit"
      ? "Daha fazla yapay zeka, otomasyon ve gelişmiş araç için bir plan seç — ya da tek seferlik kredi al."
      : "Bu özelliğin kilidini açmak için bir plana geç veya kredi paketi al.");

  const currentPlan = usage.plan;
  const currentRank = PLAN_ORDER.indexOf(currentPlan);

  async function handlePlan(plan: "pro" | "unlimited") {
    setBusy(plan);
    const err = await startPaddleCheckout(plan);
    setBusy(null);
    if (err) {
      toast.error("Ödeme yakında", err);
    } else {
      setOpen(false);
    }
  }

  async function handleCredit(pack: "small" | "medium" | "large") {
    setBusy(`credit:${pack}`);
    const err = await startCreditCheckout(pack);
    setBusy(null);
    if (err) {
      toast.error("Ödeme yakında", err);
    } else {
      setOpen(false);
    }
  }

  return (
    <Overlay>
      <div
        className="fixed inset-0 z-[60] grid place-items-center p-4"
        style={{
          background: "rgba(17,17,20,0.28)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
        }}
        onClick={() => setOpen(false)}
      >
        <div
          className="ais ais-light relative w-full max-w-2xl overflow-hidden rounded-2xl border bg-[var(--ais-surface)] shadow-[0_32px_80px_-20px_rgba(0,0,0,0.45)]"
          style={{ borderColor: "var(--ais-line)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setOpen(false)}
            className="absolute right-5 top-5 z-10 text-[var(--ais-fg-faint)] transition hover:text-[var(--ais-fg)]"
            aria-label="Kapat"
          >
            <X size={18} />
          </button>

          {/* başlık */}
          <div className="px-6 pt-6 pb-4">
            <span
              className="grid h-10 w-10 place-items-center rounded-xl"
              style={{ background: "var(--ais-accent-bg)", color: ACCENT }}
            >
              <Sparkles size={20} />
            </span>
            <h2 className="mt-3.5 text-[17px] font-semibold text-[var(--ais-fg)]">{title}</h2>
            <p className="mt-1.5 max-w-md text-[13px] leading-relaxed text-[var(--ais-fg-muted)]">
              {desc}
            </p>
          </div>

          {/* sekmeler */}
          <div className="px-6">
            <div
              className="inline-flex rounded-lg border p-0.5"
              style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface-2)" }}
              role="tablist"
            >
              <TabButton
                active={tab === "subscription"}
                onClick={() => setTab("subscription")}
                icon={<Zap size={14} />}
                label="Abonelik"
              />
              <TabButton
                active={tab === "credits"}
                onClick={() => setTab("credits")}
                icon={<Coins size={14} />}
                label="Kredi Paketi"
              />
            </div>
          </div>

          {/* içerik */}
          <div className="max-h-[60vh] overflow-y-auto px-6 pb-6 pt-4">
            {tab === "subscription" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {(["pro", "unlimited"] as const).map((id) => {
                  const plan = PLANS[id];
                  const rank = PLAN_ORDER.indexOf(id);
                  // Mevcut plandan düşük/eşit olanı devre dışı bırak.
                  const owned = rank <= currentRank;
                  return (
                    <PlanCard
                      key={id}
                      name={`Finovela ${plan.name}`}
                      price={`$${plan.priceMonthly}`}
                      period="/ay"
                      blurb={plan.blurb}
                      perks={PLAN_PERKS[id]}
                      crown={id === "unlimited"}
                      highlight={id === "pro"}
                      owned={owned}
                      busy={busy === id}
                      ctaLabel={
                        owned
                          ? currentPlan === id
                            ? "Mevcut planın"
                            : "Daha düşük plan"
                          : `${plan.name}'a geç`
                      }
                      onClick={() => handlePlan(id)}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-3">
                {CREDIT_PACKS.map((pack) => (
                  <CreditCard
                    key={pack.id}
                    name={pack.name}
                    credits={pack.credits}
                    price={`$${pack.price}`}
                    popular={pack.popular}
                    busy={busy === `credit:${pack.id}`}
                    onClick={() => handleCredit(pack.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Overlay>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      role="tab"
      aria-selected={active}
      className="flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-[13px] font-medium transition"
      style={{
        background: active ? "var(--ais-surface)" : "transparent",
        color: active ? "var(--ais-fg)" : "var(--ais-fg-muted)",
        boxShadow: active ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function PlanCard({
  name,
  price,
  period,
  blurb,
  perks,
  crown,
  highlight,
  owned,
  busy,
  ctaLabel,
  onClick,
}: {
  name: string;
  price: string;
  period: string;
  blurb: string;
  perks: string[];
  crown?: boolean;
  highlight?: boolean;
  owned?: boolean;
  busy?: boolean;
  ctaLabel: string;
  onClick: () => void;
}) {
  return (
    <div
      className="flex flex-col rounded-xl border p-4"
      style={{
        borderColor: highlight && !owned ? "var(--ais-accent)" : "var(--ais-line)",
        background: highlight && !owned ? "var(--ais-accent-bg)" : "var(--ais-surface)",
        opacity: owned ? 0.7 : 1,
      }}
    >
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-[14px] font-semibold text-[var(--ais-fg)]">
          {crown && <Crown size={15} style={{ color: ACCENT }} />}
          {name}
        </p>
      </div>
      <p className="mt-1 text-[12px] leading-snug text-[var(--ais-fg-muted)]">{blurb}</p>
      <p className="mt-3 flex items-baseline gap-1">
        <span className="num text-[24px] font-semibold text-[var(--ais-fg)]">{price}</span>
        <span className="text-[12px] text-[var(--ais-fg-muted)]">{period}</span>
      </p>
      <ul className="mt-3 flex-1 space-y-1.5">
        {perks.map((p) => (
          <li
            key={p}
            className="flex items-start gap-2 text-[12.5px] text-[var(--ais-fg-muted)]"
          >
            <Check size={14} className="mt-0.5 shrink-0" style={{ color: ACCENT }} />
            {p}
          </li>
        ))}
      </ul>
      <button
        onClick={onClick}
        disabled={owned || busy}
        className="mt-4 flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-[13px] font-semibold transition disabled:cursor-not-allowed"
        style={
          owned
            ? {
                background: "var(--ais-surface-2)",
                color: "var(--ais-fg-muted)",
                border: "1px solid var(--ais-line)",
              }
            : { background: ACCENT, color: "#fff", opacity: busy ? 0.7 : 1 }
        }
      >
        {!owned && <Sparkles size={14} />}
        {busy ? "Açılıyor…" : ctaLabel}
      </button>
    </div>
  );
}

function CreditCard({
  name,
  credits,
  price,
  popular,
  busy,
  onClick,
}: {
  name: string;
  credits: number;
  price: string;
  popular?: boolean;
  busy?: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className="relative flex flex-col rounded-xl border p-4 text-center"
      style={{
        borderColor: popular ? "var(--ais-accent)" : "var(--ais-line)",
        background: popular ? "var(--ais-accent-bg)" : "var(--ais-surface)",
      }}
    >
      {popular && (
        <span
          className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
          style={{ background: ACCENT }}
        >
          Popüler
        </span>
      )}
      <span
        className="mx-auto grid h-10 w-10 place-items-center rounded-xl"
        style={{ background: "var(--ais-accent-bg)", color: ACCENT }}
      >
        <Coins size={20} />
      </span>
      <p className="mt-2.5 text-[13.5px] font-semibold text-[var(--ais-fg)]">{name}</p>
      <p className="num mt-0.5 text-[12.5px] text-[var(--ais-fg-muted)]">
        {credits.toLocaleString("en-US")} kredi
      </p>
      <p className="num mt-2 text-[20px] font-semibold text-[var(--ais-fg)]">{price}</p>
      <button
        onClick={onClick}
        disabled={busy}
        className="mt-3 rounded-lg py-2 text-[13px] font-semibold text-white transition disabled:cursor-not-allowed"
        style={{ background: ACCENT, opacity: busy ? 0.7 : 1 }}
      >
        {busy ? "Açılıyor…" : "Satın al"}
      </button>
    </div>
  );
}
