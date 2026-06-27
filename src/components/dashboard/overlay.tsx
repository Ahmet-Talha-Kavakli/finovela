"use client";

/**
 * Overlay — modal/dialog için paylaşılan portal sarmalayıcı.
 *
 * NEDEN: Dashboard modalleri (.ais-light) sayfa içeriğinin DOM ağacının İÇİNDE
 * render edilince, overlay'in backdrop-filter:blur'u arkadaki AÇIK içerik kutusunu
 * koyu-gri bloğa çeviriyordu (kullanıcı bildirdi). createPortal ile <body>'ye
 * taşıyınca blur arkadaki açık html/body zeminine uygulanır → koyu blok oluşmaz.
 *
 * Bu bileşen SADECE portal sağlar; karartma/blur/yerleşim çağıran tarafta kalır
 * (her modal kendi z-index'ini ve overlay stilini korur). Çağrı:
 *   <Overlay>  <div className="fixed inset-0 ...">...</div>  </Overlay>
 */

import { useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";

// Client'ta mı? useSyncExternalStore ile hidrasyon-güvenli (setState-in-effect yok).
const emptySubscribe = () => () => {};
function useIsClient() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true, // client snapshot
    () => false, // server snapshot
  );
}

export function Overlay({ children }: { children: ReactNode }) {
  const isClient = useIsClient();
  if (!isClient) return null;
  return createPortal(children, document.body);
}
