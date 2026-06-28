"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChatExperience } from "@/components/dashboard/chat-experience";
import { useChats, chatsStore } from "@/lib/dashboard/use-chats";
import { useChatHistCollapsed } from "@/lib/dashboard/use-chathist";
import { useConfirm } from "@/components/dashboard/confirm";
import { Plus, MessageCircle, Trash2, PanelLeft } from "lucide-react";

/** Chat + sol geçmiş paneli (kalıcı sohbetler, daraltılabilir). Didit açık-tema. */
export function ChatWithHistory({ chatId }: { chatId?: string }) {
  const chats = useChats();
  const router = useRouter();
  const confirm = useConfirm();
  const { collapsed, toggle } = useChatHistCollapsed();

  return (
    <div className="ais ais-light flex h-[calc(100vh-64px)] bg-[var(--ais-bg)]">
      {/* geçmiş paneli */}
      <div
        className={`hidden shrink-0 flex-col border-r transition-[width] duration-300 ease-out md:flex ${
          collapsed ? "w-[56px]" : "w-[264px]"
        }`}
        style={{ borderColor: "var(--ais-line)" }}
      >
        {/* üst bar: daralt/genişlet + yeni sohbet */}
        <div className={`flex items-center gap-2 p-3 ${collapsed ? "flex-col" : ""}`}>
          <button
            onClick={toggle}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[var(--ais-fg-muted)] transition hover:bg-[var(--ais-surface-2)] hover:text-[var(--ais-fg)]"
            aria-label={collapsed ? "Geçmişi genişlet" : "Geçmişi daralt"}
            title={collapsed ? "Geçmişi genişlet" : "Geçmişi daralt"}
          >
            <PanelLeft size={18} />
          </button>

          {collapsed ? (
            <Link
              href="/dashboard/chat"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--ais-accent)] text-white transition hover:opacity-90"
              aria-label="Yeni sohbet"
              title="Yeni sohbet"
            >
              <Plus size={16} strokeWidth={2.5} />
            </Link>
          ) : (
            <Link
              href="/dashboard/chat"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--ais-accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              <Plus size={16} strokeWidth={2.5} />
              Yeni sohbet
            </Link>
          )}
        </div>

        {!collapsed && (
          <div className="flex-1 overflow-y-auto px-2 pb-3">
            <p className="px-2 py-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--ais-fg-faint)]">
              Geçmiş
            </p>
            {chats.length === 0 ? (
              <p className="px-2 py-4 text-sm text-[var(--ais-fg-faint)]">Henüz sohbet yok.</p>
            ) : (
              <div className="space-y-0.5">
                {chats.map((c) => (
                  <div
                    key={c.id}
                    className={`group flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition ${
                      c.id === chatId
                        ? "bg-[var(--ais-surface-2)] text-[var(--ais-fg)]"
                        : "text-[var(--ais-fg-muted)] hover:bg-[var(--ais-surface-2)] hover:text-[var(--ais-fg)]"
                    }`}
                  >
                    <Link href={`/dashboard/chat?id=${c.id}`} className="flex min-w-0 flex-1 items-center gap-2">
                      <MessageCircle size={15} className="shrink-0 opacity-60" />
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
                      className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-[var(--ais-fg-faint)] opacity-0 transition hover:bg-[var(--ais-surface-2)] hover:text-[#d93025] group-hover:opacity-100"
                      aria-label="Sil"
                    >
                      <Trash2 size={13} />
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
                    c.id === chatId
                      ? "bg-[var(--ais-surface-2)] text-[var(--ais-fg)]"
                      : "text-[var(--ais-fg-faint)] hover:bg-[var(--ais-surface-2)] hover:text-[var(--ais-fg)]"
                  }`}
                >
                  <MessageCircle size={16} />
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
