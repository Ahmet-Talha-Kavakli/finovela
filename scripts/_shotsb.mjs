import puppeteer from "puppeteer-core";
const url=process.argv[2], out=process.argv[3], collapse=process.argv[4]==="collapse";
const b=await puppeteer.launch({executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:"new",args:["--no-sandbox","--window-size=1680,1050"]});
const p=await b.newPage(); await p.setViewport({width:1680,height:1000,deviceScaleFactor:1.5});
await p.goto(url,{waitUntil:"networkidle0",timeout:60000}); await new Promise(r=>setTimeout(r,1400));
if(collapse){
  // sidebar daralt düğmesine bas (CaretLeft)
  await p.evaluate(()=>{ const btn=[...document.querySelectorAll('button[title]')].find(b=>/daralt/i.test(b.title)); if(btn) btn.click(); });
  await new Promise(r=>setTimeout(r,700));
}
await p.screenshot({path:out});
await b.close(); console.log("ok",out);
