import puppeteer from "puppeteer-core";
const b=await puppeteer.launch({executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:"new",args:["--no-sandbox","--window-size=1680,1100"]});
const p=await b.newPage(); await p.setViewport({width:1680,height:1050,deviceScaleFactor:1.5});
await p.goto("http://localhost:3000/dashboard/chat",{waitUntil:"networkidle0",timeout:60000}); await new Promise(r=>setTimeout(r,1800));
// type a message that triggers get_technicals
const ta=await p.$('textarea');
await ta.click();
await p.keyboard.type("AAPL teknik göstergelerini göster");
await p.keyboard.press("Enter");
// wait for AI tool result + render (can take a while)
await new Promise(r=>setTimeout(r,22000));
await p.evaluate(()=>{const s=document.querySelector('[class*="overflow-y-auto"]'); if(s)s.scrollTop=s.scrollHeight;});
await new Promise(r=>setTimeout(r,1000));
await p.screenshot({path:"/tmp/chat-card.png",fullPage:false});
await b.close(); console.log("done");
