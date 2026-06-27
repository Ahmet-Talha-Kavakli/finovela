import puppeteer from "puppeteer-core";
const b=await puppeteer.launch({executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:"new",args:["--no-sandbox","--window-size=1680,1100"]});
const p=await b.newPage(); await p.setViewport({width:1680,height:1050,deviceScaleFactor:1.5});
await p.goto("http://localhost:3000/dashboard/chat",{waitUntil:"networkidle0",timeout:60000}); await new Promise(r=>setTimeout(r,1800));
// log paper cash before
const cashBefore=await p.evaluate(()=>{try{const r=localStorage.getItem("vela.paper.v1");return r?JSON.parse(r).cash:"SEED";}catch(e){return "ERR";}});
const ta=await p.$('textarea'); await ta.click();
await p.keyboard.type("NVDA'dan 500 dolarlık al");
await p.keyboard.press("Enter");
await new Promise(r=>setTimeout(r,26000));
// read the order card text (shares/price) and the SSE-captured order via DOM
const orderText=await p.evaluate(()=>{
  const cards=[...document.querySelectorAll('p')].filter(p=>/BUY|SELL/.test(p.textContent||''));
  return cards.map(c=>c.textContent).slice(0,4);
});
await p.evaluate(()=>{const s=document.querySelector('[class*="overflow-y-auto"]'); if(s)s.scrollTop=s.scrollHeight;});
await new Promise(r=>setTimeout(r,600));
await p.screenshot({path:"/tmp/order-card.png"});
const cashAfter=await p.evaluate(()=>{try{const r=localStorage.getItem("vela.paper.v1");return r?JSON.parse(r).cash:"SEED";}catch(e){return "ERR";}});
await b.close();
console.log("cashBefore:",cashBefore,"cashAfter:",cashAfter);
console.log("orderText:",JSON.stringify(orderText));
