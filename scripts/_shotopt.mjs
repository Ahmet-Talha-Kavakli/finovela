import puppeteer from "puppeteer-core";
const b=await puppeteer.launch({executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:"new",args:["--no-sandbox","--window-size=1440,1000"]});
const p=await b.newPage(); await p.setViewport({width:1440,height:1000,deviceScaleFactor:1.5});
await p.goto("http://localhost:3000/dashboard/options",{waitUntil:"networkidle0",timeout:60000}); await new Promise(r=>setTimeout(r,4500));
await p.screenshot({path:"/tmp/options-live.png"});
// AAPL fiyatını oku
const txt=await p.evaluate(()=>document.body.innerText.match(/AAPL[\s\S]{0,60}/)?.[0]||"");
console.log("AAPL bağlam:", txt.replace(/\n/g,' ').slice(0,80));
await b.close();
