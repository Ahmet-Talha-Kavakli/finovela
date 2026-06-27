import puppeteer from "puppeteer-core";
const url = process.argv[2];
const out = process.argv[3];
const full = process.argv[4] === "full";
const b = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--no-sandbox", "--window-size=1440,2200"],
});
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 1200, deviceScaleFactor: 2 });
await p.goto(url, { waitUntil: "networkidle0", timeout: 60000 });
await new Promise((r) => setTimeout(r, 1800));
await p.screenshot({ path: out, fullPage: full });
await b.close();
console.log("shot:", out);
