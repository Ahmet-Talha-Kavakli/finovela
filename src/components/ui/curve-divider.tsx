/**
 * Bölümler arası YARIM-DAİRE (arc) geçiş.
 * Alttaki bölümün EN ÜSTÜNE konur; `color` = bir ÖNCEKİ (üstteki) bölümün zemin rengi.
 *
 * Yaklaşım: tam genişlikte, sığ-orta derinlikte tek bir kavisli SVG yolu çiziyoruz.
 * Yolun TAMAMI üstteki bölümün rengiyle (`color`) doludur ve üst kenarı bölümün
 * dışına (yukarı) taşar — böylece üstteki bölümle dikişsiz birleşir. Yolun ALT kenarı
 * geniş ve nazik bir yay (broad ellipse) ile mevcut bölüme "kaşık gibi" oturur.
 *
 * Geniş/sığ yay premium ve kasıtlı görünür: derin bir tümsek ya da sert bir dudak yok.
 * Yükseklik mobilde ~44px, masaüstünde ~80px. viewBox geometrisi sabit; `preserveAspectRatio`
 * "none" ile yatayda esner, dikeyde verilen yüksekliğe oturur → her ekranda aynı zarif yay.
 */
export function CurveDivider({ color }: { color: string }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[44px] -translate-y-px sm:h-[80px]"
    >
      <svg
        viewBox="0 0 1440 100"
        preserveAspectRatio="none"
        className="block h-full w-full"
      >
        {/*
          Üstte düz çizgi (üst bölümle birleşir), altta geniş & sığ konkav yay.
          Yol: sol-üstten sağ-üste düz git, sonra tek bir kübik Bézier ile
          merkezi yukarı çeken nazik bir kaşık (semicircle hissi) çiz.
          Kontrol noktaları yatayda 1/3 ve 2/3'te, derinlik ~96 birim →
          80px yükseklikte yumuşak, tam-genişlik bir yarım-daire kavsi.
        */}
        <path
          d="M0,0 L1440,0 L1440,18 C1080,98 360,98 0,18 Z"
          fill={color}
        />
      </svg>
    </div>
  );
}
