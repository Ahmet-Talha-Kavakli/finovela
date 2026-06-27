import puppeteer from "puppeteer-core";
const b=await puppeteer.launch({executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:"new",args:["--no-sandbox"]});
const p=await b.newPage(); await p.setViewport({width:1440,height:1000});
await p.goto("http://localhost:3000/sign-in",{waitUntil:"networkidle0",timeout:60000});
await new Promise(r=>setTimeout(r,4500));
const info=await p.evaluate(()=>{
  const names=['.cl-footer','.cl-cardBox','.cl-card','.cl-footerAction','.cl-internal-uev6r3','[class*="cardFooter"]','[class*="cardBox"]'];
  const out={};
  names.forEach(n=>{const el=document.querySelector(n); if(el){const cs=getComputedStyle(el);out[n]={bg:cs.backgroundColor,h:el.offsetHeight,radius:cs.borderRadius};}});
  // also: ALL direct children of cardBox with their bg
  const cb=document.querySelector('.cl-cardBox');
  const kids=[];
  if(cb){cb.querySelectorAll(':scope > *').forEach(el=>{const cs=getComputedStyle(el);kids.push({cls:[...el.classList].filter(c=>c.startsWith('cl-')).slice(0,2).join(' '),bg:cs.backgroundColor,h:el.offsetHeight});});}
  return {named:out,cardBoxChildren:kids};
});
console.log(JSON.stringify(info,null,2));
await b.close();
