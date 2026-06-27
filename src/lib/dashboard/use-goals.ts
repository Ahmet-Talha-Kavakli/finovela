"use client";

/**
 * Vela Hedefler store'u — ana hedef + yan hedefler. AI'nın pusulası (Blok 2).
 * Kalıcı (localStorage `vela.goals.v1` → sync-engine ile DB'ye yansır).
 * Tek bir "main" hedef olur; gerisi "side". Çakışma çözümü AI tarafında,
 * burada sadece veri + ilerleme hesabı.
 */

import { useSyncExternalStore } from "react";

export type GoalKind = "main" | "side";
export type RiskTolerance = "low" | "medium" | "high";

export type Goal = {
  id: string;
  kind: GoalKind;
  title: string;
  detail?: string;
  targetValue?: number; // hedef tutar
  currency: string; // USD | TRY
  deadline?: number; // epoch ms
  riskTolerance: RiskTolerance;
  status: "active" | "paused" | "done";
  progress: number; // 0..100
  createdAt: number;
};

const KEY = "vela.goals.v1";

// Yeni kullanıcı SIFIR hedefle başlar — sahte örnek hedef (%18 ilerleme) artık
// yüklenmez; bu boş portföyle çelişiyordu. Kullanıcı kendi hedeflerini ekler.
const SEED: Goal[] = [];

// Donmuş SSR snapshot (hydration güvenli).
const SSR: Goal[] = Object.freeze(SEED.map((g) => Object.freeze({ ...g }))) as Goal[];

let cache: Goal[] | null = null;
const listeners = new Set<() => void>();

function load(): Goal[] {
  if (cache) return cache;
  if (typeof window === "undefined") return SSR;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as Goal[]) : SEED.map((g) => ({ ...g }));
  } catch {
    cache = SEED.map((g) => ({ ...g }));
  }
  return cache;
}

function save(next: Goal[]) {
  cache = next;
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  // Sync-engine DB'den taze veri uygularsa cache'i temizle.
  const onRehydrate = () => {
    cache = null;
    cb();
  };
  if (typeof window !== "undefined") window.addEventListener("vela:rehydrate", onRehydrate);
  return () => {
    listeners.delete(cb);
    if (typeof window !== "undefined") window.removeEventListener("vela:rehydrate", onRehydrate);
  };
}

export const goalStore = {
  get: load,
  getMain(): Goal | null {
    return load().find((g) => g.kind === "main" && g.status !== "done") ?? null;
  },
  add(g: Omit<Goal, "id" | "createdAt" | "progress" | "status">) {
    const list = load();
    // Yeni "main" eklenirse eski main'i side'a düşür (tek ana hedef kuralı).
    let base = list;
    if (g.kind === "main") {
      base = list.map((x) => (x.kind === "main" ? { ...x, kind: "side" as GoalKind } : x));
    }
    const goal: Goal = {
      ...g,
      id: `g_${Date.now()}_${Math.floor(load().length)}`,
      status: "active",
      progress: 0,
      createdAt: Date.now(),
    };
    save([goal, ...base]);
    return goal;
  },
  update(id: string, patch: Partial<Goal>) {
    save(
      load().map((g) => {
        if (g.id !== id) return g;
        const next = { ...g, ...patch };
        // main tekliği koru
        return next;
      }),
    );
  },
  setMain(id: string) {
    save(
      load().map((g) => ({
        ...g,
        kind: g.id === id ? ("main" as GoalKind) : ("side" as GoalKind),
      })),
    );
  },
  remove(id: string) {
    save(load().filter((g) => g.id !== id));
  },
};

export function useGoals() {
  const goals = useSyncExternalStore(subscribe, load, () => SSR);
  return {
    goals,
    main: goals.find((g) => g.kind === "main" && g.status !== "done") ?? null,
    sides: goals.filter((g) => g.kind === "side"),
    add: goalStore.add,
    update: goalStore.update,
    setMain: goalStore.setMain,
    remove: goalStore.remove,
  };
}
