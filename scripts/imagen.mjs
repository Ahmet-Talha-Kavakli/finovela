// Finovela görsel üretici — Imagen 4 Ultra + rembg ile kusursuz şeffaf arka plan + 4K.
// node scripts/imagen.mjs "<prompt>" <out.png> <aspect 1:1|16:9|4:3|3:4|9:16> <cutout 0|1> <upWidth>
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
const MODEL = "imagen-4.0-fast-generate-001";

const prompt = process.argv[2];
const out = process.argv[3] ?? "out.png";
const aspect = process.argv[4] ?? "1:1";
const cutout = process.argv[5] === "1"; // arka planı sil (şeffaf PNG)
const upWidth = Number(process.argv[6] || 0);

if (!KEY || !prompt) { console.error("kullanım: prompt out aspect cutout upWidth"); process.exit(1); }

const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:predict?key=${KEY}`;
const res = await fetch(url, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    instances: [{ prompt }],
    parameters: { sampleCount: 1, aspectRatio: aspect, personGeneration: "allow_all" },
  }),
});
if (!res.ok) { console.error(`Imagen HTTP ${res.status}: ${(await res.text()).slice(0,500)}`); process.exit(1); }
const data = await res.json();
const b64 = data?.predictions?.[0]?.bytesBase64Encoded || data?.predictions?.[0]?.image?.bytesBase64Encoded;
if (!b64) { console.error("görsel dönmedi: " + JSON.stringify(data).slice(0,400)); process.exit(1); }
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, Buffer.from(b64, "base64"));

// arka plan temizleme (rembg) + 4K upscale, tek python adımında
const py = `
from PIL import Image
${cutout ? "from rembg import remove" : ""}
im = Image.open(${JSON.stringify(out)})
${cutout ? `im = remove(im)  # AI matting -> şeffaf` : "im = im.convert('RGB')"}
${upWidth ? `
w=${upWidth}; h=round(im.height*w/im.width)
if w>im.width: im=im.resize((w,h), Image.LANCZOS)
` : ""}
im.save(${JSON.stringify(out)}, "PNG")
print(f"  {im.width}x{im.height} {'(şeffaf)' if ${cutout ? "True" : "False"} else '(opak)'}")
`;
try {
  const o = execFileSync("python3", ["-c", py], { encoding: "utf8" });
  process.stdout.write(o);
} catch (e) { console.error("post-process hata:", e.message.slice(0,300)); }
const kb = (fs.statSync(out).size/1024).toFixed(0);
console.log(`✓ ${out} (${kb}KB)`);
