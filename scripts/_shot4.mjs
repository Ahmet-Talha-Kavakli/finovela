import puppeteer from "puppeteer-core";
const b=await puppeteer.launch({executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:"new",args:["--no-sandbox","--window-size=1440,900"]});
const p=await b.newPage(); await p.setViewport({width:1440,height:900,deviceScaleFactor:1.5});
// AI NATIVE macbook
await p.goto("http://localhost:3000/",{waitUntil:"networkidle0",timeout:60000}); await new Promise(r=>setTimeout(r,2000));
await p.evaluate(()=>{const t=[...document.querySelectorAll('span')].find(e=>e.textContent==='AI NATIVE'); if(t)t.scrollIntoView({block:'center'});});
await new Promise(r=>setTimeout(r,900)); await p.screenshot({path:"/tmp/v-native.png"});
// app align
await p.goto("http://localhost:3000/app",{waitUntil:"networkidle0",timeout:60000}); await new Promise(r=>setTimeout(r,2500));
await p.screenshot({path:"/tmp/v-app.png"});
// pricing buttons
await p.goto("http://localhost:3000/pricing",{waitUntil:"networkidle0",timeout:60000}); await new Promise(r=>setTimeout(r,1800));
await p.screenshot({path:"/tmp/v-pricing.png"});
// academy icons
await p.goto("http://localhost:3000/academy",{waitUntil:"networkidle0",timeout:60000}); await new Promise(r=>setTimeout(r,1800));
await p.evaluate(()=>{const t=[...document.querySelectorAll('h2,h3')].find(e=>/başla|Track|Yatırıma/.test(e.textContent||'')); if(t)t.scrollIntoView({block:'center'});});
await new Promise(r=>setTimeout(r,700)); await p.screenshot({path:"/tmp/v-academy.png"});
await b.close(); console.log("done");
