"use client";

import { useState } from "react";
import { AIS_ACCENT } from "@/components/dashboard/ais-kit";
import { Spinner, ArrowUp, Gear } from "@phosphor-icons/react";
import type { PlanId } from "@/lib/plans";

/** Plana göre: Free → yükselt (checkout); ücretli → aboneliği yönet (portal). */
export function BillingActions({ planId }: { planId: PlanId }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function checkout(plan: "pro" | "unlimited") {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      setErr(data.error ?? "Başlatılamadı.");
    } catch {
      setErr("Ağ hatası.");
    }
    setBusy(false);
  }

  async function portal() {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (data.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      setErr(data.error ?? "Portal açılamadı.");
    } catch {
      setErr("Ağ hatası.");
    }
    setBusy(false);
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      {planId === "free" ? (
        <button
          onClick={() => checkout("pro")}
          disabled={busy}
          className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-medium transition disabled:opacity-50"
          style={{ background: "var(--ais-accent-bg)", color: AIS_ACCENT }}
        >
          {busy ? <Spinner size={14} className="animate-spin" /> : <ArrowUp size={14} weight="bold" />}
          Pro'ya yükselt
        </button>
      ) : planId === "pro" ? (
        <div className="flex gap-2">
          <button
            onClick={() => checkout("unlimited")}
            disabled={busy}
            className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] font-medium transition disabled:opacity-50"
            style={{ background: "var(--ais-accent-bg)", color: AIS_ACCENT }}
          >
            <ArrowUp size={14} weight="bold" /> Unlimited
          </button>
          <button
            onClick={portal}
            disabled={busy}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--ais-line-strong)] px-3.5 py-2 text-[13px] font-medium text-[var(--ais-fg-muted)] transition hover:bg-[var(--ais-surface-2)] disabled:opacity-50"
          >
            <Gear size={14} /> Yönet
          </button>
        </div>
      ) : (
        <button
          onClick={portal}
          disabled={busy}
          className="flex items-center gap-1.5 rounded-lg border border-[var(--ais-line-strong)] px-4 py-2 text-[13px] font-medium text-[var(--ais-fg)] transition hover:bg-[var(--ais-surface-2)] disabled:opacity-50"
        >
          {busy ? <Spinner size={14} className="animate-spin" /> : <Gear size={14} />}
          Aboneliği yönet
        </button>
      )}
      {err && <p className="text-[11px] text-[#f28b82]">{err}</p>}
    </div>
  );
}
