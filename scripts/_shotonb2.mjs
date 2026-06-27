import puppeteer from "puppeteer-core";
const b=await puppeteer.launch({executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:"new",args:["--no-sandbox","--window-size=1440,1000","--autoplay-policy=no-user-gesture-required"]});
const p=await b.newPage(); await p.setViewport({width:1440,height:1000,deviceScaleFactor:1.5});
const click=async(re)=>{await p.evaluate((r)=>{const b=[...document.querySelectorAll('button')].find(x=>new RegExp(r).test(x.textContent||''));if(b)b.click();},re);};
await p.goto("http://localhost:3000/onboarding",{waitUntil:"networkidle0",timeout:60000});
await new Promise(r=>setTimeout(r,3000));
// adım1 doldur
await p.evaluate(()=>{const ins=[...document.querySelectorAll('input')];ins[0].value='Ahmet';ins[0].dispatchEvent(new Event('input',{bubbles:true}));ins[1].value='a@finovela.com';ins[1].dispatchEvent(new Event('input',{bubbles:true}));const s=document.querySelector('select');s.value='Türkiye';s.dispatchEvent(new Event('change',{bubbles:true}));});
await new Promise(r=>setTimeout(r,500)); await click('Devam et'); await new Promise(r=>setTimeout(r,2000));
// adım2: risk + hedef + deneyim
await p.evaluate(()=>{const bs=[...document.querySelectorAll('button')];const find=t=>bs.find(x=>(x.textContent||'').trim().startsWith(t));find('Dengeli')?.click();find('Büyüme')?.click();find('Orta')?.click();});
await new Promise(r=>setTimeout(r,800)); await p.screenshot({path:"/tmp/onb-s2-filled.png"});
await click('Devam et'); await new Promise(r=>setTimeout(r,2200));
await p.screenshot({path:"/tmp/onb-s3.png"});
// adım3: yöntem seç
await p.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(x=>/Banka kartı/.test(x.textContent||''));if(b)b.click();});
await new Promise(r=>setTimeout(r,500)); await click('Devam et'); await new Promise(r=>setTimeout(r,2200));
await p.screenshot({path:"/tmp/onb-s4.png"});
console.log("done"); await b.close();
