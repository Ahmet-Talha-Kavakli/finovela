// Finovela landing — TÜM görselleri Gemini Nano Banana ile MAVİ temada üretir.
// node scripts/gen-all-landing.mjs [sadece-bu-isim]
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

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
const OUT = path.join(process.cwd(), "public/gen");

// MAVİ palet vurgusu her prompt'ta. Şeffaf gerekenler koyu-lacivert zeminle üretilir
// (Nano Banana gerçek alpha vermez; lacivert zemin landing arka planına kaynaşır).
const BLUE = "Strict color palette: deep navy #0a1838, electric blue #3b6dff, bright blue #5b8cff, ice-blue #a5c4ff. NO purple, NO violet, NO magenta, NO pink. Premium Apple-keynote aesthetic, ultra clean, 8k, no text, no watermark.";

const JOBS = [
  {
    name: "hero-scene", aspect: "16:9", up: 2400,
    prompt: `A cinematic dreamy financial dawn: a sleek minimalist white sailboat gliding on a calm mirror-like sea toward a glowing horizon, distant soft blue mountains, a single shooting star streaking across a deep blue-to-navy gradient sky, subtle blue aurora glow, sun glow at horizon. ${BLUE}`,
  },
  {
    name: "sec-ainative", aspect: "16:9", up: 2000,
    prompt: `An abstract aurora nebula burst — flowing ribbons of electric blue and azure light energy radiating from the center, soft particle bokeh, deep navy space-like background, smooth premium glowing energy. No objects, no phone. ${BLUE}`,
  },
  {
    name: "sec-cubes", aspect: "1:1", up: 1400,
    prompt: `A floating cluster of translucent BLUE crystal glass cubes, glossy refractive facets catching electric-blue and cyan light, levitating, soft inner glow, premium 3D product render, on a solid deep navy #0a1838 background (no transparency). ${BLUE}`,
  },
  {
    name: "sec-brain", aspect: "4:3", up: 1800,
    prompt: `A glowing translucent crystal brain made of faceted BLUE glass, intricate refractions, electric-blue energy flowing inside, premium futuristic 3D render symbolizing AI intelligence, centered, on a solid deep navy #0a1838 background (no transparency), soft blue glow. ${BLUE}`,
  },
  {
    name: "phone-user", aspect: "16:9", up: 2600,
    prompt: `A single upright modern smartphone (iPhone-style, thin bezels) positioned LEFT-of-center in a wide 16:9 frame, premium product shot, subtle blue rim light. The phone SCREEN shows a clean dark-navy AI CHAT app interface: a chat header "Finovela", a user message bubble in electric blue, an assistant reply, and a small financial order/trade card with a green confirm button and a tiny line chart — realistic fintech chat UI, electric-blue #3b6dff accents. The rest of the frame is solid deep navy #0a1838 to match the website background. No hand. ${BLUE}`,
  },
  // Use-case telefon mockup'ları (3:4, opak, gerçek mobil UI ekranı)
  {
    name: "uc-social", aspect: "3:4", up: 1100,
    prompt: `A clean modern fintech mobile app SCREEN UI (screen content only, no device frame), dark navy theme, glassmorphism cards, electric-blue #3b6dff accents, showing a SOCIAL SIGNALS feed: stock tickers with green/red sentiment bars, community buzz indicators, a trending symbols list. Crisp premium iOS typography. ${BLUE}`,
  },
  {
    name: "uc-forum", aspect: "3:4", up: 1100,
    prompt: `A clean modern fintech mobile app SCREEN UI (screen content only, no device frame), dark navy theme, glassmorphism cards, electric-blue #3b6dff accents, showing a COMMUNITY FORUM: discussion threads, round user avatars, upvote counts, trending investing topics. Crisp premium iOS typography. ${BLUE}`,
  },
  {
    name: "uc-copy", aspect: "3:4", up: 1100,
    prompt: `A clean modern fintech mobile app SCREEN UI (screen content only, no device frame), dark navy theme, glassmorphism cards, electric-blue #3b6dff accents, showing a COPY-TRADING screen: a top-trader leaderboard, small performance line charts, green profit percentages, blue 'Copy' buttons. Crisp premium iOS typography. ${BLUE}`,
  },
  {
    name: "uc-auto", aspect: "3:4", up: 1100,
    prompt: `A clean modern fintech mobile app SCREEN UI (screen content only, no device frame), dark navy theme, glassmorphism cards, electric-blue #3b6dff accents, showing an AUTOMATED TRADING screen: rule cards, blue toggle switches, an active strategy with a green performance line chart. Crisp premium iOS typography. ${BLUE}`,
  },
];

const only = process.argv[2];
const jobs = only ? JOBS.filter((j) => j.name === only) : JOBS;

async function gen(job) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: job.prompt }] }],
      generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: job.aspect } },
    }),
  });
  if (!res.ok) { console.error(`✗ ${job.name}: HTTP ${res.status} ${(await res.text()).slice(0,300)}`); return false; }
  const data = await res.json();
  const img = (data?.candidates?.[0]?.content?.parts ?? []).find((p) => p.inlineData?.data);
  if (!img) { console.error(`✗ ${job.name}: görsel dönmedi`); return false; }
  const out = path.join(OUT, `${job.name}.png`);
  fs.writeFileSync(out, Buffer.from(img.inlineData.data, "base64"));
  // upscale
  try {
    const py = `from PIL import Image
im=Image.open(${JSON.stringify(out)}).convert("RGB")
w=${job.up}; h=round(im.height*w/im.width)
if w>im.width: im=im.resize((w,h),Image.LANCZOS)
im.save(${JSON.stringify(out)},"PNG")
print(f"  {im.width}x{im.height}")`;
    execFileSync("python3", ["-c", py], { encoding: "utf8" });
  } catch {}
  const kb = (fs.statSync(out).size/1024).toFixed(0);
  console.log(`✓ ${job.name}.png (${kb}KB, ${job.aspect})`);
  return true;
}

for (const job of jobs) {
  await gen(job);
  await new Promise((r) => setTimeout(r, 1500)); // rate limit nezaketi
}
console.log("bitti.");
