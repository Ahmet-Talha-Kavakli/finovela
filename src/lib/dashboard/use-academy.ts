"use client";

/**
 * Finovela Academy ilerleme store'u — oyunlaştırılmış yatırım eğitimi.
 * Tamamlanan dersler, XP, seviye ve günlük streak'i kalıcı tutar
 * (localStorage `vela.academy.v1`). useSyncExternalStore deseni (hydration güvenli).
 *
 * XP → seviye: her seviye 300 XP (level = floor(xp/300)+1). Ders tamamlanınca
 * dersin xp'si eklenir; aynı ders ikinci kez XP vermez (completed set'i).
 */

import { useSyncExternalStore } from "react";

export type AcademyState = {
  completed: string[]; // tamamlanan ders id'leri ("trackSlug/lessonSlug")
  xp: number;
  lastDay: string; // streak için son aktif gün "YYYY-MM-DD"
  streak: number; // ardışık aktif gün sayısı
};

const KEY = "vela.academy.v1";
const XP_PER_LEVEL = 300;

const DEFAULT: AcademyState = { completed: [], xp: 0, lastDay: "", streak: 0 };
const SSR: AcademyState = Object.freeze({ ...DEFAULT });

let memory: AcademyState = DEFAULT;
let hydrated = false;
const listeners = new Set<() => void>();

function read(): AcademyState {
  if (typeof window === "undefined") return SSR;
  if (hydrated) return memory;
  try {
    const raw = window.localStorage.getItem(KEY);
    memory = raw ? { ...DEFAULT, ...JSON.parse(raw) } : DEFAULT;
  } catch {
    memory = DEFAULT;
  }
  hydrated = true;
  return memory;
}

function write(next: AcademyState) {
  memory = next;
  hydrated = true;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* kota dolu vb. — sessiz geç */
  }
  listeners.forEach((l) => l());
}

function todayStr(): string {
  // Yerel güne göre YYYY-MM-DD (streak için).
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function bumpStreak(s: AcademyState): AcademyState {
  const today = todayStr();
  if (s.lastDay === today) return s; // bugün zaten sayıldı
  // dün müydü? (ardışık) — basit: lastDay bir önceki gün ise +1, değilse sıfırla.
  const y = new Date();
  y.setDate(y.getDate() - 1);
  const ym = String(y.getMonth() + 1).padStart(2, "0");
  const yd = String(y.getDate()).padStart(2, "0");
  const yesterday = `${y.getFullYear()}-${ym}-${yd}`;
  const streak = s.lastDay === yesterday ? s.streak + 1 : 1;
  return { ...s, lastDay: today, streak };
}

export const academyStore = {
  /** Bir dersi tamamla — XP ekle (ilk kez), streak'i güncelle. */
  completeLesson(lessonId: string, xp: number) {
    const cur = read();
    let next = cur;
    if (!cur.completed.includes(lessonId)) {
      next = { ...cur, completed: [...cur.completed, lessonId], xp: cur.xp + xp };
    }
    write(bumpStreak(next));
  },
  /** Tüm ilerlemeyi sıfırla. */
  reset() {
    write({ ...DEFAULT });
  },
};

/** XP'den seviye (1'den başlar). */
export function levelFromXp(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}
/** Mevcut seviyede ilerleme yüzdesi (0-100). */
export function levelProgress(xp: number): { inLevel: number; toNext: number; pct: number } {
  const inLevel = xp % XP_PER_LEVEL;
  return { inLevel, toNext: XP_PER_LEVEL, pct: Math.round((inLevel / XP_PER_LEVEL) * 100) };
}

export function useAcademy(): AcademyState & {
  level: number;
  progress: ReturnType<typeof levelProgress>;
  isDone: (lessonId: string) => boolean;
} {
  const state = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => SSR,
  );
  return {
    ...state,
    level: levelFromXp(state.xp),
    progress: levelProgress(state.xp),
    isDone: (id: string) => state.completed.includes(id),
  };
}
