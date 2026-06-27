"use client";

import Link from "next/link";
import { MagnifyingGlass, Plus, List } from "@phosphor-icons/react";
import { Notifications } from "@/components/dashboard/notifications";
import { mobileNav } from "@/lib/dashboard/use-mobile-nav";

/** Dashboard üst bar — arama + bildirim + hızlı işlem. */
export function Topbar({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/[0.08] bg-[#0a0a0a]/80 px-4 backdrop-blur-xl sm:px-6">
      <button
        onClick={() => mobileNav.toggle()}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-white/60 transition hover:text-white lg:hidden"
        aria-label="Menü"
      >
        <List size={20} />
      </button>
      <h1 className="font-display text-lg font-bold text-white">{title}</h1>

      <div className="ml-auto flex items-center gap-3">
        <button
          onClick={() =>
            window.dispatchEvent(
              new KeyboardEvent("keydown", { key: "k", metaKey: true }),
            )
          }
          className="hidden items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-sm text-white/40 transition hover:text-white/70 md:flex"
        >
          <MagnifyingGlass size={16} />
          <span>Piyasalarda ara…</span>
          <kbd className="ml-6 rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-white/40">
            ⌘K
          </kbd>
        </button>
        <Notifications />
        <Link
          href="/dashboard/chat"
          className="flex h-10 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-black transition hover:bg-white/90"
        >
          <Plus size={16} weight="bold" />
          Yeni işlem
        </Link>
      </div>
    </header>
  );
}
