import puppeteer from "puppeteer-core";
const b=await puppeteer.launch({executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:"new",args:["--no-sandbox"]});
const p=await b.newPage();
await p.goto("http://localhost:3000/sign-in",{waitUntil:"networkidle0",timeout:60000});
await new Promise(r=>setTimeout(r,4000));
const info=await p.evaluate(()=>{
  const sel=['.cl-footer','.cl-footerAction','.cl-footerPages','.cl-internalBadge','[class*="footer"]','[class*="Footer"]','[class*="badge"]','[class*="Badge"]','[class*="devBrowser"]'];
  const out=[];
  document.querySelectorAll('[class*="cl-"]').forEach(el=>{
    const c=[...el.classList].filter(x=>x.startsWith('cl-'));
    if(c.some(x=>/footer|badge|branded|powered/i.test(x))){
      const cs=getComputedStyle(el);
      out.push({cls:c.join(' '), bg:cs.backgroundColor, h:el.offsetHeight});
    }
  });
  return out;
});
console.log(JSON.stringify(info,null,2));
await b.close();
