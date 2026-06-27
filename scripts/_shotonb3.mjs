import puppeteer from "puppeteer-core";
const b=await puppeteer.launch({executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:"new",args:["--no-sandbox","--window-size=1440,1000","--autoplay-policy=no-user-gesture-required"]});
const p=await b.newPage(); await p.setViewport({width:1440,height:1000,deviceScaleFactor:1.5});
await p.goto("http://localhost:3000/onboarding",{waitUntil:"networkidle0",timeout:60000});
await new Promise(r=>setTimeout(r,3000));
// React-uyumlu input doldurma: puppeteer type() kullan
const inputs=await p.$$('input');
await inputs[0].type('Ahmet Talha',{delay:10});
await inputs[1].type('ahmet@finovela.com',{delay:10});
await p.select('select','Türkiye');
await new Promise(r=>setTimeout(r,500));
// Devam et butonu
await p.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(x=>/Devam et/.test(x.textContent||''));b&&b.click();});
await new Promise(r=>setTimeout(r,2200));
await p.screenshot({path:"/tmp/onb-real-s2.png"});
console.log("step shown:", await p.evaluate(()=>document.querySelector('h1')?.textContent));
await b.close();
