"use client";

import Link from "next/link";
import { useEffect } from "react";

// Dashboard'a özel hata sınırı — bir sayfa çökerse tüm shell (sidebar vb.)
// ayakta kalır, yalnız içerik alanı bu hata kartını gösterir.
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="ais min-h-[70vh] flex items-center justify-center px-6">
      <div
        className="ais-card w-full max-w-md p-8 text-center"
        style={{ color: "var(--ais-fg)" }}
      >
        <p
          className="text-xs font-medium tracking-wide"
          style={{ color: "var(--ais-fg-faint)" }}
        >
          HATA
        </p>
        <h1 className="mt-3 text-xl font-semibold tracking-tight">
          Bu sayfa yüklenemedi
        </h1>
        <p className="mt-3 text-sm" style={{ color: "var(--ais-fg-muted)" }}>
          Beklenmeyen bir sorun oluştu. Tekrar deneyebilir ya da panele
          dönebilirsin.
        </p>

        <div className="mt-7 flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="h-10 rounded-[10px] px-5 text-sm font-medium"
            style={{ background: "var(--ais-accent)", color: "#0a0a0a" }}
          >
            Tekrar dene
          </button>
          <Link
            href="/dashboard"
            className="h-10 inline-flex items-center rounded-[10px] px-5 text-sm font-medium"
            style={{
              border: "1px solid var(--ais-line-strong)",
              color: "var(--ais-fg)",
            }}
          >
            Panele dön
          </Link>
        </div>

        {error?.digest ? (
          <p
            className="mt-6 text-[11px]"
            style={{ color: "var(--ais-fg-faint)" }}
          >
            Referans: {error.digest}
          </p>
        ) : null}
      </div>
    </div>
  );
}
