import puppeteer from "puppeteer-core";
const url=process.argv[2],out=process.argv[3];
const b=await puppeteer.launch({executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:"new",args:["--no-sandbox"]});
const p=await b.newPage(); await p.setViewport({width:1400,height:1000,deviceScaleFactor:2});
await p.goto(url,{waitUntil:"networkidle0",timeout:60000}); await new Promise(r=>setTimeout(r,1200));
// step-scroll to trigger whileInView reveals
for(let y=0;y<=1700;y+=300){ await p.evaluate(yy=>window.scrollTo(0,yy),y); await new Promise(r=>setTimeout(r,350)); }
await p.evaluate(()=>window.scrollTo(0,0)); await new Promise(r=>setTimeout(r,400));
await p.screenshot({path:out, fullPage:true});
await b.close(); console.log("ok",out);
