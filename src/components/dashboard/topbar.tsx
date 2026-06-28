"use client";

import Link from "next/link";
import { Search, Plus, Menu } from "lucide-react";
import { Notifications } from "@/components/dashboard/notifications";
import { mobileNav } from "@/lib/dashboard/use-mobile-nav";

/** Dashboard üst bar — arama + bildirim + hızlı işlem. Didit açık-tema. */
export function Topbar({ title }: { title: string }) {
  return (
    <header
      className="vela-topbar-dark sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/[0.08] px-4 backdrop-blur-xl sm:px-6"
      style={{ background: "rgba(10,10,10,0.72)" }}
    >
      <button
        onClick={() => mobileNav.toggle()}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-white/55 transition hover:bg-white/[0.06] hover:text-white lg:hidden"
        aria-label="Menü"
      >
        <Menu size={20} />
      </button>
      <h1 className="text-[17px] font-semibold text-white">{title}</h1>

      <div className="ml-auto flex items-center gap-3">
        <button
          onClick={() =>
            window.dispatchEvent(
              new KeyboardEvent("keydown", { key: "k", metaKey: true }),
            )
          }
          className="hidden items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.04] px-4 py-2 text-sm text-white/50 transition hover:text-white/80 md:flex"
        >
          <Search size={16} />
          <span>Piyasalarda ara…</span>
          <kbd className="ml-6 rounded bg-white/[0.08] px-1.5 py-0.5 text-[10px] text-white/45">
            ⌘K
          </kbd>
        </button>
        <Notifications />
        <Link
          href="/dashboard/chat"
          className="flex h-10 items-center gap-2 rounded-full px-5 text-sm font-semibold text-white transition hover:brightness-110"
          style={{ background: "#2567ff" }}
        >
          <Plus size={16} strokeWidth={2.5} />
          Yeni işlem
        </Link>
      </div>
    </header>
  );
}
