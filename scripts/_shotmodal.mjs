import puppeteer from "puppeteer-core";
const b=await puppeteer.launch({executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:"new",args:["--no-sandbox","--window-size=1440,1000"]});
const p=await b.newPage(); await p.setViewport({width:1440,height:1000,deviceScaleFactor:1.5});
// önce localStorage'ı temizle (binance bağlı görünmesin)
await p.goto("http://localhost:3000/dashboard/connections",{waitUntil:"domcontentloaded",timeout:60000});
await p.evaluate(()=>localStorage.removeItem('vela.connections.v1'));
await p.reload({waitUntil:"networkidle0"});
await new Promise(r=>setTimeout(r,2500));
// Binance kartındaki "Bağla" butonu
await p.evaluate(()=>{const el=[...document.querySelectorAll('p')].find(e=>e.textContent==='Binance');if(el)el.scrollIntoView({block:'center'});});
await new Promise(r=>setTimeout(r,500));
const clicked=await p.evaluate(()=>{
  // Binance kartını bul
  const cards=[...document.querySelectorAll('.ais-card')];
  const card=cards.find(c=>c.textContent&&c.textContent.includes('Binance'));
  if(!card)return 'no-card';
  const btn=[...card.querySelectorAll('button')].find(x=>/Bağla/.test(x.textContent||''));
  if(!btn)return 'no-btn:'+card.textContent.slice(0,60);
  btn.click(); return 'clicked';
});
console.log("click:",clicked);
await new Promise(r=>setTimeout(r,1500));
await p.screenshot({path:"/tmp/conn-modal2.png"});
await b.close();
