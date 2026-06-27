"use client";

// Pricing sayfası plan CTA'sı — plana göre akıllı yönlendirme:
//   free       → /app (kayıt/giriş)
//   pro/unlimited:
//      girişli  → Paddle overlay checkout aç
//      girişsiz → /sign-up?redirect (giriş sonrası tekrar denesin)
// Paddle yapılandırılmamışsa checkout 503 döner → kullanıcıya nazik mesaj.

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { CLERK_ENABLED } from "@/lib/auth";
import { GlassButton } from "@/components/ui/glass-button";
import { startPaddleCheckout } from "@/lib/paddle-client";
import type { PlanId } from "@/lib/plans";

export function PlanCta({
  planId,
  label,
  highlight,
}: {
  planId: PlanId;
  label: string;
  highlight?: boolean;
}) {
  // Free her zaman /app'e gider — auth durumuna bakmaya gerek yok.
  if (planId === "free") {
    return (
      <GlassButton href="/app" tone={highlight ? "solid" : "glass"} size="lg" className="mt-7 w-full">
        {label}
      </GlassButton>
    );
  }
  if (!CLERK_ENABLED) {
    return (
      <GlassButton href="/app" tone={highlight ? "solid" : "glass"} size="lg" className="mt-7 w-full">
        {label}
      </GlassButton>
    );
  }
  return <PaidCta planId={planId} label={label} highlight={highlight} />;
}

function PaidCta({ planId, label, highlight }: { planId: PlanId; label: string; highlight?: boolean }) {
  const { isSignedIn } = useAuth();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function go() {
    if (!isSignedIn) {
      window.location.href = `/sign-up?redirect_url=${encodeURIComponent("/pricing")}`;
      return;
    }
    setBusy(true);
    setErr("");
    const error = await startPaddleCheckout(planId as "pro" | "unlimited");
    if (error) setErr(error);
    setBusy(false);
  }

  return (
    <div className="mt-7">
      <GlassButton onClick={go} tone={highlight ? "solid" : "glass"} size="lg" className="w-full" disabled={busy}>
        {busy ? "Yönlendiriliyor…" : label}
      </GlassButton>
      {err && <p className="mt-2 text-center text-xs text-[#ff6b6b]">{err}</p>}
    </div>
  );
}
