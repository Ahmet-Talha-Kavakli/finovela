import puppeteer from "puppeteer-core";
const b=await puppeteer.launch({executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:"new",args:["--no-sandbox"]});
const p=await b.newPage(); await p.setViewport({width:1400,height:1000});
await p.goto("http://localhost:3000/dashboard/brain",{waitUntil:"networkidle0",timeout:60000});
await new Promise(r=>setTimeout(r,1500));
const fams = await p.evaluate(()=>{
  const set=new Set();
  document.querySelectorAll('body *').forEach(el=>{
    const f=getComputedStyle(el).fontFamily;
    if(f) set.add(f);
  });
  return [...set];
});
console.log("DISTINCT font-family values on page:");
fams.forEach(f=>console.log(" -", f));
await b.close();
