// Finovela — TÜM marketing görselleri: Imagen 4 Ultra + rembg(şeffaf) + 4K upscale.
// node scripts/gen-all.mjs [sadece-bu-isim]
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
const MODEL = "imagen-4.0-ultra-generate-001";
const OUT = path.join(process.cwd(), "public/gen");

const BLUE = "Strict blue palette: deep navy #0a1838, electric blue #3b6dff, bright blue #5b8cff, ice-blue #a5c4ff. Absolutely NO purple, NO violet, NO magenta, NO pink. Premium Apple-keynote aesthetic, ultra clean, photorealistic, highly detailed, no text, no watermark.";
const OBJ = "premium glossy 3D product render, soft studio lighting, isolated on a plain pure white background (for clean cutout), centered, with subtle blue inner glow.";
const SCREEN = "A clean modern fintech mobile app SCREEN UI, screen content only (no device frame), dark navy theme, glassmorphism cards, electric-blue #3b6dff accents, crisp premium iOS typography.";

// cutout=1 -> rembg ile şeffaf; opak arka planlar cutout=0
const JOBS = [
  // --- anasayfa arka planlar (opak) ---
  { n:"hero-scene", a:"16:9", c:0, up:2400, p:`A cinematic dreamy financial dawn: a sleek minimalist white sailboat gliding on a calm mirror-like sea toward a glowing sun at the horizon, distant soft blue mountains, a single shooting star streaking across a deep blue-to-navy gradient sky, subtle blue aurora glow. ${BLUE}` },
  { n:"sec-ainative", a:"16:9", c:0, up:2000, p:`An abstract aurora nebula burst, flowing ribbons of electric blue and azure light energy radiating from center, soft particle bokeh, deep navy background, smooth glowing energy, no objects. ${BLUE}` },
  // --- anasayfa objeler (şeffaf) ---
  { n:"sec-cubes", a:"1:1", c:1, up:1600, p:`A floating cluster of translucent blue crystal glass cubes, glossy refractive facets catching electric-blue and cyan light, levitating, ${OBJ} ${BLUE}` },
  { n:"sec-brain", a:"4:3", c:1, up:1800, p:`A glowing translucent crystal brain made of faceted blue glass, intricate refractions, electric-blue energy flowing inside, futuristic AI intelligence symbol, ${OBJ} ${BLUE}` },
  // --- made-natural telefon (şeffaf, ekranda chat UI) ---
  { n:"phone-user", a:"9:16", c:1, up:1600, p:`A single upright modern smartphone (iPhone-style, thin bezels), the screen shows a clean dark-navy AI chat app: a "Finovela" header, a blue user message bubble, an assistant reply, and a small trade/order card with a green confirm button and a tiny line chart, realistic fintech chat UI with electric-blue #3b6dff accents. ${OBJ} ${BLUE}` },
  // --- use-case telefon ekranları (opak, dark) ---
  { n:"uc-social", a:"3:4", c:0, up:1100, p:`${SCREEN} Showing a SOCIAL SIGNALS feed: stock tickers with green/red sentiment bars, community buzz indicators, a trending symbols list. ${BLUE}` },
  { n:"uc-forum", a:"3:4", c:0, up:1100, p:`${SCREEN} Showing a COMMUNITY FORUM: discussion threads, round user avatars, upvote counts, trending investing topics. ${BLUE}` },
  { n:"uc-copy", a:"3:4", c:0, up:1100, p:`${SCREEN} Showing a COPY-TRADING screen: a top-trader leaderboard, small performance line charts, green profit percentages, blue Copy buttons. ${BLUE}` },
  { n:"uc-auto", a:"3:4", c:0, up:1100, p:`${SCREEN} Showing an AUTOMATED TRADING screen: rule cards, blue toggle switches, an active strategy with a green performance line chart. ${BLUE}` },
  // --- her marketing sayfasının 1:1 hero objesi (şeffaf) ---
  { n:"p-ai", a:"1:1", c:1, up:1200, p:`A glowing translucent blue glass orb of artificial intelligence with a four-point spark sparkle inside, floating, ${OBJ} ${BLUE}` },
  { n:"p-portfolio", a:"1:1", c:1, up:1200, p:`A 3D translucent blue glass pie/donut chart split into glossy segments, floating, representing an investment portfolio, ${OBJ} ${BLUE}` },
  { n:"p-strategy", a:"1:1", c:1, up:1200, p:`Stacked translucent blue glass blocks forming an interlocking strategy structure, like building blocks / flowchart nodes, floating, ${OBJ} ${BLUE}` },
  { n:"p-tax", a:"1:1", c:1, up:1200, p:`A translucent blue glass shield with a small upward arrow, symbolizing tax protection and savings, floating, ${OBJ} ${BLUE}` },
  { n:"p-markets", a:"1:1", c:1, up:1200, p:`A translucent blue glass upward trending line/bar chart in 3D, glossy, symbolizing live markets, floating, ${OBJ} ${BLUE}` },
  { n:"p-stocklists", a:"1:1", c:1, up:1200, p:`Floating translucent blue glass cards stacked like a curated stock watchlist, glossy 3D, ${OBJ} ${BLUE}` },
  { n:"p-pricing", a:"1:1", c:1, up:1200, p:`A translucent blue glass gem/diamond, premium and glossy, symbolizing pricing plans value, floating, ${OBJ} ${BLUE}` },
  { n:"p-research", a:"1:1", c:1, up:1200, p:`A translucent blue glass magnifying glass over a tiny chart, glossy 3D, symbolizing market research, floating, ${OBJ} ${BLUE}` },
  { n:"p-support", a:"1:1", c:1, up:1200, p:`A translucent blue glass speech bubble / chat icon, glossy 3D, symbolizing support, floating, ${OBJ} ${BLUE}` },
  { n:"p-blog", a:"1:1", c:1, up:1200, p:`A translucent blue glass document/article icon with a small pen, glossy 3D, symbolizing a blog, floating, ${OBJ} ${BLUE}` },
  { n:"p-academy", a:"1:1", c:1, up:1200, p:`A translucent blue glass graduation cap, glossy 3D, symbolizing an investing academy, floating, ${OBJ} ${BLUE}` },
  { n:"p-copy", a:"1:1", c:1, up:1200, p:`Translucent blue glass figures/nodes connected by glowing lines, a copy-trading network, glossy 3D, floating, ${OBJ} ${BLUE}` },
  { n:"p-automation", a:"1:1", c:1, up:1200, p:`Translucent blue glass interlocking gears with a small lightning bolt, glossy 3D, symbolizing automation, floating, ${OBJ} ${BLUE}` },
];

async function gen(j) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:predict?key=${KEY}`;
  const res = await fetch(url, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ instances:[{prompt:j.p}], parameters:{ sampleCount:1, aspectRatio:j.a } }),
  });
  if (!res.ok) { console.error(`✗ ${j.n}: HTTP ${res.status} ${(await res.text()).slice(0,200)}`); return; }
  const data = await res.json();
  const b64 = data?.predictions?.[0]?.bytesBase64Encoded;
  if (!b64) { console.error(`✗ ${j.n}: görsel yok`); return; }
  const out = path.join(OUT, `${j.n}.png`);
  fs.writeFileSync(out, Buffer.from(b64, "base64"));
  const py = `
from PIL import Image
${j.c ? "from rembg import remove" : ""}
im=Image.open(${JSON.stringify(out)})
${j.c ? "im=remove(im)" : "im=im.convert('RGB')"}
w=${j.up}; h=round(im.height*w/im.width)
if w>im.width: im=im.resize((w,h),Image.LANCZOS)
im.save(${JSON.stringify(out)},"PNG")
print(f"  {im.width}x{im.height} {'şeffaf' if ${j.c?'True':'False'} else 'opak'}")`;
  try { process.stdout.write(execFileSync("python3",["-c",py],{encoding:"utf8"})); } catch(e){ console.error("pp:",e.message.slice(0,150)); }
  console.log(`✓ ${j.n}.png (${(fs.statSync(out).size/1024).toFixed(0)}KB)`);
}

const only = process.argv[2];
for (const j of (only ? JOBS.filter(x=>x.n===only) : JOBS)) {
  await gen(j);
  await new Promise(r=>setTimeout(r,2000));
}
console.log("✓ bitti");
