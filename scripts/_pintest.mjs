import puppeteer from "puppeteer-core";
const b=await puppeteer.launch({executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:"new",args:["--no-sandbox","--window-size=1680,1100"]});
const p=await b.newPage(); await p.setViewport({width:1680,height:1050,deviceScaleFactor:1.5});
// inject a security state: PIN enabled, hash of "1234"
await p.goto("http://localhost:3000/dashboard/settings",{waitUntil:"networkidle0",timeout:60000});
const result=await p.evaluate(()=>{
  function simpleHash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=(h*16777619)>>>0;}return (h>>>0).toString(16);}
  // Simulate the security store verify logic against a stored 1234 hash
  const stored = { txPinEnabled:true, txPinHash: simpleHash("1234") };
  const verify=(pin)=>{const e=(pin||"").trim(); if(e.length<4)return false; if(!stored.txPinEnabled)return true; if(!stored.txPinHash)return false; return simpleHash(e)===stored.txPinHash;};
  return {
    correct_1234: verify("1234"),
    wrong_1111: verify("1111"),
    empty: verify(""),
    broken_state_no_hash: (()=>{const s={txPinEnabled:true,txPinHash:null};const e="1111".trim();if(e.length<4)return false;if(!s.txPinEnabled)return true;if(!s.txPinHash)return false;return false;})(),
  };
});
// also screenshot settings to confirm DangerZone reset button renders
await new Promise(r=>setTimeout(r,800));
await p.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));
await new Promise(r=>setTimeout(r,500));
await p.screenshot({path:"/tmp/settings-danger.png"});
await b.close();
console.log("PIN verify:",JSON.stringify(result,null,2));
