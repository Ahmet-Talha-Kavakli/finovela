import puppeteer from "puppeteer-core";
const b=await puppeteer.launch({executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:"new",args:["--no-sandbox","--window-size=1440,1000"]});
const p=await b.newPage(); await p.setViewport({width:1440,height:1000,deviceScaleFactor:1.5});
await p.goto("http://localhost:3000/dashboard/connections",{waitUntil:"networkidle0",timeout:60000});
await new Promise(r=>setTimeout(r,2500));
// Binance kartına kaydır
await p.evaluate(()=>{const el=[...document.querySelectorAll('p')].find(e=>e.textContent==='Binance');if(el)el.scrollIntoView({block:'center'});});
await new Promise(r=>setTimeout(r,600));
await p.screenshot({path:"/tmp/conn-binance.png"});
// Binance "Bağla" butonuna tıkla → modal
await p.evaluate(()=>{
  const card=[...document.querySelectorAll('div')].find(d=>{const t=d.querySelector('p');return t&&t.textContent==='Binance';});
  // kartın içindeki bağla butonu
  const btns=[...document.querySelectorAll('button')].filter(x=>/Bağla|Bağlan/.test(x.textContent||''));
  if(btns.length){const r=btns[btns.length-1];r.click();}
});
await new Promise(r=>setTimeout(r,1500));
await p.screenshot({path:"/tmp/conn-modal.png"});
console.log("done"); await b.close();
