"use client";

import { useState } from "react";
import { useAiMemory } from "@/lib/dashboard/ai-memory";
import { Plus, X } from "lucide-react";

const ACCENT = "var(--ais-accent)";

/**
 * Finovela'nın kullanıcı hakkında kalıcı olarak hatırladıkları — görüntüle/ekle/sil.
 * Bu gerçekler her sohbette AI'ın system context'ine enjekte edilir.
 * Tasarım dili: Didit açık tema (kutusuz, token renk).
 */
export function AiMemoryPanel() {
  const { list, remember, forget } = useAiMemory();
  const [draft, setDraft] = useState("");

  function add() {
    if (!draft.trim()) return;
    remember(draft);
    setDraft("");
  }

  return (
    <div>
      <div
        className="mb-4 flex items-center gap-2 rounded-xl border p-1.5 pl-3.5 transition focus-within:border-[var(--ais-accent)] focus-within:ring-2 focus-within:ring-[var(--ais-accent)]/15"
        style={{ borderColor: "var(--ais-line-strong)", background: "var(--ais-surface)" }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="örn. Tütün veya silah sektörüne asla yatırım yapma"
          className="flex-1 bg-transparent py-2 text-[13px] text-[var(--ais-fg)] placeholder:text-[var(--ais-fg-faint)] focus:outline-none"
        />
        <button
          onClick={add}
          disabled={!draft.trim()}
          className="flex h-8 items-center gap-1.5 rounded-lg px-3.5 text-[12.5px] font-medium transition disabled:opacity-30"
          style={{ background: "var(--ais-accent-bg)", color: ACCENT }}
        >
          <Plus size={14} />
          Ekle
        </button>
      </div>

      {list.length === 0 ? (
        <p className="py-4 text-center text-[13px] text-[var(--ais-fg-muted)]">
          Finovela henüz bir şey kaydetmedi. Sohbette kalıcı bir tercihinizi söyleyin, hatırlasın.
        </p>
      ) : (
        <div className="space-y-2">
          {list.map((m) => (
            <div
              key={m.id}
              className="group flex items-center gap-3 rounded-xl border px-4 py-3"
              style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: ACCENT }} />
              <p className="flex-1 text-[13px] text-[var(--ais-fg)]">{m.text}</p>
              <button
                onClick={() => forget(m.id)}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[var(--ais-fg-faint)] opacity-0 transition hover:bg-[var(--ais-surface-2)] hover:text-[var(--ais-fg)] group-hover:opacity-100"
                aria-label="Unut"
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
