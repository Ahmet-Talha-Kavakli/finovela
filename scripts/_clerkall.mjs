import puppeteer from "puppeteer-core";
const b=await puppeteer.launch({executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:"new",args:["--no-sandbox"]});
const p=await b.newPage(); await p.setViewport({width:1440,height:1000});
await p.goto("http://localhost:3000/sign-in",{waitUntil:"networkidle0",timeout:60000});
await new Promise(r=>setTimeout(r,4500));
const info=await p.evaluate(()=>{
  const f=document.querySelector('.cl-footer');
  const out=[];
  if(f){f.querySelectorAll('*').forEach(el=>{const cs=getComputedStyle(el);const r=el.getBoundingClientRect();out.push({cls:[...el.classList].filter(c=>c.startsWith('cl-')).slice(0,2).join(' '),bg:cs.backgroundColor,h:Math.round(r.height),w:Math.round(r.width)});});}
  return out;
});
console.log(JSON.stringify(info,null,2));
await b.close();
