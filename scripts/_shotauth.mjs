import puppeteer from "puppeteer-core";
const b=await puppeteer.launch({executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:"new",args:["--no-sandbox","--window-size=1440,1000"]});
const p=await b.newPage(); await p.setViewport({width:1440,height:1000,deviceScaleFactor:1.5});
async function shot(url,file,wait=3500){await p.goto("http://localhost:3000"+url,{waitUntil:"networkidle0",timeout:60000}); await new Promise(r=>setTimeout(r,wait)); await p.screenshot({path:file}); console.log(file,"done");}
await shot("/sign-in","/tmp/auth-signin.png");
await shot("/sign-up","/tmp/auth-signup.png");
await shot("/app","/tmp/auth-app.png");
await b.close(); console.log("all done");
