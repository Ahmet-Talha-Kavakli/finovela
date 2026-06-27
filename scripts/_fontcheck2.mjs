import puppeteer from "puppeteer-core";
const b=await puppeteer.launch({executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:"new",args:["--no-sandbox"]});
const p=await b.newPage(); await p.setViewport({width:1400,height:1000});
await p.goto("http://localhost:3000/dashboard/brain",{waitUntil:"networkidle0",timeout:60000});
await new Promise(r=>setTimeout(r,1500));
const r = await p.evaluate(()=>{
  let hanken=0, other=0; const others=new Set();
  document.querySelectorAll('main *, [class*="vela"], h1,h2,h3,p,span,button,a,input').forEach(el=>{
    // dev overlay'i atla
    if(el.closest('nextjs-portal')) return;
    const f=getComputedStyle(el).fontFamily.toLowerCase();
    if(f.includes('hanken')) hanken++; else if(f){ other++; others.add(f); }
  });
  return {hanken, other, others:[...others]};
});
console.log("hanken els:",r.hanken,"| other els:",r.other);
console.log("other families:", r.others);
await b.close();
