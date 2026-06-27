import { cn } from "@/lib/utils";

/**
 * Vela markası — "yelken" (vela = Latince yelken; aynı adlı takımyıldız).
 * Geometrik, sade: rüzgârla şişmiş bir yelken + yukarı yönelimli rota + rota
 * yıldızı. currentColor ile çizilir → OLED dashboard'da beyaz, açık zeminde
 * koyu; landing'de marka rengine sarılabilir. AI-jenerik gradyan yok, Apple-sade.
 */
export function VelaMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={cn("h-7 w-7", className)}
      aria-hidden
    >
      {/* yelken — kavisli iç kenar, rüzgârla şişmiş hissi */}
      <path
        d="M16.6 4.4c5.4 4 8.7 9.8 9.5 16.8a.55.55 0 0 1-.64.6L16.6 20.4Z"
        fill="currentColor"
      />
      {/* direk + alt rota çizgisi */}
      <path
        d="M14.4 4.6v18.8M7.8 23.4h14.6"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* rota yıldızı (Vela takımyıldızı iması) */}
      <circle cx="22.6" cy="9" r="1.2" fill="currentColor" />
    </svg>
  );
}

export function VelaLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <VelaMark />
      <span className="text-lg font-semibold tracking-tight">Finovela</span>
    </div>
  );
}
