import puppeteer from "puppeteer-core";
const b=await puppeteer.launch({executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:"new",args:["--no-sandbox","--window-size=1680,1100"]});
const p=await b.newPage(); await p.setViewport({width:1680,height:1050,deviceScaleFactor:1.5});
await p.goto("http://localhost:3000/dashboard/chat",{waitUntil:"networkidle0",timeout:60000}); await new Promise(r=>setTimeout(r,1800));
// screenshot composer (attach button visible?)
await p.screenshot({path:"/tmp/web-composer.png",clip:{x:520,y:880,width:1100,height:160}});
// ask a current-events question to trigger web_search
const ta=await p.$('textarea'); await ta.click();
await p.keyboard.type("Bugün piyasalarda en çok konuşulan haber ne? Webde ara.");
await p.keyboard.press("Enter");
await new Promise(r=>setTimeout(r,30000));
await p.evaluate(()=>{const s=document.querySelector('[class*="overflow-y-auto"]'); if(s)s.scrollTop=s.scrollHeight;});
await new Promise(r=>setTimeout(r,800));
await p.screenshot({path:"/tmp/web-result.png",fullPage:false});
await b.close(); console.log("done");
