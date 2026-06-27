import puppeteer from "puppeteer-core";
const b=await puppeteer.launch({executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:"new",args:["--no-sandbox","--window-size=1440,1000","--autoplay-policy=no-user-gesture-required"]});
const p=await b.newPage(); await p.setViewport({width:1440,height:1000,deviceScaleFactor:1.5});
await p.goto("http://localhost:3000/onboarding",{waitUntil:"networkidle0",timeout:60000});
await new Promise(r=>setTimeout(r,4000));
await p.screenshot({path:"/tmp/onb-step1.png"});
// adım 1'i doldur ve devam et
await p.evaluate(()=>{
  const ins=[...document.querySelectorAll('input')];
  if(ins[0]){ins[0].value='Ahmet Talha';ins[0].dispatchEvent(new Event('input',{bubbles:true}));}
  if(ins[1]){ins[1].value='ahmet@finovela.com';ins[1].dispatchEvent(new Event('input',{bubbles:true}));}
  const sel=document.querySelector('select'); if(sel){sel.value='Türkiye';sel.dispatchEvent(new Event('change',{bubbles:true}));}
});
await new Promise(r=>setTimeout(r,600));
await p.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(x=>/Devam et/.test(x.textContent||''));if(b)b.click();});
await new Promise(r=>setTimeout(r,2500));
await p.screenshot({path:"/tmp/onb-step2.png"});
console.log("done"); await b.close();
