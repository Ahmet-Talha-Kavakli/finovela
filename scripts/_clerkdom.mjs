import puppeteer from "puppeteer-core";
const b=await puppeteer.launch({executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:"new",args:["--no-sandbox"]});
const p=await b.newPage();
await p.goto("http://localhost:3000/sign-in",{waitUntil:"networkidle0",timeout:60000});
await new Promise(r=>setTimeout(r,4000));
const cls=await p.evaluate(()=>{
  const out=[];
  document.querySelectorAll('[class*="cl-"]').forEach(el=>{
    const bg=getComputedStyle(el).backgroundColor;
    // beyazımsı arka planı olan öğeleri yakala
    if(/255,\s*255,\s*255/.test(bg) && bg!=="rgba(0, 0, 0, 0)"){
      out.push([...el.classList].filter(c=>c.startsWith('cl-')).join(' ')+" :: "+bg);
    }
  });
  return out;
});
console.log(JSON.stringify(cls,null,2));
await b.close();
