import puppeteer from "puppeteer-core";
const b=await puppeteer.launch({executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:"new",args:["--no-sandbox"]});
const p=await b.newPage(); await p.setViewport({width:1400,height:1000});
await p.goto("http://localhost:3000/dashboard/brain",{waitUntil:"networkidle0",timeout:60000});
await new Promise(r=>setTimeout(r,1500));
const info = await p.evaluate(()=>{
  const find=(t)=>{const el=[...document.querySelectorAll('h2,p,*')].find(e=>e.textContent.trim()===t); if(!el) return t+': MISSING'; const r=el.getBoundingClientRect(); return t+': top='+Math.round(r.top+window.scrollY)+' h='+Math.round(r.height);};
  return [find('Karar Defteri'),find('Hedeflerin pusula'),find('Acil durdurma'),'bodyH='+document.body.scrollHeight].join('\n');
});
console.log(info); await b.close();
