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
