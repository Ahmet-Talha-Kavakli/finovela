import puppeteer from "puppeteer-core";
const url=process.argv[2],out=process.argv[3];
const b=await puppeteer.launch({executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:"new",args:["--no-sandbox"]});
const p=await b.newPage(); await p.setViewport({width:1400,height:1000,deviceScaleFactor:2});
await p.goto(url,{waitUntil:"networkidle0",timeout:60000}); await new Promise(r=>setTimeout(r,1500));
// scroll every scrollable ancestor to bottom
await p.evaluate(()=>{
  document.querySelectorAll('*').forEach(el=>{
    if(el.scrollHeight>el.clientHeight+50) el.scrollTop=el.scrollHeight;
  });
  window.scrollTo(0,document.body.scrollHeight);
});
await new Promise(r=>setTimeout(r,1000));
await p.screenshot({path:out, clip:{x:240,y:0,width:1160,height:1000}});
await b.close(); console.log("ok",out);
