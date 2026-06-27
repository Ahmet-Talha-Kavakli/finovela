import puppeteer from "puppeteer-core";
const b=await puppeteer.launch({executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:"new",args:["--no-sandbox","--window-size=1440,900"]});
const p=await b.newPage(); await p.setViewport({width:1440,height:900,deviceScaleFactor:1.5});
// support (A icons büyük + FAQ)
await p.goto("http://localhost:3000/support",{waitUntil:"networkidle0",timeout:60000}); await new Promise(r=>setTimeout(r,2000));
await p.evaluate(()=>{const t=[...document.querySelectorAll('h2')].find(e=>/göz at/.test(e.textContent||'')); if(t)t.scrollIntoView({block:'start'});});
await new Promise(r=>setTimeout(r,700)); await p.screenshot({path:"/tmp/fix-support.png"});
// FAQ
await p.evaluate(()=>{const t=[...document.querySelectorAll('h2')].find(e=>/Sıkça|SSS/.test(e.textContent||'')); if(t)t.scrollIntoView({block:'start'});});
await new Promise(r=>setTimeout(r,700)); await p.screenshot({path:"/tmp/fix-faq.png"});
// app video
await p.goto("http://localhost:3000/app",{waitUntil:"networkidle0",timeout:60000}); await new Promise(r=>setTimeout(r,2500));
await p.screenshot({path:"/tmp/fix-app.png"});
// strategy cards (mockup navy)
await p.goto("http://localhost:3000/product/strategy",{waitUntil:"networkidle0",timeout:60000}); await new Promise(r=>setTimeout(r,2000));
await p.evaluate(()=>{const t=[...document.querySelectorAll('h3')].find(e=>/Kodlama/.test(e.textContent||'')); if(t)t.scrollIntoView({block:'center'});});
await new Promise(r=>setTimeout(r,700)); await p.screenshot({path:"/tmp/fix-cards.png"});
await b.close(); console.log("done");
