import puppeteer from "puppeteer-core";
const b=await puppeteer.launch({executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:"new",args:["--no-sandbox","--window-size=1440,900"]});
const p=await b.newPage(); await p.setViewport({width:1440,height:900,deviceScaleFactor:1});
await p.goto("http://localhost:3000/",{waitUntil:"networkidle0",timeout:60000}); await new Promise(r=>setTimeout(r,2500));
// full page screenshot
await p.screenshot({path:"/tmp/land-full.png",fullPage:true});
// also top hero
await p.screenshot({path:"/tmp/land-hero.png"});
await b.close(); console.log("done");
