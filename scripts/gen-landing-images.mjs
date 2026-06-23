// Vela landing görselleri — RockFlow/Bobby dili (PARLAK kristal-cam, lila/mor).
// node scripts/gen-landing-images.mjs

import fs from "node:fs";
import path from "node:path";

function loadEnv() {
  const p = path.join(process.cwd(), ".env.local");
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m) process.env[m[1]] = m[2];
  }
}
loadEnv();

const KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-2.5-flash-image";
const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`;

// RockFlow/Bobby görsel dili — PARLAK, NET, kristal-cam, lila/mor, premium 3D render.
const STYLE =
  "Style: premium glossy 3D render in the style of RockFlow / Bobby AI marketing. BRIGHT, clean, high-key studio lighting on a soft lilac-to-violet (#E9D5FF to #8B5CF6) gradient background. Translucent frosted glass and crystal materials with rainbow iridescent edge refractions, vivid electric purple (#8B5CF6, #A855F7) glow accents, subtle floating particles. Sharp, crisp, photoreal, NOT blurry, NOT dark, NOT smoky. Apple-keynote product render quality. Centered subject, generous soft background, no text, no words, no UI.";

const JOBS = [
  {
    out: "public/gen/hero-portfolio.png",
    prompt: `A glossy 3D cluster of translucent purple glass cubes floating and tumbling in mid-air, each cube filled with swirling violet light, rainbow refractions on the glass edges, one small iridescent disc/coin floating nearby — like AI portfolios assembling. Square. ${STYLE}`,
  },
  {
    out: "public/gen/ai-brain.png",
    prompt: `A translucent crystal-glass human brain glowing with internal purple-magenta light, levitating above a softly glowing purple microchip on a circuit board, bright and clean, iridescent reflections — representing AI intelligence. Square. ${STYLE}`,
  },
  {
    out: "public/gen/automation-gears.png",
    prompt: `Glossy translucent purple glass gears and cogs interlocking, with smooth glowing energy ribbons flowing through them, floating, bright clean studio look, rainbow glass edges — representing automated trading running 24/7. Square. ${STYLE}`,
  },
  {
    out: "public/gen/copy-network.png",
    prompt: `A bright 3D network of glossy purple glass spheres connected by glowing light strands, a few small glass figurines/avatars among the nodes, one central larger glowing node — a friendly social copy-trading network. Clean lilac background. Square. ${STYLE}`,
  },
  {
    out: "public/gen/strategy-blocks.png",
    prompt: `Translucent purple glass building blocks snapping together with glowing connector lines, like a no-code strategy being assembled from modular bricks, isometric, bright and glossy, iridescent edges. Square. ${STYLE}`,
  },
  {
    out: "public/gen/portfolio-bars.png",
    prompt: `A glossy 3D bar chart made of translucent purple glass bars rising upward, with a small cute crystal mascot character (an abstract glowing creature) standing on top and a few iridescent coins floating around, bright clean lilac studio background — playful and premium like Bobby AI hot-stocks art. Wide 16:9. ${STYLE}`,
  },
  {
    out: "public/gen/tax-shield.png",
    prompt: `A glossy translucent purple crystal shield emblem floating, glowing softly with iridescent light, bright clean lilac background — representing tax optimization and protection. Square. ${STYLE}`,
  },
  {
    out: "public/gen/phone-chat.png",
    prompt: `A sleek modern smartphone shown at a slight 3D angle, screen glowing with a purple AI chat interface (abstract glowing chat bubbles, no readable text), floating on a soft lilac-to-violet gradient, glossy reflections, bright and premium — a voice-first AI investing app. Portrait 3:4. ${STYLE}`,
  },
  {
    out: "public/gen/cta-rocket.png",
    prompt: `A glossy stylized 3D rocket made of purple glass and chrome launching upward with a glowing violet trail and small iridescent coins/planets around it, bright clean lilac-to-violet background with soft stars, aspirational and premium — like Bobby careers art. Wide 16:9, lots of soft space. ${STYLE}`,
  },
];

async function gen({ out, prompt }) {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });
    if (!res.ok) {
      return { out, ok: false, err: `HTTP ${res.status}: ${(await res.text()).slice(0, 200)}` };
    }
    const data = await res.json();
    const parts = data?.candidates?.[0]?.content?.parts ?? [];
    const img = parts.find((p) => p.inlineData?.data);
    if (!img) return { out, ok: false, err: "no image" };
    const buf = Buffer.from(img.inlineData.data, "base64");
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, buf);
    return { out, ok: true, kb: Math.round(buf.length / 1024) };
  } catch (e) {
    return { out, ok: false, err: String(e) };
  }
}

console.log(`${JOBS.length} görsel üretiliyor (RockFlow parlak-cam dili, paralel)...`);
const results = await Promise.all(JOBS.map(gen));
for (const r of results) {
  console.log(r.ok ? `✓ ${r.out} (${r.kb}KB)` : `✗ ${r.out} — ${r.err}`);
}
console.log(`\n${results.filter((r) => r.ok).length}/${JOBS.length} başarılı.`);
