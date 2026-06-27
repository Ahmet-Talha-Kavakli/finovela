"use client";

import { useState } from "react";
import { useConfirm } from "@/components/dashboard/confirm";
import { useSecurity } from "@/lib/dashboard/use-security";
import { CLERK_ENABLED } from "@/lib/auth";
import { useClerk } from "@clerk/nextjs";
import {
  ShieldCheck,
  Lock,
  Key,
  Copy,
  Check,
  X,
} from "lucide-react";

// Didit açık-tema renkleri.
const ACCENT = "var(--ais-accent)";
const UP = "var(--ais-green)";
const DOWN = "#d93025";

/** Gerçek Clerk hesap-güvenliği ekranını açar (2FA/parola/e-posta/cihazlar). */
function ManageAccountButton() {
  // CLERK_ENABLED build-time sabiti — koşullu hook değil, iki ayrı bileşen.
  if (!CLERK_ENABLED) {
    return (
      <span
        className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium"
        style={{ background: "var(--ais-green-bg)", color: UP }}
      >
        Demo
      </span>
    );
  }
  return <ClerkManageButton />;
}

function ClerkManageButton() {
  const clerk = useClerk();
  return (
    <button
      onClick={() => clerk.openUserProfile()}
      className="shrink-0 rounded-lg px-3 py-1.5 text-[12px] font-medium transition"
      style={{ background: "var(--ais-accent-bg)", color: ACCENT }}
    >
      Güvenliği yönet
    </button>
  );
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex h-6 w-11 shrink-0 items-center rounded-full px-0.5 transition"
      style={{ background: on ? ACCENT : "var(--ais-surface-2)" }}
    >
      <span
        className={`h-5 w-5 rounded-full transition ${on ? "translate-x-5" : ""}`}
        style={{ background: on ? "#fff" : "var(--ais-fg-faint)" }}
      />
    </button>
  );
}

function Row({ label, desc, control }: { label: string; desc: string; control: React.ReactNode }) {
  return (
    <div
      className="flex items-center justify-between border-b py-4 last:border-0"
      style={{ borderColor: "var(--ais-line)" }}
    >
      <div className="pr-4">
        <p className="text-[13px] font-medium text-[var(--ais-fg)]">{label}</p>
        <p className="text-[12px] text-[var(--ais-fg-muted)]">{desc}</p>
      </div>
      {control}
    </div>
  );
}

export function NotificationPrefs() {
  const { state, setNotif } = useSecurity();
  const n = state.notif;
  return (
    <div
      className="rounded-xl border px-5"
      style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}
    >
      <Row label="Fiyat alarmları" desc="Varlık ve izleme listesindeki büyük hareketler" control={<Toggle on={n.priceAlerts} onClick={() => setNotif("priceAlerts", !n.priceAlerts)} />} />
      <Row label="Finovela günlük brifing" desc="Portföyünün sabah özeti" control={<Toggle on={n.dailyBrief} onClick={() => setNotif("dailyBrief", !n.dailyBrief)} />} />
      <Row label="Bilanço hatırlatmaları" desc="Varlıkların bilanço açıklamadan önce" control={<Toggle on={n.earnings} onClick={() => setNotif("earnings", !n.earnings)} />} />
      <Row label="Otomasyon etkinliği" desc="Bir ajan işlem gerçekleştirdiğinde" control={<Toggle on={n.automation} onClick={() => setNotif("automation", !n.automation)} />} />
    </div>
  );
}

export function SecurityPanel() {
  const { state, setPin, disablePin, regenerateBackupCodes } = useSecurity();
  const confirm = useConfirm();
  const [pinOpen, setPinOpen] = useState(false);
  const [pin, setPinVal] = useState("");
  const [pin2, setPin2] = useState("");
  const [pinErr, setPinErr] = useState("");
  const [codesOpen, setCodesOpen] = useState(false);
  const [codes, setCodes] = useState<string[]>(state.backupCodes);
  const [copied, setCopied] = useState(false);

  function savePin() {
    if (pin.length < 4) {
      setPinErr("PIN en az 4 hane olmalı.");
      return;
    }
    if (pin !== pin2) {
      setPinErr("PIN'ler eşleşmiyor.");
      return;
    }
    setPin(pin);
    setPinOpen(false);
    setPinVal("");
    setPin2("");
    setPinErr("");
  }

  async function onDisablePin() {
    const ok = await confirm({
      title: "İşlem PIN'ini kaldır",
      message: "Yüksek tutarlı işlemlerde artık PIN sorulmayacak. Emin misin?",
      confirmLabel: "Kaldır",
      cancelLabel: "Vazgeç",
      tone: "danger",
    });
    if (ok) disablePin();
  }

  function showCodes() {
    const c = state.backupCodes.length ? state.backupCodes : regenerateBackupCodes();
    setCodes(c);
    setCodesOpen(true);
  }

  return (
    <>
      <div
        className="rounded-xl border px-5"
        style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}
      >
        {/* İşlem PIN'i */}
        <div className="flex items-center justify-between border-b py-4" style={{ borderColor: "var(--ais-line)" }}>
          <div className="flex items-start gap-3 pr-4">
            <Lock size={18} className="mt-0.5 shrink-0" style={{ color: ACCENT }} />
            <div>
              <p className="text-[13px] font-medium text-[var(--ais-fg)]">İşlem PIN&apos;i</p>
              <p className="text-[12px] text-[var(--ais-fg-muted)]">
                Yüksek tutarlı işlemlerde (Finovela Brain eşiği üstü) PIN sorulur.{" "}
                {state.txPinEnabled ? (
                  <span style={{ color: UP }}>Aktif</span>
                ) : (
                  <span className="text-[var(--ais-fg-faint)]">Kapalı</span>
                )}
              </p>
            </div>
          </div>
          {state.txPinEnabled ? (
            <button
              onClick={onDisablePin}
              className="shrink-0 rounded-lg border px-3 py-1.5 text-[12px] font-medium text-[var(--ais-fg-muted)] transition hover:bg-[var(--ais-surface-2)]"
              style={{ borderColor: "var(--ais-line-strong)" }}
            >
              Kaldır
            </button>
          ) : (
            <button
              onClick={() => setPinOpen(true)}
              className="shrink-0 rounded-lg px-3 py-1.5 text-[12px] font-medium transition"
              style={{ background: "var(--ais-accent-bg)", color: ACCENT }}
            >
              PIN belirle
            </button>
          )}
        </div>

        {/* Yedek kodlar */}
        <div className="flex items-center justify-between border-b py-4" style={{ borderColor: "var(--ais-line)" }}>
          <div className="flex items-start gap-3 pr-4">
            <Key size={18} className="mt-0.5 shrink-0" style={{ color: ACCENT }} />
            <div>
              <p className="text-[13px] font-medium text-[var(--ais-fg)]">İşlem PIN&apos;i kurtarma kodları</p>
              <p className="text-[12px] text-[var(--ais-fg-muted)]">
                İşlem PIN&apos;ini unutursan PIN&apos;i sıfırlamak için tek-kullanımlık
                kodlar. (Hesap girişi 2FA&apos;sı için yukarıdaki &quot;Güvenliği
                yönet&quot;i kullan.)
              </p>
            </div>
          </div>
          <button
            onClick={showCodes}
            className="shrink-0 rounded-lg border px-3 py-1.5 text-[12px] font-medium text-[var(--ais-fg-muted)] transition hover:bg-[var(--ais-surface-2)]"
            style={{ borderColor: "var(--ais-line-strong)" }}
          >
            {state.backupCodes.length ? "Görüntüle" : "Oluştur"}
          </button>
        </div>

        {/* 2FA / parola / e-posta — GERÇEK Clerk hesap yönetimine yönlendirir */}
        <div className="flex items-center justify-between py-4">
          <div className="flex items-start gap-3 pr-4">
            <ShieldCheck size={18} className="mt-0.5 shrink-0" style={{ color: ACCENT }} />
            <div>
              <p className="text-[13px] font-medium text-[var(--ais-fg)]">İki adımlı doğrulama (2FA), parola & e-posta</p>
              <p className="text-[12px] text-[var(--ais-fg-muted)]">
                Authenticator (TOTP) uygulaması ekle, parolanı değiştir, e-postanı
                doğrula ve oturum açan cihazları yönet — hesap güvenliği ekranından.
              </p>
            </div>
          </div>
          <ManageAccountButton />
        </div>
      </div>


      {/* PIN modal */}
      {pinOpen && (
        <Modal onClose={() => setPinOpen(false)}>
          <div className="flex items-center gap-2">
            <Lock size={18} style={{ color: ACCENT }} />
            <h2 className="text-[15px] font-medium text-[var(--ais-fg)]">İşlem PIN&apos;i belirle</h2>
          </div>
          <p className="mt-1.5 text-[13px] text-[var(--ais-fg-muted)]">
            En az 4 haneli bir PIN. Finovela yüksek tutarlı işlemlerden önce bunu soracak.
          </p>
          <input
            value={pin}
            onChange={(e) => setPinVal(e.target.value.replace(/\D/g, "").slice(0, 8))}
            type="password"
            inputMode="numeric"
            placeholder="PIN"
            className="ais-input mt-4 text-center text-[18px] tracking-[0.4em]"
          />
          <input
            value={pin2}
            onChange={(e) => setPin2(e.target.value.replace(/\D/g, "").slice(0, 8))}
            type="password"
            inputMode="numeric"
            placeholder="PIN tekrar"
            className="ais-input mt-2 text-center text-[18px] tracking-[0.4em]"
          />
          {pinErr && <p className="mt-2 text-[12px]" style={{ color: DOWN }}>{pinErr}</p>}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setPinOpen(false)}
              className="flex-1 rounded-lg border py-2.5 text-[13px] font-medium text-[var(--ais-fg-muted)] transition hover:bg-[var(--ais-surface-2)]"
              style={{ borderColor: "var(--ais-line-strong)" }}
            >
              Vazgeç
            </button>
            <button
              onClick={savePin}
              className="flex-1 rounded-lg py-2.5 text-[13px] font-medium text-white transition"
              style={{ background: ACCENT }}
            >
              Kaydet
            </button>
          </div>
        </Modal>
      )}

      {/* Kodlar modal */}
      {codesOpen && (
        <Modal onClose={() => setCodesOpen(false)}>
          <div className="flex items-center gap-2">
            <Key size={18} style={{ color: ACCENT }} />
            <h2 className="text-[15px] font-medium text-[var(--ais-fg)]">Kurtarma kodları</h2>
          </div>
          <p className="mt-1.5 text-[13px] text-[var(--ais-fg-muted)]">
            Her kod bir kez kullanılır. Güvenli bir yere kaydet — bu ekran tekrar gösterilmez.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {codes.map((c) => (
              <span
                key={c}
                className="rounded-lg border py-2 text-center font-mono text-[13px] tracking-wide text-[var(--ais-fg)]"
                style={{ borderColor: "var(--ais-line)" }}
              >
                {c}
              </span>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => {
                navigator.clipboard?.writeText(codes.join("\n"));
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-2.5 text-[13px] font-medium text-[var(--ais-fg-muted)] transition hover:bg-[var(--ais-surface-2)]"
              style={{ borderColor: "var(--ais-line-strong)" }}
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? "Kopyalandı" : "Kopyala"}
            </button>
            <button
              onClick={() => {
                setCodes(regenerateBackupCodes());
              }}
              className="flex-1 rounded-lg border py-2.5 text-[13px] font-medium text-[var(--ais-fg-muted)] transition hover:bg-[var(--ais-surface-2)]"
              style={{ borderColor: "var(--ais-line-strong)" }}
            >
              Yeniden üret
            </button>
            <button
              onClick={() => setCodesOpen(false)}
              className="flex-1 rounded-lg py-2.5 text-[13px] font-medium text-white transition"
              style={{ background: ACCENT }}
            >
              Bitti
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

/* ── Didit açık-tema modal — şeffaf karartma + blur overlay, .ais-light sadece kartta ── */
function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4"
      style={{
        background: "rgba(17,17,20,0.28)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        className="ais ais-light relative w-full max-w-sm rounded-2xl border bg-[var(--ais-surface)] p-6 shadow-[0_32px_80px_-20px_rgba(0,0,0,0.45)]"
        style={{ borderColor: "var(--ais-line)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-[var(--ais-fg-faint)] transition hover:text-[var(--ais-fg)]"
          aria-label="Kapat"
        >
          <X size={18} />
        </button>
        {children}
      </div>
    </div>
  );
}
