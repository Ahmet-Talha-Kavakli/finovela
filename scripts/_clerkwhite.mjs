import puppeteer from "puppeteer-core";
const b=await puppeteer.launch({executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:"new",args:["--no-sandbox"]});
const p=await b.newPage(); await p.setViewport({width:1440,height:1000});
await p.goto("http://localhost:3000/sign-in",{waitUntil:"networkidle0",timeout:60000});
await new Promise(r=>setTimeout(r,4000));
const info=await p.evaluate(()=>{
  const out=[];
  document.querySelectorAll('*').forEach(el=>{
    const cs=getComputedStyle(el);
    const bg=cs.backgroundColor;
    const r=el.getBoundingClientRect();
    // belirgin beyaz/açık arka planlı ve yeterince büyük öğeler
    const m=bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if(m){const[_,R,G,B,A]=m; const a=A===undefined?1:parseFloat(A);
      if(+R>230&&+G>230&&+B>230&&a>0.5&&r.width>100&&r.height>20){
        out.push({tag:el.tagName,cls:(el.className||'').toString().slice(0,80),bg,w:Math.round(r.width),h:Math.round(r.height),top:Math.round(r.top)});
      }}
  });
  return out.slice(0,15);
});
console.log(JSON.stringify(info,null,2));
await b.close();
