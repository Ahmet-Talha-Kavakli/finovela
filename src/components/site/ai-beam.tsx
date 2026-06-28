"use client";

/**
 * AIBeam — "bağlantı ışını" hero efekti (MCP sayfası).
 * Ortada Finovela logosu, etrafında bağlandığımız AI modellerinin gerçek logoları,
 * aralarda kavisli kablolar; kablolarda merkeze akan ışık, ışık ulaşınca logo
 * parlar sonra söner (staggered döngü). Yeni-nesil SaaS "connectivity" deseni.
 *
 * Salt SVG + CSS animasyon (JS state yok) → hafif. prefers-reduced-motion saygılı.
 */

// Çevre AI logoları — simple-icons CDN (gerçek marka logoları, beyaz varyant).
// Konum: 0=üst, saat yönünde. cx/cy yüzde (viewBox 0-100).
const NODES = [
  { id: "claude", name: "Claude", slug: "anthropic", x: 50, y: 8, delay: 0 },
  { id: "openai", name: "ChatGPT", slug: "openai", x: 85, y: 22, delay: 0.5 },
  { id: "gemini", name: "Gemini", slug: "googlegemini", x: 95, y: 55, delay: 1.0 },
  { id: "perplexity", name: "Perplexity", slug: "perplexity", x: 78, y: 88, delay: 1.5 },
  { id: "grok", name: "Grok", slug: "x", x: 22, y: 88, delay: 2.0 },
  { id: "mistral", name: "Mistral", slug: "mistralai", x: 5, y: 55, delay: 2.5 },
  { id: "meta", name: "Llama", slug: "meta", x: 15, y: 22, delay: 3.0 },
];

const CENTER = { x: 50, y: 50 };
const CYCLE = 3.5; // saniye — bir ışık akış döngüsü

export function AIBeam() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[520px]">
      <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible" aria-hidden>
        <defs>
          {/* kablo boyunca akan ışık — gradient stroke */}
          <linearGradient id="beam-flow" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#2567ff" stopOpacity="0" />
            <stop offset="50%" stopColor="#7fb0ff" stopOpacity="1" />
            <stop offset="100%" stopColor="#2567ff" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="beam-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3b6dff" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#3b6dff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* merkez glow */}
        <circle cx={CENTER.x} cy={CENTER.y} r="22" fill="url(#beam-core)" className="beam-core-pulse" />

        {/* kablolar + akan ışık */}
        {NODES.map((n) => {
          // kavisli yol: node → merkez, kontrol noktası hafif dışa
          const mx = (n.x + CENTER.x) / 2 + (CENTER.y - n.y) * 0.12;
          const my = (n.y + CENTER.y) / 2 + (n.x - CENTER.x) * 0.12;
          const d = `M ${n.x} ${n.y} Q ${mx} ${my} ${CENTER.x} ${CENTER.y}`;
          return (
            <g key={n.id}>
              {/* statik soluk kablo */}
              <path d={d} fill="none" stroke="rgba(127,176,255,0.18)" strokeWidth="0.5" />
              {/* akan ışık (dash + offset animasyonu) */}
              <path
                d={d}
                fill="none"
                stroke="url(#beam-flow)"
                strokeWidth="0.9"
                strokeLinecap="round"
                className="beam-flow-path"
                style={{ animationDelay: `${n.delay}s`, ["--cycle" as string]: `${CYCLE}s` }}
              />
            </g>
          );
        })}
      </svg>

      {/* Merkez: Finovela logosu */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[#0a1838] shadow-[0_0_40px_-4px_rgba(59,109,255,0.7)] ring-1 ring-[#2567ff]/40">
          {/* yelken mark — beyaz */}
          <svg viewBox="0 0 32 32" className="h-9 w-9 text-white" fill="none" aria-hidden>
            <path d="M16.6 4.4c5.4 4 8.7 9.8 9.5 16.8a.55.55 0 0 1-.64.6L16.6 20.4Z" fill="currentColor" />
            <path d="M14.4 4.6v18.8M7.8 23.4h14.6" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="22.6" cy="9" r="1.2" fill="currentColor" />
          </svg>
        </div>
      </div>

      {/* Çevre logoları — ışık ulaşınca parlar (staggered) */}
      {NODES.map((n) => (
        <div
          key={n.id}
          className="beam-node absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${n.x}%`, top: `${n.y}%`, animationDelay: `${n.delay}s`, ["--cycle" as string]: `${CYCLE}s` }}
          title={n.name}
        >
          <div className="beam-node-chip grid h-11 w-11 place-items-center rounded-xl bg-white/[0.06] ring-1 ring-white/10 backdrop-blur-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://cdn.simpleicons.org/${n.slug}/ffffff`}
              alt={n.name}
              width={22}
              height={22}
              className="h-[22px] w-[22px] opacity-70"
              loading="lazy"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
