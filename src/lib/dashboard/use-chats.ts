"use client";

import { useSyncExternalStore } from "react";

/** Kalıcı sohbet geçmişi — birden çok konuşma, sidebar'da listelenir. */

export type ChatMsg = {
  id: number;
  role: "user" | "assistant";
  text: string;
  // Araç-sonucu kartları — reload'da kaybolmasın diye kalıcı kaydedilir.
  // Tip `unknown` tutulur (depo katmanı kart şeklini bilmez); chat-experience
  // bunları kendi Msg tipine geri yorumlar.
  order?: unknown;
  quotes?: unknown;
  automation?: unknown;
  rebalance?: unknown;
};
export type Chat = { id: string; title: string; ts: number; messages: ChatMsg[] };

const KEY = "vela.chats.v1";
let cache: Chat[] | null = null;
const listeners = new Set<() => void>();
const EMPTY: Chat[] = []; // SSR / boş snapshot — sabit referans

function load(): Chat[] {
  if (cache) return cache;
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as Chat[]) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function save(next: Chat[]) {
  cache = next;
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
}

export function useChats() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      // Sync motoru DB'den durumu birleştirip "vela:rehydrate" yayınladığında
      // cache'i geçersiz kıl ki birleştirilmiş sohbetler sidebar'a yansısın.
      const onRehydrate = () => {
        cache = null;
        cb();
      };
      if (typeof window !== "undefined") window.addEventListener("vela:rehydrate", onRehydrate);
      return () => {
        listeners.delete(cb);
        if (typeof window !== "undefined") window.removeEventListener("vela:rehydrate", onRehydrate);
      };
    },
    load,
    () => EMPTY,
  );
}

export const chatsStore = {
  get: load,
  upsert(chat: Chat) {
    const cur = load();
    const i = cur.findIndex((c) => c.id === chat.id);
    if (i >= 0) {
      const next = [...cur];
      next[i] = chat;
      // en güncel öne
      next.sort((a, b) => b.ts - a.ts);
      save(next);
    } else {
      save([chat, ...cur]);
    }
  },
  remove(id: string) {
    save(load().filter((c) => c.id !== id));
  },
  titleFrom(text: string) {
    const t = text.trim().replace(/\s+/g, " ");
    return t.length > 40 ? t.slice(0, 40) + "…" : t || "New chat";
  },
};
