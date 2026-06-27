import puppeteer from "puppeteer-core";
const b=await puppeteer.launch({executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:"new",args:["--no-sandbox","--window-size=1680,1050"]});
const p=await b.newPage(); await p.setViewport({width:1680,height:1000,deviceScaleFactor:1.5});
await p.goto("http://localhost:3000/dashboard",{waitUntil:"networkidle0",timeout:60000}); await new Promise(r=>setTimeout(r,1600));
// büyüt butonuna tıkla (Tam ekran title)
const clicked = await p.evaluate(()=>{ const b=document.querySelector('button[title="Tam ekran"]'); if(b){b.click();return true;} return false; });
await new Promise(r=>setTimeout(r,900));
await p.screenshot({path:"/tmp/chart-fs.png"});
await b.close(); console.log("clicked:",clicked);
