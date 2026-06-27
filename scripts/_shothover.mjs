import puppeteer from "puppeteer-core";
const url=process.argv[2],out=process.argv[3];
const b=await puppeteer.launch({executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:"new",args:["--no-sandbox","--window-size=1680,1050"]});
const p=await b.newPage(); await p.setViewport({width:1680,height:1000,deviceScaleFactor:1.5});
await p.goto(url,{waitUntil:"networkidle0",timeout:60000}); await new Promise(r=>setTimeout(r,1600));
// büyüt butonunu görünür kılmak için grafik grubuna hover
const box = await p.evaluate(()=>{ const btn=document.querySelector('button[title="Tam ekran"]'); if(!btn) return null; const g=btn.parentElement; const r=g.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2}; });
if(box){ await p.mouse.move(box.x, box.y); await new Promise(r=>setTimeout(r,500)); }
await p.screenshot({path:out});
await b.close(); console.log("ok",box);
