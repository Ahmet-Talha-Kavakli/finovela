import puppeteer from "puppeteer-core";
const b=await puppeteer.launch({executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:"new",args:["--no-sandbox","--window-size=1680,1050"]});
const p=await b.newPage(); await p.setViewport({width:1680,height:1000,deviceScaleFactor:1.5});
await p.goto("http://localhost:3000/dashboard/stock/BRENT",{waitUntil:"networkidle0",timeout:60000}); await new Promise(r=>setTimeout(r,2200));
await p.evaluate(()=>{const b=document.querySelector('button[title="Tam ekran"]'); if(b)b.click();});
await new Promise(r=>setTimeout(r,1200));
const info=await p.evaluate(()=>{
  const card=document.querySelector('.vela-modal-card');
  const bd=document.querySelector('.vela-modal-backdrop');
  const cs=card?getComputedStyle(card):null;
  const bs=bd?getComputedStyle(bd):null;
  return {
    cardBg: cs?.backgroundColor, cardOpacity: cs?.opacity, cardFilter: cs?.backdropFilter,
    cardClass: card?.className, cardInline: card?.getAttribute('style'),
    bdBg: bs?.backgroundColor, bdFilter: bs?.backdropFilter, bdOpacity: bs?.opacity,
  };
});
console.log(JSON.stringify(info,null,2));
await b.close();
