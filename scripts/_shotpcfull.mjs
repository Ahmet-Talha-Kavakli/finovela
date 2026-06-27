import puppeteer from "puppeteer-core";
const b=await puppeteer.launch({executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:"new",args:["--no-sandbox","--window-size=1680,1050"]});
const p=await b.newPage(); await p.setViewport({width:1680,height:1000,deviceScaleFactor:1.5});
await p.goto("http://localhost:3000/dashboard/stock/BRENT",{waitUntil:"networkidle0",timeout:60000}); await new Promise(r=>setTimeout(r,2200));
await p.evaluate(()=>{const b=document.querySelector('button[title="Tam ekran"]'); if(b)b.click();});
await new Promise(r=>setTimeout(r,1400));
// rect of modal card and backdrop
const rects=await p.evaluate(()=>{
  const card=document.querySelector('.vela-modal-card');
  const bd=document.querySelector('.vela-modal-backdrop');
  const r=el=>{const x=el.getBoundingClientRect();return {x:Math.round(x.x),y:Math.round(x.y),w:Math.round(x.width),h:Math.round(x.height)};};
  // count canvases (charts)
  return {card:card?r(card):null, bd:bd?r(bd):null, canvases:document.querySelectorAll('canvas').length, modalCanvases:card?card.querySelectorAll('canvas').length:0};
});
console.log(JSON.stringify(rects,null,2));
await p.screenshot({path:"/tmp/pc-full.png",fullPage:false});
await b.close();
