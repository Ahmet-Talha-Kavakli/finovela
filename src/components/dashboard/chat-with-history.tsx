"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChatExperience } from "@/components/dashboard/chat-experience";
import { useChats, chatsStore } from "@/lib/dashboard/use-chats";
import { useChatHistCollapsed } from "@/lib/dashboard/use-chathist";
import { useConfirm } from "@/components/dashboard/confirm";
import {
  Plus,
  ChatCircleDots,
  Trash,
  SidebarSimple,
} from "@phosphor-icons/react";

/** Chat + sol geçmiş paneli (kalıcı sohbetler, daraltılabilir). */
export function ChatWithHistory({ chatId }: { chatId?: string }) {
  const chats = useChats();
  const router = useRouter();
  const confirm = useConfirm();
  const { collapsed, toggle } = useChatHistCollapsed();

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* geçmiş paneli */}
      <div
        className={`hidden shrink-0 flex-col border-r border-white/[0.08] bg-[#0c0c0d] transition-[width] duration-300 ease-out md:flex ${
          collapsed ? "w-[56px]" : "w-[260px]"
        }`}
      >
        {/* üst bar: daralt/genişlet + yeni sohbet */}
        <div className={`flex items-center gap-2 p-3 ${collapsed ? "flex-col" : ""}`}>
          <button
            onClick={toggle}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white/55 transition hover:bg-white/[0.06] hover:text-white"
            aria-label={collapsed ? "Geçmişi genişlet" : "Geçmişi daralt"}
            title={collapsed ? "Geçmişi genişlet" : "Geçmişi daralt"}
          >
            <SidebarSimple size={18} />
          </button>

          {collapsed ? (
            <Link
              href="/dashboard/chat"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-black transition hover:bg-white/90"
              aria-label="Yeni sohbet"
              title="Yeni sohbet"
            >
              <Plus size={16} weight="bold" />
            </Link>
          ) : (
            <Link
              href="/dashboard/chat"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90"
            >
              <Plus size={16} weight="bold" />
              Yeni sohbet
            </Link>
          )}
        </div>

        {!collapsed && (
          <div className="flex-1 overflow-y-auto px-2 pb-3">
            <p className="px-2 py-2 text-[11px] font-semibold uppercase tracking-wide text-white/35">
              Geçmiş
            </p>
            {chats.length === 0 ? (
              <p className="px-2 py-4 text-sm text-white/35">Henüz sohbet yok.</p>
            ) : (
              <div className="space-y-0.5">
                {chats.map((c) => (
                  <div
                    key={c.id}
                    className={`group flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition ${
                      c.id === chatId ? "bg-white/[0.08] text-white" : "text-white/60 hover:bg-white/[0.04] hover:text-white"
                    }`}
                  >
                    <Link href={`/dashboard/chat?id=${c.id}`} className="flex min-w-0 flex-1 items-center gap-2">
                      <ChatCircleDots size={15} className="shrink-0 opacity-60" />
                      <span className="truncate">{c.title}</span>
                    </Link>
                    <button
                      onClick={async () => {
                        const ok = await confirm({
                          title: "Sohbeti sil",
                          message: `"${c.title}" sohbeti kalıcı olarak silinecek. Bu işlem geri alınamaz.`,
                          confirmLabel: "Sil",
                          cancelLabel: "Vazgeç",
                          tone: "danger",
                        });
                        if (!ok) return;
                        chatsStore.remove(c.id);
                        if (c.id === chatId) router.push("/dashboard/chat");
                      }}
                      className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-white/25 opacity-0 transition hover:bg-white/10 hover:text-white group-hover:opacity-100"
                      aria-label="Sil"
                    >
                      <Trash size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* daraltılmış rayda: aktif sohbet ikonu (hızlı geri dönüş) */}
        {collapsed && chats.length > 0 && (
          <div className="flex-1 overflow-y-auto px-2 pb-3">
            <div className="flex flex-col items-center gap-1">
              {chats.map((c) => (
                <Link
                  key={c.id}
                  href={`/dashboard/chat?id=${c.id}`}
                  title={c.title}
                  aria-label={c.title}
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg transition ${
                    c.id === chatId ? "bg-white/[0.08] text-white" : "text-white/45 hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  <ChatCircleDots size={16} />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* sohbet */}
      <div className="min-w-0 flex-1">
        <ChatExperience key={chatId ?? "new"} chatId={chatId} />
      </div>
    </div>
  );
}
