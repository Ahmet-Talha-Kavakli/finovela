import puppeteer from "puppeteer-core";
const b=await puppeteer.launch({executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:"new",args:["--no-sandbox","--window-size=1440,1000","--autoplay-policy=no-user-gesture-required"]});
const p=await b.newPage(); await p.setViewport({width:1440,height:1000,deviceScaleFactor:1.5});
await p.goto("http://localhost:3000/app",{waitUntil:"networkidle0",timeout:60000}); await new Promise(r=>setTimeout(r,3500));
await p.screenshot({path:"/tmp/app-fixed.png"});
console.log("done"); await b.close();
