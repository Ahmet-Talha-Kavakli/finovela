// Finovela video üretici — Veo 3 Fast. node scripts/gen-video.mjs "<prompt>" <out.mp4> [aspect]
import fs from "node:fs";
import path from "node:path";

function loadEnv(){const p=path.join(process.cwd(),".env.local");for(const l of fs.readFileSync(p,"utf8").split("\n")){const m=l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);if(m)process.env[m[1]]=m[2];}}
loadEnv();
const KEY=process.env.GEMINI_API_KEY;
const MODEL="veo-3.0-fast-generate-001";
const prompt=process.argv[2];
const out=process.argv[3]??"out.mp4";
const aspect=process.argv[4]??"9:16";
if(!KEY||!prompt){console.error("kullanım: prompt out.mp4 [aspect]");process.exit(1);}

const base="https://generativelanguage.googleapis.com/v1beta";
// 1) başlat
const start=await fetch(`${base}/models/${MODEL}:predictLongRunning?key=${KEY}`,{
  method:"POST",headers:{"content-type":"application/json"},
  body:JSON.stringify({instances:[{prompt}],parameters:{aspectRatio:aspect}}),
});
if(!start.ok){console.error(`başlatma HTTP ${start.status}: ${(await start.text()).slice(0,400)}`);process.exit(1);}
const op=(await start.json()).name;
console.log("operation:",op,"— bekleniyor...");

// 2) poll
let resp=null;
for(let i=0;i<40;i++){
  await new Promise(r=>setTimeout(r,15000));
  const r=await fetch(`${base}/${op}?key=${KEY}`);
  const d=await r.json();
  if(d.error){console.error("HATA:",JSON.stringify(d.error).slice(0,300));process.exit(1);}
  if(d.done){resp=d.response;console.log(`[${i+1}] DONE`);break;}
  console.log(`[${i+1}] pending...`);
}
if(!resp){console.error("zaman aşımı");process.exit(1);}

// 3) indir
const uri=resp?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri;
if(!uri){console.error("video uri yok: "+JSON.stringify(resp).slice(0,300));process.exit(1);}
const vid=await fetch(`${uri}&key=${KEY}`.includes("?")?`${uri}&key=${KEY}`:`${uri}?key=${KEY}`);
const dl=await fetch(uri.includes("?")?`${uri}&key=${KEY}`:`${uri}?key=${KEY}`);
const buf=Buffer.from(await dl.arrayBuffer());
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,buf);
console.log(`✓ ${out} (${(buf.length/1024/1024).toFixed(1)}MB)`);
