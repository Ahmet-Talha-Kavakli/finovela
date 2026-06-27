"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { profileStore } from "@/lib/dashboard/use-profile";
import { brainStore } from "@/lib/dashboard/use-brain";
import { VelaLogo } from "@/components/brand/logo";
import {
  ChartLineUp,
  Wallet,
  CheckCircle,
  Check,
  ArrowLeft,
  ArrowRight,
  Bank,
  CreditCard,
  ArrowsLeftRight,
  Sparkle,
  ShieldCheck,
  IdentificationCard,
  Shield,
  Flame,
  Scales,
  TrendUp,
  Coins,
  Target,
  GraduationCap,
  WarningCircle,
} from "@phosphor-icons/react";

/* ──────────────────────────────────────────────────────────
   Sinematik tam-ekran onboarding — bulanık video arka plan,
   cam kart, yumuşak kayma/fade geçiş. Finovela mavi diliyle.
   Form mantığı dashboard sürümüyle birebir aynı (veri korunur).
   ────────────────────────────────────────────────────────── */

const VIRTUAL_CASH = 100_000;

const STEPS = [
  { id: 1, label: "Profil" },
  { id: 2, label: "Kimlik" },
  { id: 3, label: "Telefon" },
  { id: 4, label: "Yatırım" },
  { id: 5, label: "Para" },
  { id: 6, label: "Tamam" },
] as const;

const LAST_STEP = 6;

// Her adıma sinematik video (yoksa zarifçe gradient zemine düşer).
const STEP_VIDEO: Record<number, string> = {
  1: "/gen/onb-1.mp4",
  2: "/gen/onb-3.mp4", // kimlik → güvenlik/kalkan videosu
  3: "/gen/onb-3.mp4",
  4: "/gen/onb-2.mp4", // yatırım → grafik videosu
  5: "/gen/onb-3.mp4", // para → güvenlik
  6: "/gen/onb-4.mp4", // tamam → yelken
};

const COUNTRIES = [
  "Amerika Birleşik Devletleri",
  "Birleşik Krallık",
  "Kanada",
  "Almanya",
  "Türkiye",
  "Avustralya",
  "Singapur",
  "Japonya",
];

type RiskKey = "conservative" | "balanced" | "aggressive";

const RISK_OPTIONS: {
  key: RiskKey;
  label: string;
  desc: string;
  icon: typeof Shield;
  alloc: { stocks: number; bonds: number; cash: number };
}[] = [
  { key: "conservative", label: "Temkinli", desc: "Sermayeyi koru, istikrarlı getiri.", icon: Shield, alloc: { stocks: 35, bonds: 50, cash: 15 } },
  { key: "balanced", label: "Dengeli", desc: "Yönetilen riskle büyüme.", icon: Scales, alloc: { stocks: 60, bonds: 30, cash: 10 } },
  { key: "aggressive", label: "Agresif", desc: "Uzun vadeli büyümeyi en üst düzeye çıkar.", icon: Flame, alloc: { stocks: 85, bonds: 10, cash: 5 } },
];

const GOALS: { key: string; label: string; icon: typeof TrendUp }[] = [
  { key: "growth", label: "Büyüme", icon: TrendUp },
  { key: "income", label: "Gelir", icon: Coins },
  { key: "retirement", label: "Emeklilik", icon: Target },
  { key: "learning", label: "Öğrenme", icon: GraduationCap },
];

const EXPERIENCE = ["Başlangıç", "Orta", "İleri"];

const FUNDING_METHODS: { key: string; label: string; desc: string; icon: typeof Bank }[] = [
  { key: "ach", label: "Banka / EFT-Havale", desc: "Ücretsiz · 1–3 iş günü", icon: Bank },
  { key: "debit", label: "Banka kartı", desc: "Anında · $25 bine kadar", icon: CreditCard },
  { key: "wire", label: "Havale", desc: "Aynı gün · büyük yatırımlar", icon: ArrowsLeftRight },
];

const QUICK_AMOUNTS = [1000, 5000, 25000];

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const STEP_TITLE: Record<number, { eyebrow: string; title: string; sub: string }> = {
  1: { eyebrow: "Seni tanıyalım", title: "Hesabını oluştur", sub: "Birkaç bilgiyle başlayalım — Finovela'yı sana göre ayarlayacağız." },
  2: { eyebrow: "Kimlik doğrulama", title: "Kimliğini doğrula", sub: "Yatırım hesabı için yasal zorunluluk. Bilgilerin şifreli saklanır." },
  3: { eyebrow: "Güvenlik", title: "Telefonunu doğrula", sub: "Hesabını korumak ve önemli işlem onayları için telefonunu ekle." },
  4: { eyebrow: "Yatırım profilin", title: "Nasıl yatırım yaparsın?", sub: "Finovela buna göre senin için bir başlangıç dağılımı kurar." },
  5: { eyebrow: "Hesabını fonla", title: "Başlangıç için hazırlan", sub: "Yöntemini seç — burada her şey simülasyondur, risk yok." },
  6: { eyebrow: "Tamamlandı", title: "Her şey hazır", sub: "Finovela portföyünü hedeflerine doğru yönetmeye hazır." },
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] text-white/45">{label}</span>
      {children}
    </label>
  );
}

const INPUT =
  "h-12 w-full rounded-xl border border-white/12 bg-white/[0.04] px-4 text-[15px] text-white placeholder:text-white/30 outline-none transition focus:border-[#3b6dff] focus:bg-white/[0.06]";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState<1 | -1>(1); // geçiş yönü (kayma animasyonu için)

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  // adım 2 — KYC
  const [birthDate, setBirthDate] = useState("");
  const [idType, setIdType] = useState<"tc" | "passport" | "other" | "">("");
  const [idNumber, setIdNumber] = useState("");
  const [address, setAddress] = useState("");
  const [docFront, setDocFront] = useState<string | null>(null);
  const [kycBusy, setKycBusy] = useState(false);
  // Didit (gerçek otomatik KYC) — açıksa tek-tıkla doğrulama; kapalıysa form moduna düşer.
  const [diditMode, setDiditMode] = useState<boolean | null>(null); // null=bilinmiyor
  const [diditBusy, setDiditBusy] = useState(false);
  const [diditError, setDiditError] = useState<string | null>(null);
  const [diditStarted, setDiditStarted] = useState(false); // doğrulama penceresi açıldı

  // Gerçek otomatik KYC başlat — Didit oturumu aç, kullanıcıyı doğrulama sayfasına götür.
  async function startDiditVerification() {
    if (diditBusy) return;
    setDiditBusy(true);
    setDiditError(null);
    try {
      const res = await fetch("/api/kyc/session", { method: "POST" });
      const d = (await res.json()) as { ok: boolean; url?: string; demo?: boolean; error?: string };
      if (d.demo) {
        // Servis kapalı → form moduna geç.
        setDiditMode(false);
        return;
      }
      if (d.ok && d.url) {
        setDiditMode(true);
        setDiditStarted(true);
        window.open(d.url, "_blank", "noopener");
      } else {
        setDiditError(d.error ?? "Doğrulama başlatılamadı.");
      }
    } catch {
      setDiditError("Bağlantı hatası. Tekrar dene.");
    } finally {
      setDiditBusy(false);
    }
  }
  // adım 3 — Telefon
  const [phone, setPhone] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [smsSent, setSmsSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  // adım 4-5
  const [risk, setRisk] = useState<RiskKey | null>(null);
  const [goals, setGoals] = useState<string[]>([]);
  const [experience, setExperience] = useState("");
  const [method, setMethod] = useState<string | null>(null);
  const [amount, setAmount] = useState("");

  const selectedRisk = RISK_OPTIONS.find((r) => r.key === risk) ?? null;
  const toggleGoal = (key: string) =>
    setGoals((g) => (g.includes(key) ? g.filter((x) => x !== key) : [...g, key]));

  const canContinue =
    step === 1
      ? name.trim() !== "" && /\S+@\S+\.\S+/.test(email) && country !== ""
      : step === 2
        ? // Didit modunda: doğrulama başlatıldıysa ileri. Form modunda: alanlar dolu.
          diditMode === false
          ? birthDate !== "" && idType !== "" && idNumber.trim().length >= 5
          : diditStarted
        : step === 3
          ? phoneVerified
          : step === 4
            ? risk !== null && goals.length > 0 && experience !== ""
            : step === 5
              ? method !== null
              : true;

  // Adım 2 (KYC) ileri giderken başvuruyu kaydet.
  async function submitKycStep(): Promise<boolean> {
    setKycBusy(true);
    try {
      const res = await fetch("/api/kyc", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fullName: name.trim(),
          birthDate,
          idType,
          idNumber: idNumber.trim(),
          country,
          address: address.trim(),
          docFront,
        }),
      });
      const data = await res.json();
      setKycBusy(false);
      return !!data.ok;
    } catch {
      setKycBusy(false);
      return false;
    }
  }

  const next = async () => {
    if (!canContinue) return;
    // KYC FORM modunda ileri → başvuruyu kaydet. Didit modunda kayıt /api/kyc/session'da
    // yapıldı, webhook durumu güncelliyor; burada tekrar yazma.
    if (step === 2 && diditMode === false) void submitKycStep();
    setDir(1);
    setStep((s) => Math.min(LAST_STEP, s + 1));
  };
  const back = () => {
    setDir(-1);
    setStep((s) => Math.max(1, s - 1));
  };

  // Telefon doğrulama — Netgsm ile GERÇEK SMS (anahtarlar girilince aktif).
  // Servis kapalıyken (demo) kod yanıtta döner ve ekranda gösterilir; akış kilitlenmez.
  const [smsBusy, setSmsBusy] = useState(false);
  const [smsError, setSmsError] = useState<string | null>(null);
  const [smsPhoneE164, setSmsPhoneE164] = useState<string | null>(null);
  const [smsDevCode, setSmsDevCode] = useState<string | null>(null); // demo modda gösterilen kod

  // Ülke seçimine göre telefon varsayılan ülke kodu (TR aksi halde US).
  const phoneCountry: "TR" | "US" = country === "Türkiye" ? "TR" : "US";

  async function sendSms() {
    if (phone.trim().length < 7 || smsBusy) return;
    setSmsBusy(true);
    setSmsError(null);
    try {
      const res = await fetch("/api/phone/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), country: phoneCountry }),
      });
      const d = (await res.json()) as {
        ok: boolean; error?: string; phone?: string; demo?: boolean; devCode?: string;
      };
      if (!d.ok) {
        setSmsError(d.error ?? "Kod gönderilemedi.");
        return;
      }
      if (d.phone) setSmsPhoneE164(d.phone); // normalize edilmiş E.164
      setSmsDevCode(d.demo && d.devCode ? d.devCode : null); // demo modda kodu göster
      setSmsSent(true);
    } catch {
      setSmsError("Bağlantı hatası. Tekrar dene.");
    } finally {
      setSmsBusy(false);
    }
  }

  async function verifySms() {
    if (smsCode.trim().length < 4 || smsBusy) return;
    setSmsBusy(true);
    setSmsError(null);
    try {
      const res = await fetch("/api/phone/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          phone: smsPhoneE164 ?? phone.trim(),
          code: smsCode.trim(),
          country: phoneCountry,
        }),
      });
      const d = (await res.json()) as { ok: boolean; verified?: boolean; error?: string };
      if (d.ok && d.verified) {
        setPhoneVerified(true);
      } else {
        setSmsError(d.error ?? "Kod hatalı. Tekrar dene.");
      }
    } catch {
      setSmsError("Bağlantı hatası. Tekrar dene.");
    } finally {
      setSmsBusy(false);
    }
  }

  // Kimlik belgesi yükleme → data URL (küçük tut).
  function onDoc(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setDocFront(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  }

  const amountNum = Number(amount) || 0;

  const finish = (dest: string) => {
    profileStore.complete({
      name: name.trim(),
      email: email.trim(),
      country,
      risk,
      goals,
      experience,
      fundingMethod: method,
      initialAmount: amountNum,
    });
    if (risk) brainStore.applyRiskProfile(risk);
    if (risk) {
      void fetch("/api/profile", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ riskProfile: risk }),
      }).catch(() => {});
    }
    router.push(dest);
  };

  const t = STEP_TITLE[step];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0a1838]">
      {/* sinematik video arka plan (bulanık) + koyu gradient katman */}
      <CinematicBackground step={step} />

      {/* üst logo */}
      <Link href="/" className="absolute left-8 top-7 z-20 text-white">
        <VelaLogo className="[&_span]:text-xl [&_svg]:h-8 [&_svg]:w-8" />
      </Link>

      {/* içerik */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-24">
        <div className="w-full max-w-lg">
          {/* ilerleme */}
          <div className="mb-8">
            <div className="flex items-center justify-center gap-2">
              {STEPS.map((s) => (
                <div key={s.id} className="flex items-center gap-2">
                  <span
                    className="grid h-7 w-7 place-items-center rounded-full border text-[12px] font-semibold transition-all duration-500"
                    style={{
                      background: step > s.id ? "#3b6dff" : step === s.id ? "rgba(59,109,255,0.18)" : "transparent",
                      borderColor: step >= s.id ? "#3b6dff" : "rgba(255,255,255,0.15)",
                      color: step > s.id ? "#fff" : step === s.id ? "#7fb0ff" : "rgba(255,255,255,0.4)",
                    }}
                  >
                    {step > s.id ? <Check size={14} weight="bold" /> : s.id}
                  </span>
                  {s.id < 4 && (
                    <span
                      className="h-px w-8 transition-all duration-500 sm:w-12"
                      style={{ background: step > s.id ? "#3b6dff" : "rgba(255,255,255,0.12)" }}
                    />
                  )}
                </div>
              ))}
            </div>
            <p className="mt-3 text-center text-[12px] font-medium text-white/40">
              Adım {step} / 4
            </p>
          </div>

          {/* kayan/solan kart — key=step ile her adımda yeniden mount → animasyon */}
          <div
            key={step}
            className="onb-card rounded-[1.7rem] border border-white/12 bg-white/[0.05] p-7 backdrop-blur-2xl shadow-[0_40px_120px_rgba(5,15,40,0.6)] sm:p-9"
            style={{ ["--onb-dir" as string]: dir }}
          >
            <div className="mb-6">
              <span className="text-[13px] font-bold text-[#7fb0ff]">{t.eyebrow}</span>
              <h1 className="font-display mt-1.5 text-[26px] font-bold leading-tight text-white">{t.title}</h1>
              <p className="mt-2 text-[14px] leading-relaxed text-white/55">{t.sub}</p>
            </div>

            {step === 1 && (
              <div className="space-y-4">
                <Field label="Ad soyad">
                  <input className={INPUT} placeholder="Alex Morgan" value={name} onChange={(e) => setName(e.target.value)} />
                </Field>
                <Field label="E-posta">
                  <input type="email" className={INPUT} placeholder="alex@ornek.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </Field>
                <Field label="Ülke">
                  <select
                    className={`${INPUT} appearance-none`}
                    style={{ color: country ? "#fff" : "rgba(255,255,255,0.3)" }}
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  >
                    <option value="" disabled>Bir ülke seçin</option>
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c} className="bg-[#0c1d40] text-white">{c}</option>
                    ))}
                  </select>
                </Field>
              </div>
            )}

            {/* ── Adım 2: KYC / Kimlik doğrulama ── */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-[12px] leading-relaxed text-white/60">
                  <ShieldCheck size={15} weight="fill" className="mt-px shrink-0 text-[#7fb0ff]" />
                  <span>Yatırım hesabı açmak yasal olarak kimlik doğrulaması gerektirir (KYC). Bilgilerin şifreli saklanır, üçüncü kişilerle paylaşılmaz.</span>
                </div>

                {/* Gerçek otomatik doğrulama (Didit). diditMode false olana kadar bunu öner. */}
                {diditMode !== false && (
                  <div className="space-y-3 rounded-2xl border border-[#3b6dff]/25 bg-[#3b6dff]/[0.07] p-4">
                    <div className="flex items-center gap-2">
                      <IdentificationCard size={20} weight="duotone" className="text-[#7fb0ff]" />
                      <span className="text-[14px] font-semibold text-white">Hızlı kimlik doğrulama</span>
                    </div>
                    <p className="text-[12px] leading-relaxed text-white/55">
                      Kimliğini ve selfie&apos;ni güvenli doğrulama ekranında çek — saniyeler içinde otomatik onaylanır.
                    </p>
                    {diditStarted ? (
                      <div className="flex items-center gap-2 rounded-xl border border-[#81c995]/30 bg-[#81c995]/[0.08] p-3 text-[13px] text-white/80">
                        <Check size={16} weight="bold" className="text-[#81c995]" />
                        Doğrulama penceresi açıldı. Bitirince bu sekmeye dön ve devam et.
                      </div>
                    ) : (
                      <button
                        onClick={startDiditVerification}
                        disabled={diditBusy}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#5b8cff] to-[#3b6dff] py-3 text-[14px] font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
                      >
                        {diditBusy ? "Hazırlanıyor…" : "Kimliğimi doğrula"}
                        {!diditBusy && <ArrowRight size={16} weight="bold" />}
                      </button>
                    )}
                    {diditError && (
                      <p className="flex items-center gap-1.5 text-[12px] text-[#ff8a8a]">
                        <WarningCircle size={14} weight="fill" /> {diditError}
                      </p>
                    )}
                    <button
                      onClick={() => setDiditMode(false)}
                      className="text-[12px] text-white/40 underline transition hover:text-white/70"
                    >
                      Bunun yerine belge yükleyerek devam et
                    </button>
                  </div>
                )}

                {/* Manuel form — yalnızca servis kapalıysa ya da kullanıcı belge-yükleme seçtiyse. */}
                {diditMode === false && (
                <>
                <Field label="Doğum tarihi">
                  <input type="date" className={INPUT} value={birthDate} onChange={(e) => setBirthDate(e.target.value)} style={{ colorScheme: "dark" }} />
                </Field>
                <Field label="Kimlik türü">
                  <div className="flex gap-2">
                    {([["tc", "T.C. Kimlik"], ["passport", "Pasaport"], ["other", "Diğer"]] as const).map(([k, lbl]) => (
                      <button
                        key={k}
                        onClick={() => setIdType(k)}
                        className="flex-1 rounded-xl border py-2.5 text-center text-[13px] font-medium transition"
                        style={{
                          borderColor: idType === k ? "#3b6dff" : "rgba(255,255,255,0.1)",
                          background: idType === k ? "rgba(59,109,255,0.12)" : "rgba(255,255,255,0.03)",
                          color: idType === k ? "#fff" : "rgba(255,255,255,0.6)",
                        }}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Kimlik / Pasaport numarası">
                  <input className={INPUT} placeholder="•••••••••••" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} />
                </Field>
                <Field label="Adres (isteğe bağlı)">
                  <input className={INPUT} placeholder="Açık adres" value={address} onChange={(e) => setAddress(e.target.value)} />
                </Field>
                <Field label="Kimlik belgesi (ön yüz)">
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-5 text-[13px] text-white/55 transition hover:border-[#3b6dff] hover:text-white">
                    {docFront ? (
                      <><Check size={16} weight="bold" className="text-[#81c995]" /> Belge yüklendi — değiştir</>
                    ) : (
                      <><IdentificationCard size={18} weight="regular" /> Belgeyi yükle (foto/PDF)</>
                    )}
                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={onDoc} />
                  </label>
                </Field>
                {kycBusy && <p className="text-[12px] text-white/40">Kaydediliyor…</p>}
                </>
                )}
              </div>
            )}

            {/* ── Adım 3: Telefon + SMS doğrulama ── */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-[12px] leading-relaxed text-white/60">
                  <ShieldCheck size={15} weight="fill" className="mt-px shrink-0 text-[#7fb0ff]" />
                  <span>Telefonun hesap güvenliği ve yüksek tutarlı işlem onayları için kullanılır.</span>
                </div>
                <Field label="Telefon numarası">
                  <div className="flex gap-2">
                    <input
                      className={INPUT}
                      placeholder="+90 5xx xxx xx xx"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={phoneVerified}
                    />
                    <button
                      onClick={sendSms}
                      disabled={phone.trim().length < 7 || phoneVerified || smsBusy}
                      className="shrink-0 rounded-xl border border-white/12 px-4 text-[13px] font-medium text-white transition hover:bg-white/8 disabled:opacity-40"
                    >
                      {smsBusy && !smsSent ? "Gönderiliyor…" : smsSent ? "Tekrar gönder" : "Kod gönder"}
                    </button>
                  </div>
                </Field>
                {smsSent && !phoneVerified && (
                  <Field label="SMS doğrulama kodu">
                    <div className="flex gap-2">
                      <input
                        className={INPUT}
                        inputMode="numeric"
                        placeholder="6 haneli kod"
                        value={smsCode}
                        onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      />
                      <button
                        onClick={verifySms}
                        disabled={smsCode.trim().length < 4 || smsBusy}
                        className="shrink-0 rounded-xl bg-gradient-to-r from-[#5b8cff] to-[#3b6dff] px-4 text-[13px] font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
                      >
                        {smsBusy ? "…" : "Doğrula"}
                      </button>
                    </div>
                  </Field>
                )}
                {smsError && (
                  <p className="flex items-center gap-1.5 text-[12px] text-[#ff8a8a]">
                    <WarningCircle size={14} weight="fill" /> {smsError}
                  </p>
                )}
                {smsDevCode && !phoneVerified && (
                  <p className="rounded-lg border border-[#7fb0ff]/25 bg-[#7fb0ff]/[0.08] px-3 py-2 text-[12px] text-white/70">
                    Demo modu (SMS servisi henüz aktif değil) — kodun:{" "}
                    <strong className="font-mono text-white">{smsDevCode}</strong>
                  </p>
                )}
                {phoneVerified && (
                  <div className="flex items-center gap-2 rounded-xl border border-[#81c995]/30 bg-[#81c995]/[0.08] p-3 text-[13px] text-white/80">
                    <Check size={16} weight="bold" className="text-[#81c995]" /> Telefon doğrulandı
                  </div>
                )}
                <button
                  onClick={() => setPhoneVerified(true)}
                  className="text-[12px] text-white/40 underline transition hover:text-white/70"
                >
                  Şimdilik atla
                </button>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-5">
                <div>
                  <p className="mb-2.5 text-[12px] text-white/45">Risk toleransı</p>
                  <div className="grid gap-2.5 sm:grid-cols-3">
                    {RISK_OPTIONS.map((r) => {
                      const Icon = r.icon;
                      const on = risk === r.key;
                      return (
                        <button
                          key={r.key}
                          onClick={() => setRisk(r.key)}
                          className="rounded-2xl border p-3.5 text-left transition"
                          style={{
                            borderColor: on ? "#3b6dff" : "rgba(255,255,255,0.1)",
                            background: on ? "rgba(59,109,255,0.12)" : "rgba(255,255,255,0.03)",
                          }}
                        >
                          <Icon size={20} weight="regular" style={{ color: on ? "#7fb0ff" : "rgba(255,255,255,0.6)" }} />
                          <p className="mt-2.5 text-[14px] font-semibold text-white">{r.label}</p>
                          <p className="mt-1 text-[12px] leading-relaxed text-white/50">{r.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                  {risk === "aggressive" && (
                    <div className="mt-2.5 flex items-start gap-2 text-[12px] leading-relaxed text-white/55">
                      <WarningCircle size={14} weight="regular" className="mt-px shrink-0 text-[#fdd663]" />
                      <span>Agresif profil yüksek getiri hedefler ama büyük dalgalanma ve kayıp riski taşır.</span>
                    </div>
                  )}
                </div>

                <div>
                  <p className="mb-2.5 text-[12px] text-white/45">Hedefler · geçerli olanların hepsini seç</p>
                  <div className="flex flex-wrap gap-2">
                    {GOALS.map((g) => {
                      const Icon = g.icon;
                      const on = goals.includes(g.key);
                      return (
                        <button
                          key={g.key}
                          onClick={() => toggleGoal(g.key)}
                          className="flex items-center gap-2 rounded-full border px-3.5 py-2 text-[13px] font-medium transition"
                          style={{
                            background: on ? "rgba(59,109,255,0.15)" : "rgba(255,255,255,0.03)",
                            borderColor: on ? "#3b6dff" : "rgba(255,255,255,0.1)",
                            color: on ? "#7fb0ff" : "rgba(255,255,255,0.6)",
                          }}
                        >
                          <Icon size={15} weight="regular" />
                          {g.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="mb-2.5 text-[12px] text-white/45">Deneyim seviyesi</p>
                  <div className="flex gap-2">
                    {EXPERIENCE.map((e) => {
                      const on = experience === e;
                      return (
                        <button
                          key={e}
                          onClick={() => setExperience(e)}
                          className="flex-1 rounded-xl border py-2.5 text-center text-[13px] font-medium transition"
                          style={{
                            borderColor: on ? "#3b6dff" : "rgba(255,255,255,0.1)",
                            background: on ? "rgba(59,109,255,0.12)" : "rgba(255,255,255,0.03)",
                            color: on ? "#fff" : "rgba(255,255,255,0.6)",
                          }}
                        >
                          {e}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selectedRisk && (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-center gap-2">
                      <Sparkle size={15} weight="fill" className="text-[#7fb0ff]" />
                      <p className="text-[13px] font-medium text-white">Önerilen başlangıç dağılımı</p>
                    </div>
                    <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-white/10">
                      <span className="h-full" style={{ width: `${selectedRisk.alloc.stocks}%`, background: "#3b6dff" }} />
                      <span className="h-full" style={{ width: `${selectedRisk.alloc.bonds}%`, background: "#7fb0ff" }} />
                      <span className="h-full" style={{ width: `${selectedRisk.alloc.cash}%`, background: "rgba(255,255,255,0.3)" }} />
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                      {[
                        { label: "Hisseler", value: selectedRisk.alloc.stocks },
                        { label: "Tahviller", value: selectedRisk.alloc.bonds },
                        { label: "Nakit", value: selectedRisk.alloc.cash },
                      ].map((a) => (
                        <div key={a.label}>
                          <p className="text-[13px] font-semibold text-white">{a.value}%</p>
                          <p className="text-[11px] text-white/40">{a.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 5 && (
              <div className="space-y-5">
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#3b6dff]/15 text-[#7fb0ff]">
                    <ShieldCheck size={19} weight="regular" />
                  </span>
                  <div>
                    <p className="text-[13.5px] font-semibold text-white">{fmt(VIRTUAL_CASH)} sanal nakit hazır</p>
                    <p className="text-[12px] text-white/50">Sıfır riskle pratik yap — para yatırmaya gerek yok.</p>
                  </div>
                </div>

                <div>
                  <p className="mb-2.5 text-[12px] text-white/45">Para yatırma yöntemi</p>
                  <div className="space-y-2.5">
                    {FUNDING_METHODS.map((m) => {
                      const Icon = m.icon;
                      const on = method === m.key;
                      return (
                        <button
                          key={m.key}
                          onClick={() => setMethod(m.key)}
                          className="flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition"
                          style={{
                            borderColor: on ? "#3b6dff" : "rgba(255,255,255,0.1)",
                            background: on ? "rgba(59,109,255,0.1)" : "rgba(255,255,255,0.03)",
                          }}
                        >
                          <span
                            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
                            style={{ background: on ? "rgba(59,109,255,0.18)" : "rgba(255,255,255,0.06)", color: on ? "#7fb0ff" : "rgba(255,255,255,0.55)" }}
                          >
                            <Icon size={18} weight="regular" />
                          </span>
                          <div className="flex-1">
                            <p className="text-[13.5px] font-semibold text-white">{m.label}</p>
                            <p className="text-[12px] text-white/50">{m.desc}</p>
                          </div>
                          <span
                            className="grid h-5 w-5 place-items-center rounded-full border transition"
                            style={{ background: on ? "#3b6dff" : "transparent", borderColor: on ? "transparent" : "rgba(255,255,255,0.2)", color: "#fff" }}
                          >
                            {on && <Check size={12} weight="bold" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="mb-2.5 text-[12px] text-white/45">Yatırılacak tutar (isteğe bağlı)</p>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[15px] text-white/40">$</span>
                    <input
                      inputMode="numeric"
                      className={`${INPUT} pl-8`}
                      placeholder="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
                    />
                  </div>
                  <div className="mt-2.5 flex gap-2">
                    {QUICK_AMOUNTS.map((q) => (
                      <button
                        key={q}
                        onClick={() => setAmount(String(q))}
                        className="flex-1 rounded-xl border py-2 text-center text-[13px] font-medium transition"
                        style={{
                          borderColor: amountNum === q ? "#3b6dff" : "rgba(255,255,255,0.1)",
                          background: amountNum === q ? "rgba(59,109,255,0.12)" : "rgba(255,255,255,0.03)",
                          color: amountNum === q ? "#fff" : "rgba(255,255,255,0.6)",
                        }}
                      >
                        {fmt(q)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="space-y-5">
                <div className="flex flex-col items-center text-center">
                  <span className="grid h-16 w-16 place-items-center rounded-full bg-[#81c995]/15">
                    <CheckCircle size={36} weight="regular" className="text-[#81c995]" />
                  </span>
                  <p className="mt-4 text-[14px] leading-relaxed text-white/60">
                    Hazırsın{name ? `, ${name.split(" ")[0]}` : ""}. Finovela portföyünü hedeflerine doğru yönetecek.
                  </p>
                </div>

                <div className="space-y-2">
                  {[
                    { label: "Risk toleransı", value: selectedRisk?.label ?? "—" },
                    { label: "Hedefler", value: goals.length > 0 ? goals.map((g) => GOALS.find((x) => x.key === g)?.label).filter(Boolean).join(", ") : "—" },
                    { label: "Deneyim", value: experience || "—" },
                    { label: "Para yatırma", value: method ? FUNDING_METHODS.find((m) => m.key === method)?.label ?? "—" : "—" },
                    { label: "Yatırılan tutar", value: amountNum > 0 ? fmt(amountNum) : "Atlandı" },
                    { label: "Sanal nakit", value: fmt(VIRTUAL_CASH) },
                  ].map((r) => (
                    <div key={r.label} className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.03] px-3.5 py-2.5">
                      <span className="text-[13px] text-white/55">{r.label}</span>
                      <span className="text-[13px] font-medium text-white">{r.value}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-2.5 sm:flex-row">
                  <button
                    onClick={() => finish("/dashboard")}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#5b8cff] to-[#3b6dff] py-3 text-[14px] font-semibold text-white transition hover:brightness-110"
                  >
                    Panele git <ArrowRight size={16} weight="regular" />
                  </button>
                  <button
                    onClick={() => finish("/dashboard/chat")}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-white/15 py-3 text-[14px] font-semibold text-white transition hover:bg-white/10"
                  >
                    <Sparkle size={16} weight="fill" /> Finovela ile başla
                  </button>
                </div>
              </div>
            )}

            {/* alt gezinme */}
            {step < LAST_STEP && (
              <div className="mt-7 flex items-center justify-between">
                {step > 1 ? (
                  <button onClick={back} className="flex items-center gap-1.5 rounded-full border border-white/12 px-4 py-2.5 text-[13px] font-medium text-white/60 transition hover:bg-white/8 hover:text-white">
                    <ArrowLeft size={16} weight="regular" /> Geri
                  </button>
                ) : (
                  <Link href="/dashboard" className="text-[13px] text-white/40 transition hover:text-white">
                    Şimdilik atla
                  </Link>
                )}
                <button
                  onClick={next}
                  disabled={!canContinue}
                  className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#5b8cff] to-[#3b6dff] px-6 py-2.5 text-[14px] font-semibold text-white shadow-[0_8px_24px_rgba(59,109,255,0.4)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-30 disabled:shadow-none"
                >
                  Devam et <ArrowRight size={16} weight="regular" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

/** Adıma göre değişen bulanık sinematik video arka plan (yumuşak çapraz geçiş). */
function CinematicBackground({ step }: { step: number }) {
  const [supported, setSupported] = useState(true);
  const src = STEP_VIDEO[step];

  useEffect(() => {
    // Düşük bağlantıda / video yoksa sadece gradient kalsın.
    const v = document.createElement("video");
    setSupported(typeof v.canPlayType === "function");
  }, []);

  return (
    <div className="absolute inset-0 z-0">
      {/* taban gradient (video yüklenene kadar / fallback) */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_-10%,#16306b_0%,#0c1d40_55%,#0a1838_100%)]" />
      {/* aurora */}
      <div className="vela-aurora-a" />
      <div className="vela-aurora-b" />
      {supported && src && (
        <video
          key={src}
          src={src}
          autoPlay
          loop
          muted
          playsInline
          className="onb-video absolute inset-0 h-full w-full object-cover opacity-40"
        />
      )}
      {/* okunabilirlik için koyu vignette + gradient katman */}
      <div className="absolute inset-0 bg-[radial-gradient(110%_110%_at_50%_30%,transparent_0%,rgba(10,24,56,0.55)_70%,rgba(10,24,56,0.85)_100%)]" />
    </div>
  );
}
