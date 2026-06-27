import puppeteer from "puppeteer-core";
const b=await puppeteer.launch({executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:"new",args:["--no-sandbox","--window-size=1440,1000","--autoplay-policy=no-user-gesture-required"]});
const p=await b.newPage(); await p.setViewport({width:1440,height:1000,deviceScaleFactor:1.5});
const setNative=(sel,val,idx=0)=>p.evaluate((s,v,i)=>{const els=document.querySelectorAll(s);const el=els[i];const proto=Object.getPrototypeOf(el);const setter=Object.getOwnPropertyDescriptor(proto,'value').set;setter.call(el,v);el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));},sel,val,idx);
const click=(re)=>p.evaluate((r)=>{const b=[...document.querySelectorAll('button')].find(x=>new RegExp(r).test(x.textContent||''));b&&b.click();},re);
await p.goto("http://localhost:3000/onboarding",{waitUntil:"networkidle0",timeout:60000}); await new Promise(r=>setTimeout(r,3000));
// adım1
await setNative('input','Ahmet',0); await setNative('input','a@f.com',1); await p.select('select','Türkiye');
await new Promise(r=>setTimeout(r,300)); await click('Devam et'); await new Promise(r=>setTimeout(r,1800));
// adım2: doğum(date input 0), tür, no(input idx1)
await setNative('input','1995-05-15',0); await click('T.C. Kimlik'); await setNative('input','12345678901',1);
await new Promise(r=>setTimeout(r,400)); await click('Devam et'); await new Promise(r=>setTimeout(r,2000));
await p.screenshot({path:"/tmp/onb-phone.png"});
console.log("step3:", await p.evaluate(()=>document.querySelector('h1')?.textContent));
await b.close();
