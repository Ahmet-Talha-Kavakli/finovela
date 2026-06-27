import puppeteer from "puppeteer-core";
const b=await puppeteer.launch({executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:"new",args:["--no-sandbox","--window-size=1440,900"]});
const p=await b.newPage(); await p.setViewport({width:1440,height:900,deviceScaleFactor:1});
// landing full
await p.goto("http://localhost:3000/",{waitUntil:"networkidle0",timeout:60000}); await new Promise(r=>setTimeout(r,2500));
await p.screenshot({path:"/tmp/all-land.png",fullPage:true});
// made-natural close
await p.evaluate(()=>{const t=[...document.querySelectorAll('h2')].find(e=>/Konuş, Dokun/.test(e.textContent||'')); if(t)t.scrollIntoView({block:'center'});});
await new Promise(r=>setTimeout(r,800)); await p.screenshot({path:"/tmp/all-made.png"});
// product/ai page
await p.goto("http://localhost:3000/product/ai",{waitUntil:"networkidle0",timeout:60000}); await new Promise(r=>setTimeout(r,1500));
await p.screenshot({path:"/tmp/all-prodai.png"});
await b.close(); console.log("done");
