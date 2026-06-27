"use client";

import { useState } from "react";
import { AIS_ACCENT, AIS_UP, AIS_DOWN, AIS_WARN } from "@/components/dashboard/ais-kit";
import { Overlay } from "@/components/dashboard/overlay";
import { X, ShieldCheck, AlertCircle, Loader2, ExternalLink } from "lucide-react";

/**
 * Gerçek borsa bağlama modalı — API key + secret girilir, sunucuda DOĞRULANIR
 * (gerçek API çağrısı), şifreli kaydedilir. Düz metin anahtar yalnızca bu
 * istekte sunucuya gider; tarayıcıda saklanmaz, DB'ye düz yazılmaz.
 */
export function ExchangeConnectModal({
  exchange,
  exchangeName,
  onClose,
  onConnected,
}: {
  exchange: string;
  exchangeName: string;
  onClose: () => void;
  onConnected: () => void;
}) {
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [environment, setEnvironment] = useState<"testnet" | "live">("testnet");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    if (apiKey.trim().length < 8 || apiSecret.trim().length < 8) {
      setError("Lütfen geçerli bir API anahtarı ve secret gir.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/exchange/connect", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ exchange, apiKey: apiKey.trim(), apiSecret: apiSecret.trim(), environment }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "Bağlantı kurulamadı.");
        setBusy(false);
        return;
      }
      onConnected();
    } catch {
      setError("Ağ hatası. Tekrar dene.");
      setBusy(false);
    }
  }

  const docsUrl =
    exchange === "binance"
      ? environment === "testnet"
        ? "https://testnet.binance.vision/"
        : "https://www.binance.com/en/my/settings/api-management"
      : "#";

  return (
    <Overlay>
    <div
      className="fixed inset-0 z-[60] grid place-items-center p-4"
      style={{
        background: "rgba(17,17,20,0.28)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        className="ais ais-light vela-modal-card relative w-full max-w-md rounded-2xl border border-[var(--ais-line-strong)] bg-[var(--ais-surface)] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute right-5 top-5 text-[var(--ais-fg-faint)] transition hover:text-[var(--ais-fg)]">
          <X size={18} />
        </button>

        <div className="flex items-center gap-2">
          <ShieldCheck size={20} style={{ color: AIS_ACCENT }} />
          <h2 className="text-[16px] font-medium text-[var(--ais-fg)]">{exchangeName} hesabını bağla</h2>
        </div>
        <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--ais-fg-muted)]">
          Finovela paranı tutmaz. Kendi {exchangeName} hesabında işlem yapması için
          API anahtarı verirsin. <strong className="text-[var(--ais-fg)]">Yalnızca işlem (Spot)
          yetkisi ver; para çekme yetkisini KAPALI tut.</strong>
        </p>

        {/* ortam seçimi */}
        <div className="mt-4 flex gap-2">
          {(["testnet", "live"] as const).map((env) => (
            <button
              key={env}
              onClick={() => setEnvironment(env)}
              className="flex-1 rounded-lg border py-2 text-[12.5px] font-medium transition"
              style={{
                borderColor: environment === env ? AIS_ACCENT : "var(--ais-line-strong)",
                background: environment === env ? "var(--ais-accent-bg)" : "transparent",
                color: environment === env ? AIS_ACCENT : "var(--ais-fg-muted)",
              }}
            >
              {env === "testnet" ? "Testnet (önerilen)" : "Canlı"}
            </button>
          ))}
        </div>
        {environment === "live" && (
          <div className="mt-2 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-[var(--ais-fg-muted)]">
            <AlertCircle size={13} className="mt-px shrink-0" style={{ color: AIS_WARN }} />
            <span>Canlı modda gerçek paranla işlem yapılır. Önce testnet ile dene.</span>
          </div>
        )}

        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-1.5 block text-[12px] text-[var(--ais-fg-faint)]">API Key</span>
            <input
              className="ais-input"
              placeholder="API anahtarın"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[12px] text-[var(--ais-fg-faint)]">API Secret</span>
            <input
              type="password"
              className="ais-input"
              placeholder="API secret'ın"
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </label>
        </div>

        <a
          href={docsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-[12px] transition hover:underline"
          style={{ color: AIS_ACCENT }}
        >
          {environment === "testnet" ? "Testnet anahtarı nasıl alınır?" : "API anahtarı nasıl oluşturulur?"}
          <ExternalLink size={12} />
        </a>

        {error && (
          <p className="mt-3 flex items-start gap-1.5 text-[12.5px] leading-relaxed" style={{ color: AIS_DOWN }}>
            <AlertCircle size={14} className="mt-px shrink-0" />
            {error}
          </p>
        )}

        <div className="mt-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-[var(--ais-line-strong)] py-2.5 text-[13px] font-medium text-[var(--ais-fg-muted)] transition hover:bg-[var(--ais-surface-2)]"
          >
            Vazgeç
          </button>
          <button
            onClick={submit}
            disabled={busy}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-[13px] font-medium transition disabled:opacity-50"
            style={{ background: "var(--ais-accent-bg)", color: AIS_ACCENT }}
          >
            {busy ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Doğrulanıyor…
              </>
            ) : (
              <>
                <ShieldCheck size={15} /> Doğrula & Bağla
              </>
            )}
          </button>
        </div>

        <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-[var(--ais-fg-faint)]">
          <ShieldCheck size={12} fill="currentColor" style={{ color: AIS_UP }} />
          Anahtarların AES-256 ile şifrelenir, asla düz metin saklanmaz.
        </p>
      </div>
    </div>
    </Overlay>
  );
}
