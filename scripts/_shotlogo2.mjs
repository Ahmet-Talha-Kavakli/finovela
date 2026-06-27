import puppeteer from "puppeteer-core";
const b=await puppeteer.launch({executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:"new",args:["--no-sandbox","--window-size=1680,1050"]});
const p=await b.newPage(); await p.setViewport({width:1680,height:1000,deviceScaleFactor:2});
await p.goto("http://localhost:3000/dashboard/chat",{waitUntil:"networkidle0",timeout:60000}); await new Promise(r=>setTimeout(r,1800));
// crop around empty-state logo + sidebar button
await p.screenshot({path:"/tmp/logo-crop.png",clip:{x:700,y:120,width:380,height:200}});
await p.screenshot({path:"/tmp/logo-sb.png",clip:{x:20,y:50,width:230,height:60}});
await b.close(); console.log("done");
