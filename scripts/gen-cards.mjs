// Finovela — TÜM kart görselleri. A=cam ikon(şeffaf), B=soyut UI mockup(opak,yazısız).
// node scripts/gen-cards.mjs [sadece-grup-adı]
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

function loadEnv(){const p=path.join(process.cwd(),".env.local");for(const l of fs.readFileSync(p,"utf8").split("\n")){const m=l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);if(m)process.env[m[1]]=m[2];}}
loadEnv();
const KEY=process.env.GEMINI_API_KEY, MODEL="imagen-4.0-fast-generate-001", OUT=path.join(process.cwd(),"public/gen");

const BLUE="Strict blue palette: deep navy #0a1838, electric blue #3b6dff, bright blue #5b8cff, ice-blue #a5c4ff. Absolutely NO purple/violet/magenta/pink. Premium, ultra clean, no readable text, no watermark.";
const ICON=(subj)=>`A small premium 3D glass icon-object: ${subj}, translucent blue glass, glossy refractive facets, soft electric-blue inner glow, floating, isolated on plain pure white background, studio lighting, minimal, centered. ${BLUE}`;
const MOCK=(subj)=>`A polished abstract fintech UI mockup illustration, 16:9, filling the ENTIRE frame edge-to-edge with a SOLID DEEP NAVY #0a1838 background (absolutely NO white, NO light, NO bright background, the whole canvas must be dark navy), glassmorphism panels and cards floating on the dark navy, electric-blue #3b6dff accents, soft glow, showing ${subj} using ONLY shapes/bars/lines/icons (NO readable text, no letters), modern premium product illustration. ${BLUE}`;

// grup: {style, items:[{n, subj}]}  — n = dosya adı son eki
const G = {
  // ---- B grubu: ürün sayfaları (mockup) ----
  "ai":      {style:"B", items:[
    ["sohbet","a chat conversation interface with message bubbles"],
    ["ses","a voice waveform input bar"],
    ["web","a web search panel with result rows and a globe"],
    ["yukle","an upload area with a chart/image thumbnail"],
    ["kartlar","an analytics card with a small line chart and indicator bars"],
    ["model","a model selector dropdown with toggle sliders"],
  ]},
  "strategy":{style:"B", items:[
    ["anlat","a natural-language prompt turning into rule blocks"],
    ["test","a backtest equity curve chart over time"],
    ["param","slider controls and parameter knobs panel"],
    ["riskgetiri","a risk-reward scatter with drawdown bars"],
    ["sablon","a grid of strategy template cards"],
    ["yayinla","a share/publish panel with a leaderboard rank"],
  ]},
  "portfolio":{style:"B", items:[
    ["tekekran","a unified portfolio dashboard with donut chart and rows"],
    ["performans","a performance line chart with gain percentages"],
    ["neden","an explanation panel pointing at a dipping chart"],
    ["hedef","a goal progress ring with a target marker"],
    ["temettu","an income/dividend bars calendar panel"],
    ["dengeleme","a rebalance panel with buy/sell allocation bars"],
  ]},
  "automation":{style:"B", items:[
    ["tekrar","a recurring-investment schedule panel with calendar dots"],
    ["odengeleme","an auto-rebalance loop diagram with allocation bars"],
    ["riskkoruma","a stop-loss / protective rule panel with a down arrow"],
    ["nakit","a cash-management panel with yield bars"],
    ["tetik","an indicator-trigger panel with RSI/MACD style gauges"],
    ["alarm","a smart-alerts panel with bell icons and notification rows"],
  ]},
  "copy":{style:"B", items:[
    ["liderlik","an audited trader leaderboard with rank rows and mini charts"],
    ["yansit","a mirror/auto-copy diagram between two portfolios"],
    ["eslesme","an AI matching panel pairing a user with traders"],
    ["copystop","a copy stop-loss safety control panel"],
    ["cesitlendir","a diversification spread across multiple trader nodes"],
    ["seffaf","a transparency panel showing fees and performance rows"],
  ]},
  "tax":{style:"B", items:[
    ["mahsup","a tax-loss harvesting panel with red/green lots"],
    ["washsale","a wash-sale warning panel with a calendar"],
    ["lot","a lot-selection panel with cost-basis rows"],
    ["hesap","tax-advantaged account cards with a shield"],
    ["endeksleme","a direct-indexing grid of many small holdings"],
    ["yilsonu","a year-end tax summary report panel"],
  ]},
  // ---- A grubu: yardımcı sayfalar (cam ikon) ----
  "research":{style:"A", items:[
    ["filtre","a funnel filter"],["bilanco","a financial document with a chart"],
    ["konsensus","a cluster of analyst rating stars"],["kpi","a gauge / KPI dial"],
    ["duygu","a sentiment radar / pulse wave"],["derin","a magnifying glass over a chart"],
  ]},
  "academy":{style:"A", items:[
    ["temel","a graduation cap"],["analiz","a candlestick chart"],
    ["portfoy","a pie chart"],["risk","a shield"],
    ["otomasyon","interlocking gears"],["ileri","a rocket"],
  ]},
  "support":{style:"A", items:[
    ["para","a wallet with coins"],["aikullanim","a friendly robot head"],
    ["hesap","a lock / security shield"],["islem","an exchange arrows icon"],
    ["otomasyon","a gear with a lightning bolt"],["veri","a data chart icon"],
  ]},
  "stocks":{style:"A", items:[
    ["ai","a brain chip"],["yari","a microchip / semiconductor"],
    ["temettu","a coin stack with arrow"],["enerji","a green energy leaf bolt"],
    ["saglik","a medical cross heartbeat"],["buyume","an upward rocket chart"],
  ]},
};

async function genOne(file, prompt, style){
  const url=`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:predict?key=${KEY}`;
  let res, tries=0;
  while(tries<6){
    res=await fetch(url,{method:"POST",headers:{"content-type":"application/json"},
      body:JSON.stringify({instances:[{prompt}],parameters:{sampleCount:1,aspectRatio: style==="A"?"1:1":"16:9"}})});
    if(res.ok) break;
    if(res.status===429){ tries++; const wait=15000*tries; console.log(`  429 — ${wait/1000}s bekle (${file})`); await new Promise(r=>setTimeout(r,wait)); continue; }
    console.error(`✗ ${file}: HTTP ${res.status}`); return;
  }
  if(!res.ok){console.error(`✗ ${file}: 429 ısrarı`);return;}
  const d=await res.json(); const b64=d?.predictions?.[0]?.bytesBase64Encoded;
  if(!b64){console.error(`✗ ${file}: yok`);return;}
  const out=path.join(OUT,file); fs.writeFileSync(out,Buffer.from(b64,"base64"));
  const cut = style==="A";
  const up = style==="A"?700:1100;
  const py=`
from PIL import Image
${cut?"from rembg import remove":""}
im=Image.open(${JSON.stringify(out)})
${cut?"im=remove(im)":"im=im.convert('RGB')"}
w=${up}; h=round(im.height*w/im.width)
if w>im.width: im=im.resize((w,h),Image.LANCZOS)
im.save(${JSON.stringify(out)},"PNG")`;
  try{execFileSync("python3",["-c",py],{encoding:"utf8"});}catch(e){console.error("pp",e.message.slice(0,100));}
  console.log(`✓ ${file} (${(fs.statSync(out).size/1024).toFixed(0)}KB)`);
}

const only=process.argv[2];
for(const [grp,cfg] of Object.entries(G)){
  if(only && grp!==only) continue;
  for(const [n,subj] of cfg.items){
    const file=`card-${grp}-${n}.png`;
    if(fs.existsSync(path.join(OUT,file))){ console.log(`• ${file} (atlandı, var)`); continue; }
    const prompt = cfg.style==="A" ? ICON(subj) : MOCK(subj);
    await genOne(file, prompt, cfg.style);
    await new Promise(r=>setTimeout(r,2000));
  }
}
console.log("✓ bitti");
