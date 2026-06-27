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
} from "@phosphor-icons/react";

const NAV = [
  { href: "/dashboard", label: "Genel Bakış", icon: SquaresFour },
  { href: "/dashboard/chat", label: "Finovela Sohbet", icon: ChatCircleDots, badge: "AI" },
  { href: "/dashboard/brain", label: "Finovela Brain", icon: Brain, badge: "YENİ" },
  { href: "/dashboard/goals", label: "Hedefler", icon: Target, badge: "YENİ" },
  { href: "/dashboard/portfolio", label: "Portföy", icon: ChartPieSlice },
  { href: "/dashboard/analytics", label: "Analizler", icon: ChartBar },
  { href: "/dashboard/whatif", label: "What-If Stüdyosu", icon: Flask, badge: "YENİ" },
  { href: "/dashboard/markets", label: "Piyasalar", icon: TrendUp },
  { href: "/dashboard/compare", label: "Karşılaştır", icon: ArrowsLeftRight, badge: "YENİ" },
  { href: "/dashboard/screener", label: "Tarama", icon: Funnel },
  { href: "/dashboard/news", label: "Haberler", icon: Newspaper },
  { href: "/dashboard/pulse", label: "Finovela Pulse", icon: Pulse, badge: "YENİ" },
  { href: "/dashboard/portfolios", label: "Akıllı Portföyler", icon: Stack },
  { href: "/dashboard/generated", label: "Yapay Zeka Portföyleri", icon: SparkleIcon, badge: "YENİ" },
  { href: "/dashboard/options", label: "Opsiyonlar", icon: Cards },
  { href: "/dashboard/bonds", label: "Tahviller", icon: Receipt },
  { href: "/dashboard/earn", label: "Kazan", icon: Coins },
  { href: "/dashboard/tax", label: "Vergi Merkezi", icon: Scales },
  { href: "/dashboard/strategy", label: "Strateji", icon: StackSimple },
  { href: "/dashboard/automation", label: "Otomasyon", icon: Robot },
  { href: "/dashboard/alerts", label: "Alarmlar", icon: BellSimple },
  { href: "/dashboard/copy", label: "Kopya İşlem", icon: UsersThree },
  { href: "/dashboard/feed", label: "Akış", icon: UsersFour },
  { href: "/dashboard/research", label: "Araştırma", icon: MagnifyingGlass },
  { href: "/dashboard/earnings", label: "Bilançolar", icon: CalendarBlank },
  { href: "/dashboard/connections", label: "Bağlantılar", icon: Plugs, badge: "YENİ" },
  { href: "/dashboard/billing", label: "Abonelik", icon: CreditCard },
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
            "mt-7 flex items-center rounded-xl bg-white font-semibold text-black transition hover:bg-white/90",
            isCollapsed ? "justify-center px-0 py-3" : "gap-2.5 px-4 py-3 text-sm",
          )}
        >
          <Image src="/vela-mark.png" alt="" width={28} height={28} className="shrink-0" />
          {!isCollapsed && "Finovela'ya sor"}
        </Link>

        {/* kaydırılabilir nav — taşan öğeler artık erişilebilir */}
        <nav className="mt-6 flex flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden pr-1 [scrollbar-width:thin]">
          {NAV.map((item) => {
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
                {!isCollapsed && item.badge && (
                  <span
                    className="relative h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: "#9ba7ff", boxShadow: "0 0 8px rgba(155,167,255,0.9)" }}
                    title={item.badge === "AI" ? "Yapay zeka" : "Yeni"}
                  >
                    <span
                      className="absolute inset-0 animate-ping rounded-full"
                      style={{ background: "#9ba7ff", opacity: 0.5 }}
                    />
                  </span>
                )}
              </Link>
            );
          })}
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
