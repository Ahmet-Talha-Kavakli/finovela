"use client";

import { useEffect } from "react";
import { startSync } from "@/lib/dashboard/sync-engine";

/**
 * Senkronizasyon köprüsünü başlatır (DB ⇄ localStorage). Dashboard layout'unda
 * bir kez mount edilir. "vela:rehydrate" geldiğinde (DB'den daha yeni durum
 * uygulandı) store cache'lerinin tazelenmesi için sayfayı bir kez yumuşak yeniler.
 */
export function SyncProvider() {
  useEffect(() => {
    startSync();

    // DB'den daha yeni durum geldiyse store cache'leri eskidir → tek seferlik
    // yumuşak reload ile temiz hidrasyon. (İlk boş-localStorage dolumunda
    // genelde tetiklenmez; asıl cihazlar-arası güncellemede devreye girer.)
    let armed = false;
    // Mount'tan hemen sonra gelen ilk rehydrate (boş→DB dolum) reload tetiklemesin.
    const arm = setTimeout(() => {
      armed = true;
    }, 2500);

    function onRehydrate() {
      if (!armed) return;
      // Sonsuz reload'u önlemek için tek seferlik bayrak.
      if (sessionStorage.getItem("vela.rehydrated") === "1") return;
      sessionStorage.setItem("vela.rehydrated", "1");
      window.location.reload();
    }
    window.addEventListener("vela:rehydrate", onRehydrate);
    return () => {
      clearTimeout(arm);
      window.removeEventListener("vela:rehydrate", onRehydrate);
    };
  }, []);

  return null;
}
