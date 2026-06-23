import { cn } from "@/lib/utils";

/** Vela logo — yelken/rota metaforu: yıldız + yelken üçgeni. */
export function VelaMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={cn("h-7 w-7", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id="vela-g" x1="0" y1="0" x2="32" y2="32">
          <stop offset="0%" stopColor="var(--brand)" />
          <stop offset="100%" stopColor="var(--brand-cyan)" />
        </linearGradient>
      </defs>
      {/* yelken */}
      <path
        d="M16 3 L27 25 L16 21 Z"
        fill="url(#vela-g)"
      />
      {/* tekne / rota */}
      <path
        d="M5 25 L16 21 L16 29 Z"
        fill="url(#vela-g)"
        opacity="0.55"
      />
      {/* yıldız parıltısı */}
      <circle cx="23" cy="8" r="1.6" fill="var(--brand-cyan)" />
    </svg>
  );
}

export function VelaLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <VelaMark />
      <span className="text-lg font-semibold tracking-tight">Vela</span>
    </div>
  );
}
