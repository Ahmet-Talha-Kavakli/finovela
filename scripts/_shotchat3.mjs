import puppeteer from "puppeteer-core";
const b=await puppeteer.launch({executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:"new",args:["--no-sandbox","--window-size=1680,1050"]});
const p=await b.newPage(); await p.setViewport({width:1680,height:1000,deviceScaleFactor:1.5});
await p.goto("http://localhost:3000/dashboard/chat",{waitUntil:"networkidle0",timeout:60000}); await new Promise(r=>setTimeout(r,1800));
// 1) open model picker
const opened=await p.evaluate(()=>{
  const btns=[...document.querySelectorAll('button')];
  const mp=btns.find(b=>/Vela 1\.2|Vela 1\.1|Vela 1\b/.test(b.textContent||''));
  if(mp){mp.click();return true;} return false;
});
await new Promise(r=>setTimeout(r,600));
await p.screenshot({path:"/tmp/chat-modelpicker.png"});
// close picker, then collapse sidebar
await p.keyboard.press("Escape"); await new Promise(r=>setTimeout(r,300));
const collapsed=await p.evaluate(()=>{
  const b=document.querySelector('button[title="Geçmişi daralt"]');
  if(b){b.click();return true;} return false;
});
await new Promise(r=>setTimeout(r,700));
await p.screenshot({path:"/tmp/chat-collapsed.png"});
await b.close(); console.log("modelpicker:",opened,"collapsed:",collapsed);
