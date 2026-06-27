import puppeteer from "puppeteer-core";
const b=await puppeteer.launch({executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:"new",args:["--no-sandbox","--window-size=1440,900"]});
const p=await b.newPage(); await p.setViewport({width:1440,height:900,deviceScaleFactor:1});
const shots=[
  ["/", "tour-landing.png", true],
  ["/product/ai","tour-ai.png", true],
  ["/markets","tour-markets.png", false],
  ["/pricing","tour-pricing.png", true],
  ["/download","tour-download.png", false],
];
for(const [url,file,full] of shots){
  await p.goto("http://localhost:3000"+url,{waitUntil:"networkidle0",timeout:60000});
  await new Promise(r=>setTimeout(r,2200));
  await p.screenshot({path:"/tmp/"+file, fullPage:full});
  console.log("✓",file);
}
await b.close();
