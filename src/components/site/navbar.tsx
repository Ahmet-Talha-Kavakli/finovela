"use client";

import Link from "next/link";
import { useState } from "react";
import { VelaLogo, VelaMark } from "@/components/brand/logo";
import { useUser, UserButton } from "@clerk/nextjs";
import { CLERK_ENABLED } from "@/lib/auth";
import { SquaresFour } from "@phosphor-icons/react";
import {
  CaretDown,
  ChatCircleDots,
  Robot,
  UsersThree,
  StackSimple,
  ChartLineUp,
  GraduationCap,
  ShieldCheck,
  DownloadSimple,
  User,
  List,
  X,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const PRODUCT_MENU = [
  { icon: ChatCircleDots, label: "Finovela Sohbet", desc: "Claude destekli, web araştırmalı AI sohbet", href: "/product/ai" },
  { icon: Robot, label: "Otomasyon & Alarm", desc: "Otopilot işlem, dengeleme ve uyarılar", href: "/automation" },
  { icon: StackSimple, label: "Strateji Kurucu", desc: "Kod yok, geriye dönük test edilmiş", href: "/product/strategy" },
  { icon: UsersThree, label: "Kopya Yatırım", desc: "En iyi yatırımcıları risksiz kopyala", href: "/copy" },
  { icon: ChartLineUp, label: "Portföy", desc: "Takip, teknik analiz ve Finovela Skoru", href: "/product/portfolio" },
  { icon: ShieldCheck, label: "Vergi Merkezi", desc: "Zarar hasadı, vergiden tasarruf", href: "/product/tax" },
];

const NAV = [
  { label: "Destek", href: "/support" },
  { label: "Blog", href: "/blog" },
  { label: "Araştırma", href: "/research" },
];

const RESOURCES_MENU = [
  { icon: GraduationCap, label: "Akademi", desc: "Yapay zeka ile yatırımı öğren", href: "/academy" },
  { icon: ChartLineUp, label: "Piyasalar", desc: "Canlı fiyatlar ve yükselenler", href: "/markets" },
  { icon: StackSimple, label: "Varlık Listeleri", desc: "Özenle seçilmiş AI takip listeleri", href: "/markets/stocks" },
  { icon: ShieldCheck, label: "Fiyatlandırma", desc: "Planlar ve ücretsiz paket", href: "/pricing" },
];

export function Navbar() {
  const [productOpen, setProductOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Sabit/kilitli nav + HER ZAMAN aktif cam (RockFlow gibi: tepede de buzlu-cam görünür)
  return (
    <header className="nav-glass fixed inset-x-0 top-0 z-50 w-full">
      <div className="mx-auto flex h-[96px] max-w-[1400px] items-center justify-between gap-6 px-8">
        {/* sol: logo + "Chat with Vela" pill (RockFlow birebir) */}
        <div className="flex items-center gap-5">
          <Link href="/" className="shrink-0">
            <VelaLogo className="[&_span]:text-xl [&_svg]:h-8 [&_svg]:w-8" />
          </Link>
          {/* RockFlow pill birebir: açık mavi→lila gradient zemin, maskot ikon, MOR-LİLA GRADIENT metin (Title Case) */}
          <Link
            href="/app"
            style={{ boxShadow: "0 0 18px rgba(59,109,255,0.45), 0 2px 8px rgba(59,109,255,0.30)" }}
            className="group relative hidden h-11 items-center gap-2.5 overflow-hidden rounded-full bg-[linear-gradient(120deg,#a5c4ff_0%,#cfe0ff_50%,#e6f0ff_100%)] px-6 text-base font-bold transition hover:brightness-105 hover:[box-shadow:0_0_26px_rgba(59,109,255,0.6),0_2px_10px_rgba(59,109,255,0.4)] xl:inline-flex"
          >
            {/* maskot ikon: açık zeminde görünür olması için marka mavisi tonunda */}
            <VelaMark className="relative z-10 h-5 w-5 text-[#2b5cf0]" />
            <span className="relative z-10 bg-[linear-gradient(100deg,#2b5cf0_0%,#3b6dff_55%,#5b8cff_100%)] bg-clip-text text-transparent">
              Finovela ile Sohbet Et
            </span>
            {/* animasyonlu parlama (sheen) */}
            <span className="pointer-events-none absolute inset-0 -translate-x-full bg-[linear-gradient(110deg,transparent_30%,rgba(255,255,255,0.65)_50%,transparent_70%)] transition-transform duration-700 ease-out group-hover:translate-x-full" />
          </Link>
        </div>

        {/* orta: menü (RockFlow: Products Support Blog Research Resources) */}
        <nav className="hidden items-center gap-8 lg:flex">
          <div
            className="relative"
            onMouseEnter={() => setProductOpen(true)}
            onMouseLeave={() => setProductOpen(false)}
          >
            <button className="flex items-center gap-1 text-base font-semibold text-white transition hover:text-white/80">
              Ürünler
              <CaretDown
                size={13}
                weight="bold"
                className={cn("mt-0.5 transition-transform", productOpen && "rotate-180")}
              />
            </button>
            {productOpen && (
              <div className="absolute left-1/2 top-full z-50 w-[520px] -translate-x-1/2 pt-4">
                <div className="grid grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-[#0f2148] p-2 shadow-2xl backdrop-blur-xl">
                  {PRODUCT_MENU.map((m) => (
                    <Link
                      key={m.label}
                      href={m.href}
                      className="group flex items-start gap-3 rounded-xl p-3 transition hover:bg-white/8"
                    >
                      <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand/15 text-brand">
                        <m.icon size={18} weight="duotone" />
                      </span>
                      <span>
                        <span className="block text-sm font-medium text-white">{m.label}</span>
                        <span className="block text-xs text-white/50">{m.desc}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
          {NAV.map((n) => (
            <Link
              key={n.label}
              href={n.href}
              className="text-base font-semibold text-white transition hover:text-white/80"
            >
              {n.label}
            </Link>
          ))}
          <div
            className="relative"
            onMouseEnter={() => setResourcesOpen(true)}
            onMouseLeave={() => setResourcesOpen(false)}
          >
            <button className="flex items-center gap-1 text-base font-semibold text-white transition hover:text-white/80">
              Kaynaklar
              <CaretDown
                size={13}
                weight="bold"
                className={cn("mt-0.5 transition-transform", resourcesOpen && "rotate-180")}
              />
            </button>
            {resourcesOpen && (
              <div className="absolute left-1/2 top-full z-50 w-[300px] -translate-x-1/2 pt-4">
                <div className="grid gap-1 rounded-2xl border border-white/10 bg-[#0f2148] p-2 shadow-2xl backdrop-blur-xl">
                  {RESOURCES_MENU.map((m) => (
                    <Link
                      key={m.label}
                      href={m.href}
                      className="group flex items-start gap-3 rounded-xl p-3 transition hover:bg-white/8"
                    >
                      <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand/15 text-brand">
                        <m.icon size={18} weight="duotone" />
                      </span>
                      <span>
                        <span className="block text-sm font-medium text-white">{m.label}</span>
                        <span className="block text-xs text-white/50">{m.desc}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* sağ: girişliyse Panele git + avatar; değilse Üye Ol + İndir */}
        <div className="flex items-center gap-3">
          <AuthActions />
          {/* Download — RockFlow birebir: şeffaf, 1px beyaz kenar, h48 */}
          <Link
            href="/download"
            className="hidden h-12 items-center gap-2 rounded-full border border-white px-5 text-base font-semibold text-white transition hover:bg-white/10 md:inline-flex"
          >
            <DownloadSimple size={20} weight="bold" />
            İndir
          </Link>
          <button
            className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-fg lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
          >
            {mobileOpen ? <X size={18} /> : <List size={18} />}
          </button>
        </div>
      </div>

      {/* mobil menü */}
      {mobileOpen && (
        <div className="ios-glass mt-2 rounded-3xl px-5 py-4 lg:hidden">
          <div className="grid gap-1">
            {PRODUCT_MENU.map((m) => (
              <Link
                key={m.label}
                href={m.href}
                className="flex items-center gap-3 rounded-xl p-3 hover:bg-white/8"
                onClick={() => setMobileOpen(false)}
              >
                <m.icon size={18} weight="duotone" className="text-brand" />
                <span className="text-sm">{m.label}</span>
              </Link>
            ))}
            <div className="my-2 h-px bg-border" />
            {NAV.map((n) => (
              <Link
                key={n.label}
                href={n.href}
                className="rounded-xl p-3 text-sm hover:bg-bg-subtle"
                onClick={() => setMobileOpen(false)}
              >
                {n.label}
              </Link>
            ))}
            <div className="my-2 h-px bg-border" />
            <MobileAuthAction onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}
    </header>
  );
}

/**
 * Navbar'ın sağ aksiyonları — oturum durumuna duyarlı.
 * Clerk KAPALIYSA useUser çağrılamaz (Provider yok) → her zaman "Üye Ol".
 * Clerk AÇIKSA: girişliyse "Panele git" + avatar; değilse "Üye Ol".
 */
function AuthActions() {
  if (!CLERK_ENABLED) return <SignUpPill />;
  return <ClerkAuthActions />;
}

function SignUpPill() {
  return (
    <Link
      href="/app"
      className="hidden h-12 items-center gap-2 rounded-full bg-[#2b5cf0] pl-6 pr-8 text-base font-semibold text-white transition hover:bg-[#3b6dff] sm:inline-flex"
    >
      <User size={19} weight="regular" />
      Üye Ol
    </Link>
  );
}

/** Mobil menü için oturum-duyarlı aksiyon (Üye Ol / Panele git + Çıkış). */
function MobileAuthAction({ onNavigate }: { onNavigate: () => void }) {
  if (!CLERK_ENABLED) {
    return (
      <Link href="/app" onClick={onNavigate} className="flex items-center gap-3 rounded-xl bg-[#2b5cf0] p-3 text-sm font-semibold text-white">
        <User size={18} weight="regular" /> Üye Ol
      </Link>
    );
  }
  return <ClerkMobileAuthAction onNavigate={onNavigate} />;
}

function ClerkMobileAuthAction({ onNavigate }: { onNavigate: () => void }) {
  const { isLoaded, isSignedIn } = useUser();
  if (!isLoaded) return null;
  if (!isSignedIn) {
    return (
      <Link href="/app" onClick={onNavigate} className="flex items-center gap-3 rounded-xl bg-[#2b5cf0] p-3 text-sm font-semibold text-white">
        <User size={18} weight="regular" /> Üye Ol
      </Link>
    );
  }
  return (
    <div className="flex items-center justify-between gap-3 p-1">
      <Link href="/dashboard" onClick={onNavigate} className="flex flex-1 items-center gap-3 rounded-xl bg-[#2b5cf0] p-3 text-sm font-semibold text-white">
        <SquaresFour size={18} weight="regular" /> Panele git
      </Link>
      <UserButton appearance={{ elements: { avatarBox: "h-9 w-9" } }} />
    </div>
  );
}

function ClerkAuthActions() {
  const { isLoaded, isSignedIn } = useUser();
  // Yüklenene kadar yer tutucu (layout sıçramasını önle).
  if (!isLoaded) {
    return <span className="hidden h-12 w-[120px] sm:inline-flex" aria-hidden />;
  }
  if (!isSignedIn) return <SignUpPill />;
  return (
    <div className="flex items-center gap-3">
      <Link
        href="/dashboard"
        className="hidden h-12 items-center gap-2 rounded-full bg-[#2b5cf0] pl-5 pr-6 text-base font-semibold text-white transition hover:bg-[#3b6dff] sm:inline-flex"
      >
        <SquaresFour size={19} weight="regular" />
        Panele git
      </Link>
      <UserButton
        appearance={{ elements: { avatarBox: "h-10 w-10 ring-2 ring-white/20" } }}
      />
    </div>
  );
}
