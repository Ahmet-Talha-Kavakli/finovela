// Vela görsel üretici — Gemini Nano Banana (gemini-2.5-flash-image).
// Kullanım: node scripts/gen-image.mjs "<prompt>" <çıktı-dosyası.png>
// Key .env.local'dan okunur.

import fs from "node:fs";
import path from "node:path";

// .env.local'ı basitçe oku
function loadEnv() {
  const p = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m) process.env[m[1]] = m[2];
  }
}
loadEnv();

const KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-2.5-flash-image";

const prompt = process.argv[2];
const outFile = process.argv[3] ?? "out.png";
// 4. arg: en-boy oranı (örn "16:9", "1:1", "21:9"). Hero için geniş sinematik.
const aspect = process.argv[4] ?? null;
// 5. arg: çözünürlük "1K"|"2K"|"4K" (Retina full-screen için 2K+ şart, upscale=bulanıklık).
const size = process.argv[5] ?? null;

if (!KEY) {
  console.error("GEMINI_API_KEY yok (.env.local)");
  process.exit(1);
}
if (!prompt) {
  console.error('Kullanım: node scripts/gen-image.mjs "<prompt>" <out.png>');
  process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`;

const res = await fetch(url, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseModalities: ["IMAGE"],
      ...(aspect || size
        ? {
            imageConfig: {
              ...(aspect ? { aspectRatio: aspect } : {}),
              ...(size ? { imageSize: size } : {}),
            },
          }
        : {}),
    },
  }),
});

if (!res.ok) {
  console.error(`Gemini HTTP ${res.status}`);
  console.error((await res.text()).slice(0, 1000));
  process.exit(1);
}

const data = await res.json();
const parts = data?.candidates?.[0]?.content?.parts ?? [];
const img = parts.find((p) => p.inlineData?.data);

if (!img) {
  console.error("Görsel dönmedi. Yanıt:");
  console.error(JSON.stringify(data).slice(0, 800));
  process.exit(1);
}

const buf = Buffer.from(img.inlineData.data, "base64");
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, buf);
console.log(`✓ ${outFile} (${(buf.length / 1024).toFixed(0)}KB)`);

// KALİTE: Gemini ~1344px üretiyor; Retina full-screen ~3024px ister.
// Aradaki fark tarayıcıda upscale=bulanıklık. ÇÖZÜM: Lanczos ile 3360px'e büyüt.
// `UPSCALE_WIDTH` env ile genişlik ver (örn tam-ekran hero için 3360). 0=kapalı.
const upWidth = Number(process.env.UPSCALE_WIDTH || 0);
if (upWidth > 0) {
  const { execFileSync } = await import("node:child_process");
  const py = `from PIL import Image
img = Image.open(${JSON.stringify(outFile)}).convert("RGB")
w = ${upWidth}
h = round(img.height * w / img.width)
if w > img.width:
    img = img.resize((w, h), Image.LANCZOS)
    img.save(${JSON.stringify(outFile)}, "PNG", optimize=False)
    print(f"  ↑ upscaled to {w}x{h} (Lanczos)")
else:
    print("  (kaynak zaten yeterince büyük)")`;
  try {
    const out = execFileSync("python3", ["-c", py], { encoding: "utf8" });
    process.stdout.write(out);
  } catch (e) {
    console.error("upscale atlandı (Pillow yok?):", e.message);
  }
}
