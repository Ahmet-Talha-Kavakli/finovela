import puppeteer from "puppeteer-core";
const b=await puppeteer.launch({executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:"new",args:["--no-sandbox","--window-size=1440,900"]});
const p=await b.newPage(); await p.setViewport({width:1440,height:900,deviceScaleFactor:1.5});
await p.goto("http://localhost:3000/product/strategy",{waitUntil:"networkidle0",timeout:60000}); await new Promise(r=>setTimeout(r,2000));
await p.evaluate(()=>{const t=[...document.querySelectorAll('h3')].find(e=>/Kodlama, sadece/.test(e.textContent||'')); if(t)t.scrollIntoView({block:'center'});});
await new Promise(r=>setTimeout(r,800));
await p.screenshot({path:"/tmp/cards-compare.png"});
await b.close(); console.log("done");
