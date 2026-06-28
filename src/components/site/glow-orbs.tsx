/**
 * GlowOrbs — yavaş süzülen, blur'lu renk küreleri (animasyonlu arka plan).
 * Pricing kartlarının arkasında "canlı cam" hissi verir. Salt CSS animasyon
 * (keyframe globals.css'te: orb-float-a/b/c), prefers-reduced-motion saygılı.
 * Finovela navy paletinde (mavi tonları) — neon değil, sinematik derinlik.
 */
export function GlowOrbs() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <span className="orb orb-a absolute h-[420px] w-[420px] rounded-full bg-[#2567ff]/25 blur-[120px]" />
      <span className="orb orb-b absolute h-[360px] w-[360px] rounded-full bg-[#5b8cff]/20 blur-[120px]" />
      <span className="orb orb-c absolute h-[300px] w-[300px] rounded-full bg-[#1e3a8a]/30 blur-[110px]" />
    </div>
  );
}
