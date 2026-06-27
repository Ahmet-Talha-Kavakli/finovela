import puppeteer from "puppeteer-core";
const b=await puppeteer.launch({executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:"new",args:["--no-sandbox"]});
const p=await b.newPage(); await p.setViewport({width:1440,height:1000});
await p.goto("http://localhost:3000/sign-in",{waitUntil:"networkidle0",timeout:60000});
await new Promise(r=>setTimeout(r,4500));
// iframes
for(const f of p.frames()){console.log("FRAME:",f.url().slice(0,80));}
// scan including light-gray elements in lower region of card
const info=await p.evaluate(()=>{
  const out=[];
  document.querySelectorAll('*').forEach(el=>{
    const cs=getComputedStyle(el);const bg=cs.backgroundColor;const r=el.getBoundingClientRect();
    const m=bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if(m){const a=m[4]===undefined?1:parseFloat(m[4]);
      if(+m[1]>180&&+m[2]>180&&+m[3]>180&&a>0.3&&r.width>150&&r.height>30&&r.top>500){
        out.push({tag:el.tagName,cls:(el.className||'').toString().slice(0,60),bg,h:Math.round(r.height),top:Math.round(r.top)});
      }}
  });
  return out;
});
console.log("LIGHT-LOWER:",JSON.stringify(info,null,2));
await b.close();
