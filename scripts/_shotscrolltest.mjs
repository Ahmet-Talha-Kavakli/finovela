import puppeteer from "puppeteer-core";
const b=await puppeteer.launch({executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:"new",args:["--no-sandbox","--window-size=1680,1100"]});
const p=await b.newPage(); await p.setViewport({width:1680,height:1050,deviceScaleFactor:1.5});
await p.goto("http://localhost:3000/dashboard/chat",{waitUntil:"networkidle0",timeout:60000}); await new Promise(r=>setTimeout(r,1800));
const ta=await p.$('textarea'); await ta.click();
await p.keyboard.type("Portföy çeşitlendirmesi hakkında uzun ve detaylı bir rehber yaz, en az 8 madde.");
await p.keyboard.press("Enter");
// wait until streaming starts
await new Promise(r=>setTimeout(r,6000));
// user scrolls UP mid-stream to read
const sc='[class*="overflow-y-auto"]';
await p.evaluate((s)=>{const el=document.querySelector(s); if(el)el.scrollTop=0;},sc);
const beforeTop=await p.evaluate((s)=>document.querySelector(s)?.scrollTop ?? -1, sc);
// wait while more tokens stream in — did it yank us back down?
await new Promise(r=>setTimeout(r,7000));
const afterTop=await p.evaluate((s)=>document.querySelector(s)?.scrollTop ?? -1, sc);
const scrollHeight=await p.evaluate((s)=>document.querySelector(s)?.scrollHeight ?? -1, sc);
await p.screenshot({path:"/tmp/scrolltest.png"});
await b.close();
console.log("scrolledTo0_then:",beforeTop,"->",afterTop,"(scrollHeight:",scrollHeight,") YANK=",afterTop>beforeTop+50);
