"use client";

/**
 * UpgradeModal — kredi bitince ya da kilitli bir özellik tıklanınca açılan
 * yükseltme penceresi. Global mount edilir (dashboard layout) ve dünyanın her
 * yerinden `window.dispatchEvent('vela:open-upgrade')` ile açılabilir.
 *
 * Tasarım dili: Didit açık-tema modal (goals GoalEditor deseni) —
 * overlay şeffaf karartma + blur, .ais-light SADECE kartta.
 *
 * Opsiyonel detay: event'e CustomEvent.detail ile { reason, feature } geçilebilir.
 *   window.dispatchEvent(new CustomEvent('vela:open-upgrade', { detail: { reason: 'limit' } }))
 */

import { useEffect, useState } from "react";
import { Overlay } from "@/components/dashboard/overlay";
import Link from "next/link";
import { PLANS } from "@/lib/plans";
import { Sparkles, Check, X, Crown } from "lucide-react";

const ACCENT = "var(--ais-accent)";

type Reason = "limit" | "feature";

type OpenDetail = { reason?: Reason; feature?: string; title?: string; desc?: string };

const FEATURE_LABEL: Record<string, string> = {
  webResearch: "Web araştırması",
  copyTrading: "Kopya İşlem",
  taxCenter: "Vergi Merkezi",
  bestModel: "En güçlü model",
  fileUpload: "Dosya yükleme",
};

/** Programatik açma yardımcısı. */
export function openUpgrade(detail?: OpenDetail) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("vela:open-upgrade", { detail }));
  }
}

export function UpgradeModal() {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<OpenDetail>({});

  useEffect(() => {
    const onOpen = (e: Event) => {
      const d = (e as CustomEvent<OpenDetail>).detail ?? {};
      setDetail(d);
      setOpen(true);
    };
    window.addEventListener("vela:open-upgrade", onOpen);
    return () => window.removeEventListener("vela:open-upgrade", onOpen);
  }, []);

  // ESC ile kapat
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  const reason: Reason = detail.reason ?? "limit";
  const featureName = detail.feature ? FEATURE_LABEL[detail.feature] ?? detail.feature : null;

  const title =
    detail.title ??
    (reason === "limit"
      ? "Günlük yapay zeka hakkın doldu"
      : featureName
        ? `${featureName} üst planlara özel`
        : "Bu özellik üst planlara özel");

  const desc =
    detail.desc ??
    (reason === "limit"
      ? "Free planda günlük sohbet limitine ulaştın. Pro'ya yükselterek sınırsız yapay zeka, otomasyon ve veriye eriş."
      : "Pro veya Unlimited plana yükselterek bu özelliğin kilidini aç.");

  const pro = PLANS.pro;
  const unlimited = PLANS.unlimited;

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
        className="ais ais-light relative w-full max-w-md overflow-hidden rounded-2xl border bg-[var(--ais-surface)] shadow-[0_32px_80px_-20px_rgba(0,0,0,0.45)]"
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
          <h2 className="mt-3.5 text-[16px] font-semibold text-[var(--ais-fg)]">{title}</h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--ais-fg-muted)]">{desc}</p>
        </div>

        {/* plan özetleri */}
        <div className="grid gap-2.5 px-6">
          <PlanRow
            name={`Finovela ${pro.name}`}
            price={`$${pro.priceMonthly}/ay`}
            perks={["Sınırsız yapay zeka sohbeti", "Web araştırması + dosya yükleme", "Kopya İşlem & sınırsız otomasyon"]}
            highlight
          />
          <PlanRow
            name={`Finovela ${unlimited.name}`}
            price={`$${unlimited.priceMonthly}/ay`}
            perks={["En güçlü AI modeli", "Vergi Merkezi (zarar hasadı)", "Sınırsız bağlı hesap"]}
            crown
          />
        </div>

        {/* CTA */}
        <div className="mt-5 flex gap-2.5 border-t px-6 py-4" style={{ borderColor: "var(--ais-line)" }}>
          <button
            onClick={() => setOpen(false)}
            className="rounded-lg border px-4 py-2.5 text-[13px] font-medium text-[var(--ais-fg-muted)] transition hover:bg-[var(--ais-surface-2)]"
            style={{ borderColor: "var(--ais-line-strong)" }}
          >
            Şimdi değil
          </button>
          <Link
            href="/dashboard/billing"
            onClick={() => setOpen(false)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-[13px] font-semibold text-white transition"
            style={{ background: ACCENT }}
          >
            <Sparkles size={15} />
            Pro&apos;ya yükselt
          </Link>
        </div>
      </div>
    </div>
    </Overlay>
  );
}

function PlanRow({
  name,
  price,
  perks,
  highlight,
  crown,
}: {
  name: string;
  price: string;
  perks: string[];
  highlight?: boolean;
  crown?: boolean;
}) {
  return (
    <div
      className="rounded-xl border p-4"
      style={{
        borderColor: highlight ? "var(--ais-accent)" : "var(--ais-line)",
        background: highlight ? "var(--ais-accent-bg)" : "var(--ais-surface)",
      }}
    >
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-[13.5px] font-semibold text-[var(--ais-fg)]">
          {crown && <Crown size={14} style={{ color: ACCENT }} />}
          {name}
        </p>
        <p className="num text-[13px] font-medium text-[var(--ais-fg)]">{price}</p>
      </div>
      <ul className="mt-2.5 space-y-1.5">
        {perks.map((p) => (
          <li key={p} className="flex items-start gap-2 text-[12.5px] text-[var(--ais-fg-muted)]">
            <Check size={14} className="mt-0.5 shrink-0" style={{ color: ACCENT }} />
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
}
