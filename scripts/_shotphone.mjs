import puppeteer from "puppeteer-core";
const b=await puppeteer.launch({executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:"new",args:["--no-sandbox","--window-size=1440,1000","--autoplay-policy=no-user-gesture-required"]});
const p=await b.newPage(); await p.setViewport({width:1440,height:1000,deviceScaleFactor:1.5});
await p.goto("http://localhost:3000/onboarding",{waitUntil:"networkidle0",timeout:60000}); await new Promise(r=>setTimeout(r,3000));
const click=(re)=>p.evaluate((r)=>{const b=[...document.querySelectorAll('button')].find(x=>new RegExp(r).test(x.textContent||''));b&&b.click();},re);
// adım1
let ins=await p.$$('input'); await ins[0].type('Ahmet'); await ins[1].type('a@f.com'); await p.select('select','Türkiye');
await new Promise(r=>setTimeout(r,300)); await click('Devam et'); await new Promise(r=>setTimeout(r,1800));
// adım2 KYC: doğum + tür + no
ins=await p.$$('input'); await p.evaluate((el)=>{el.value='1995-05-15';el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}, ins[0]);
await click('T.C. Kimlik'); 
ins=await p.$$('input'); await ins[1].type('12345678901');
await new Promise(r=>setTimeout(r,300)); await click('Devam et'); await new Promise(r=>setTimeout(r,2000));
await p.screenshot({path:"/tmp/onb-phone.png"});
console.log("step3:", await p.evaluate(()=>document.querySelector('h1')?.textContent));
await b.close();
