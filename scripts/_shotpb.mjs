import puppeteer from "puppeteer-core";
const b=await puppeteer.launch({executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:"new",args:["--no-sandbox","--window-size=1440,900"]});
const p=await b.newPage(); await p.setViewport({width:1440,height:900,deviceScaleFactor:1.5});
await p.goto("http://localhost:3000/pricing",{waitUntil:"networkidle0",timeout:60000}); await new Promise(r=>setTimeout(r,1800));
await p.evaluate(()=>window.scrollTo(0,560));
await new Promise(r=>setTimeout(r,600)); await p.screenshot({path:"/tmp/v-pbtn.png"});
await b.close(); console.log("done");
