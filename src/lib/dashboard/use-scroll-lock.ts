"use client";

import { useEffect } from "react";

/**
 * Modal/popup açıkken arka plan (body) kaydırmasını kilitler.
 * `locked` true olduğunda body overflow gizlenir; kapanınca eski haline döner.
 * Birden fazla modal açılırsa sayaç ile doğru yönetilir.
 */
let lockCount = 0;
let prevOverflow = "";
let prevPaddingRight = "";

export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    if (lockCount === 0) {
      const sbw = window.innerWidth - document.documentElement.clientWidth;
      prevOverflow = document.body.style.overflow;
      prevPaddingRight = document.body.style.paddingRight;
      document.body.style.overflow = "hidden";
      // Scrollbar kaybolunca içerik kaymasın diye telafi.
      if (sbw > 0) document.body.style.paddingRight = `${sbw}px`;
    }
    lockCount++;
    return () => {
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0) {
        document.body.style.overflow = prevOverflow;
        document.body.style.paddingRight = prevPaddingRight;
      }
    };
  }, [locked]);
}
