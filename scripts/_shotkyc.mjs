import puppeteer from "puppeteer-core";
const b=await puppeteer.launch({executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:"new",args:["--no-sandbox","--window-size=1440,1000","--autoplay-policy=no-user-gesture-required"]});
const p=await b.newPage(); await p.setViewport({width:1440,height:1000,deviceScaleFactor:1.5});
await p.goto("http://localhost:3000/onboarding",{waitUntil:"networkidle0",timeout:60000}); await new Promise(r=>setTimeout(r,3000));
// adım 1 doldur
const ins=await p.$$('input'); await ins[0].type('Ahmet Talha'); await ins[1].type('a@finovela.com'); await p.select('select','Türkiye');
await new Promise(r=>setTimeout(r,400));
await p.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(x=>/Devam et/.test(x.textContent||''));b&&b.click();});
await new Promise(r=>setTimeout(r,2200));
await p.screenshot({path:"/tmp/onb-kyc.png"}); // adım 2 KYC
console.log("step2:", await p.evaluate(()=>document.querySelector('h1')?.textContent));
await b.close();
