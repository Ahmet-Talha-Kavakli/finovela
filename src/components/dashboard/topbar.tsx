"use client";

import Link from "next/link";
import { Search, Plus, Menu } from "lucide-react";
import { Notifications } from "@/components/dashboard/notifications";
import { mobileNav } from "@/lib/dashboard/use-mobile-nav";

/** Dashboard üst bar — arama + bildirim + hızlı işlem. Didit açık-tema. */
export function Topbar({ title }: { title: string }) {
  return (
    <header
      className="ais ais-light sticky top-0 z-30 flex h-16 items-center gap-3 border-b px-4 backdrop-blur-xl sm:px-6"
      style={{
        borderColor: "var(--ais-line)",
        background: "color-mix(in srgb, var(--ais-bg) 82%, transparent)",
      }}
    >
      <button
        onClick={() => mobileNav.toggle()}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-[var(--ais-fg-muted)] transition hover:bg-[var(--ais-surface-2)] hover:text-[var(--ais-fg)] lg:hidden"
        aria-label="Menü"
      >
        <Menu size={20} />
      </button>
      <h1 className="text-[17px] font-semibold text-[var(--ais-fg)]">{title}</h1>

      <div className="ml-auto flex items-center gap-3">
        <button
          onClick={() =>
            window.dispatchEvent(
              new KeyboardEvent("keydown", { key: "k", metaKey: true }),
            )
          }
          className="hidden items-center gap-2 rounded-full border px-4 py-2 text-sm text-[var(--ais-fg-muted)] transition hover:text-[var(--ais-fg)] md:flex"
          style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}
        >
          <Search size={16} />
          <span>Piyasalarda ara…</span>
          <kbd
            className="ml-6 rounded px-1.5 py-0.5 text-[10px] text-[var(--ais-fg-faint)]"
            style={{ background: "var(--ais-surface-2)" }}
          >
            ⌘K
          </kbd>
        </button>
        <Notifications />
        <Link
          href="/dashboard/chat"
          className="flex h-10 items-center gap-2 rounded-full px-5 text-sm font-semibold text-white transition hover:opacity-90"
          style={{ background: "var(--ais-accent)" }}
        >
          <Plus size={16} strokeWidth={2.5} />
          Yeni işlem
        </Link>
      </div>
    </header>
  );
}
