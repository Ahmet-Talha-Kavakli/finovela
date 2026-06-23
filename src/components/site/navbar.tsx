"use client";

import Link from "next/link";
import { useState } from "react";
import { VelaLogo } from "@/components/brand/logo";
import { GlassButton } from "@/components/ui/glass-button";
import {
  CaretDown,
  ChatCircleDots,
  Robot,
  UsersThree,
  StackSimple,
  ChartLineUp,
  GraduationCap,
  ShieldCheck,
  List,
  X,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const PRODUCT_MENU = [
  { icon: ChatCircleDots, label: "Vela AI", desc: "Chat-to-invest co-pilot", href: "/product/ai" },
  { icon: Robot, label: "Automation", desc: "Bots & auto-rebalancing", href: "/automation" },
  { icon: StackSimple, label: "Strategy Builder", desc: "No-code, backtested", href: "/product/strategy" },
  { icon: UsersThree, label: "Copy Trading", desc: "Mirror top investors", href: "/copy" },
  { icon: ChartLineUp, label: "Portfolio", desc: "Track & analyze", href: "/product/portfolio" },
  { icon: ShieldCheck, label: "Tax Optimization", desc: "Harvest losses, save", href: "/product/tax" },
];

const NAV = [
  { label: "Pricing", href: "/pricing" },
  { label: "Academy", href: "/academy" },
  { label: "Security", href: "/security" },
];

export function Navbar() {
  const [productOpen, setProductOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-3 z-50 mx-auto w-full max-w-6xl px-4">
      <div className="ios-glass flex h-[60px] items-center justify-between gap-4 rounded-full px-5 py-2.5">
        <div className="flex items-center gap-8">
          <Link href="/" className="shrink-0">
            <VelaLogo />
          </Link>
          <nav className="hidden items-center gap-1 lg:flex">
            <div
              className="relative"
              onMouseEnter={() => setProductOpen(true)}
              onMouseLeave={() => setProductOpen(false)}
            >
              <button className="flex items-center gap-1 rounded-full px-3 py-2 text-sm text-fg-muted transition hover:text-fg">
                Product
                <CaretDown
                  size={13}
                  weight="bold"
                  className={cn("transition-transform", productOpen && "rotate-180")}
                />
              </button>
              {productOpen && (
                <div className="absolute left-0 top-full w-[520px] pt-3">
                  <div className="glass grid grid-cols-2 gap-1 rounded-2xl p-2 shadow-2xl">
                    {PRODUCT_MENU.map((m) => (
                      <Link
                        key={m.label}
                        href={m.href}
                        className="group flex items-start gap-3 rounded-xl p-3 transition hover:bg-white/8"
                      >
                        <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
                          <m.icon size={18} weight="duotone" />
                        </span>
                        <span>
                          <span className="block text-sm font-medium text-fg">{m.label}</span>
                          <span className="block text-xs text-fg-subtle">{m.desc}</span>
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
                className="rounded-full px-3 py-2 text-sm text-fg-muted transition hover:text-fg"
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/app"
            className="hidden rounded-full px-4 py-2 text-sm text-fg-muted transition hover:text-fg sm:inline-flex"
          >
            Sign in
          </Link>
          <GlassButton size="sm" tone="brand" href="/app" className="hidden sm:inline-flex">
            Open app
          </GlassButton>
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
                className="flex items-center gap-3 rounded-xl p-3 hover:bg-bg-subtle"
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
          </div>
        </div>
      )}
    </header>
  );
}
