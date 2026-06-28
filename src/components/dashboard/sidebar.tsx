"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { VelaLogo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import { useMobileNav, mobileNav } from "@/lib/dashboard/use-mobile-nav";
import { useSidebarCollapsed } from "@/lib/dashboard/use-sidebar";
import { UserChip } from "@/components/dashboard/user-chip";
import {
  SquaresFour,
  ChatCircleDots,
  ChartPieSlice,
  TrendUp,
  StackSimple,
  Robot,
  UsersThree,
  MagnifyingGlass,
  Gear,
  Coins,
  Cards,
  Stack,
  BellSimple,
  UsersFour,
  CalendarBlank,
  Sparkle as SparkleIcon,
  Receipt,
  Scales,
  ChartBar,
  Funnel,
  Newspaper,
  Target,
  Brain,
  Flask,
  Pulse,
  CaretLeft,
  CaretRight,
  Plugs,
  ArrowsLeftRight,
  CreditCard,
  ClockCounterClockwise,
} from "@phosphor-icons/react";

// Mantıksal gruplar — Didit/Linear deseni: az sayıda anlamlı bölüm, YENİ-spam yok.
// plan: "pro" | "unlimited" → glass Pro etiketi (madde 5).
type NavItem = { href: string; label: string; icon: typeof SquaresFour; plan?: "pro" | "unlimited" };
type NavGroup = { title?: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    // Ana — günlük giriş noktaları
    items: [
      { href: "/dashboard", label: "Genel Bakış", icon: SquaresFour },
      { href: "/dashboard/chat", label: "Finovela Sohbet", icon: ChatCircleDots },
      { href: "/dashboard/brain", label: "Finovela Brain", icon: Brain },
    ],
  },
  {
    title: "Portföy",
    items: [
      { href: "/dashboard/portfolio", label: "Portföy", icon: ChartPieSlice },
      { href: "/dashboard/analytics", label: "Analizler", icon: ChartBar },
      { href: "/dashboard/goals", label: "Hedefler", icon: Target },
      { href: "/dashboard/whatif", label: "What-If Stüdyosu", icon: Flask },
      { href: "/dashboard/transactions", label: "Geçmiş İşlemler", icon: ClockCounterClockwise },
    ],
  },
  {
    title: "Piyasalar",
    items: [
      { href: "/dashboard/markets", label: "Piyasalar", icon: TrendUp },
      { href: "/dashboard/screener", label: "Tarama", icon: Funnel },
      { href: "/dashboard/compare", label: "Karşılaştır", icon: ArrowsLeftRight },
      { href: "/dashboard/news", label: "Haberler", icon: Newspaper },
      { href: "/dashboard/earnings", label: "Bilançolar", icon: CalendarBlank },
      { href: "/dashboard/pulse", label: "Finovela Pulse", icon: Pulse },
    ],
  },
  {
    title: "Araçlar",
    items: [
      { href: "/dashboard/portfolios", label: "Akıllı Portföyler", icon: Stack },
      { href: "/dashboard/generated", label: "Yapay Zeka Portföyleri", icon: SparkleIcon },
      { href: "/dashboard/strategy", label: "Strateji", icon: StackSimple },
      { href: "/dashboard/automation", label: "Otomasyon", icon: Robot },
      { href: "/dashboard/alerts", label: "Alarmlar", icon: BellSimple },
      { href: "/dashboard/options", label: "Opsiyonlar", icon: Cards },
      { href: "/dashboard/bonds", label: "Tahviller", icon: Receipt },
      { href: "/dashboard/earn", label: "Kazan", icon: Coins },
      { href: "/dashboard/tax", label: "Vergi Merkezi", icon: Scales, plan: "unlimited" },
    ],
  },
  {
    title: "Topluluk",
    items: [
      { href: "/dashboard/copy", label: "Kopya İşlem", icon: UsersThree, plan: "pro" },
      { href: "/dashboard/feed", label: "Akış", icon: UsersFour },
      { href: "/dashboard/research", label: "Araştırma", icon: MagnifyingGlass },
    ],
  },
  {
    title: "Hesap",
    items: [
      { href: "/dashboard/connections", label: "Bağlantılar", icon: Plugs },
      { href: "/dashboard/notifications", label: "Bildirimler", icon: BellSimple },
      { href: "/dashboard/billing", label: "Abonelik", icon: CreditCard },
    ],
  },
];


export function Sidebar() {
  const pathname = usePathname();
  const open = useMobileNav();
  const { collapsed, toggle } = useSidebarCollapsed();

  // rota değişince mobil çekmeceyi kapat
  useEffect(() => {
    mobileNav.close();
  }, [pathname]);

  // <html data-sidebar> ile içerik padding'ini senkronla (ilk yükte de).
  useEffect(() => {
    document.documentElement.setAttribute("data-sidebar", collapsed ? "collapsed" : "expanded");
  }, [collapsed]);

  // Daraltma yalnız masaüstünde geçerli; mobilde tam çekmece.
  const isCollapsed = collapsed;

  return (
    <>
      {/* mobil backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => mobileNav.close()}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/[0.08] bg-[#0a0a0a] py-6 transition-[width,transform] duration-300 lg:translate-x-0",
          isCollapsed ? "w-[76px] px-3" : "w-[248px] px-4",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* logo + daralt düğmesi */}
        <div className={cn("flex items-center", isCollapsed ? "justify-center px-0" : "justify-between px-3")}>
          <Link href="/" className={isCollapsed ? "hidden" : "block"}>
            <VelaLogo className="[&_span]:text-lg [&_svg]:h-7 [&_svg]:w-7" />
          </Link>
          <button
            onClick={toggle}
            title={isCollapsed ? "Menüyü genişlet" : "Menüyü daralt"}
            className="hidden h-8 w-8 shrink-0 place-items-center rounded-lg text-white/40 transition hover:bg-white/[0.06] hover:text-white lg:grid"
          >
            {isCollapsed ? <CaretRight size={16} weight="bold" /> : <CaretLeft size={16} weight="bold" />}
          </button>
        </div>

        {/* Vela Chat hızlı erişim */}
        <Link
          href="/dashboard/chat"
          title="Finovela'ya sor"
          className={cn(
            "vela-ask-glow mt-7 flex items-center justify-center rounded-xl bg-white font-semibold text-black transition hover:bg-white/90",
            isCollapsed ? "h-11 w-11 mx-auto p-0" : "gap-2.5 px-4 py-3 text-sm",
          )}
        >
          <Image src="/vela-mark.png" alt="" width={26} height={26} className="block shrink-0" />
          {!isCollapsed && "Finovela'ya sor"}
        </Link>

        {/* kaydırılabilir nav — mantıksal gruplar (madde 5) */}
        <nav className="mt-6 flex flex-1 flex-col gap-0.5 overflow-y-auto overflow-x-hidden pr-1 [scrollbar-width:thin]">
          {NAV_GROUPS.map((group, gi) => (
            <div key={group.title ?? `g${gi}`} className={gi > 0 ? "mt-4" : ""}>
              {!isCollapsed && group.title && (
                <p className="px-3.5 pb-1.5 pt-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-white/30">
                  {group.title}
                </p>
              )}
              {isCollapsed && gi > 0 && (
                <div className="mx-auto my-2 h-px w-6 bg-white/[0.08]" />
              )}
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const active =
                    item.href === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={isCollapsed ? item.label : undefined}
                      className={cn(
                        "group flex items-center rounded-xl text-sm font-medium transition",
                        isCollapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3.5 py-2.5",
                        active
                          ? "bg-white/[0.07] text-white"
                          : "text-white/45 hover:bg-white/[0.04] hover:text-white",
                      )}
                    >
                      <item.icon
                        size={20}
                        weight={active ? "fill" : "regular"}
                        className={cn("shrink-0", active ? "text-white" : "")}
                      />
                      {!isCollapsed && <span className="flex-1 truncate">{item.label}</span>}
                      {!isCollapsed && item.plan && (
                        <span className="vela-plan-pill shrink-0">
                          {item.plan === "unlimited" ? "Ultra" : "Pro"}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-4 space-y-1 border-t border-white/[0.08] pt-4">
          <Link
            href="/dashboard/settings"
            title={isCollapsed ? "Ayarlar" : undefined}
            className={cn(
              "flex items-center rounded-xl text-sm font-medium text-white/45 transition hover:bg-white/[0.04] hover:text-white",
              isCollapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3.5 py-2.5",
            )}
          >
            <Gear size={20} className="shrink-0" />
            {!isCollapsed && "Ayarlar"}
          </Link>
          {!isCollapsed && <UserChip />}
        </div>
      </aside>
    </>
  );
}
