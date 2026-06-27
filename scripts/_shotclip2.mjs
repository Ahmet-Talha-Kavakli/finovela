import puppeteer from "puppeteer-core";
const url=process.argv[2],out=process.argv[3],y=Number(process.argv[4]||0),h=Number(process.argv[5]||900);
const b=await puppeteer.launch({executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:"new",args:["--no-sandbox"]});
const p=await b.newPage(); await p.setViewport({width:1400,height:1100,deviceScaleFactor:2});
await p.goto(url,{waitUntil:"networkidle0",timeout:60000}); await new Promise(r=>setTimeout(r,1500));
await p.evaluate(yy=>window.scrollTo(0,yy), y);
await new Promise(r=>setTimeout(r,800));
await p.screenshot({path:out, clip:{x:240,y:0,width:1160,height:h}});
await b.close(); console.log("ok",out);
