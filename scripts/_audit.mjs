import puppeteer from "puppeteer-core";

const OUT = "/private/tmp/claude-501/-Users-aysegulcadircioglu-Desktop-Projeler-Ba-lanmam---infite-craft/2099b289-327f-4936-ab16-176338aa9a45/scratchpad";
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--no-sandbox", "--window-size=1440,2400"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 2200, deviceScaleFactor: 1 });

const consoleErrs = {};
page.on("console", (m) => { if (m.type() === "error") { const u = page.url(); (consoleErrs[u] ||= []).push(m.text().slice(0, 140)); } });
page.on("pageerror", (e) => { const u = page.url(); (consoleErrs[u] ||= []).push("PAGEERR " + String(e).slice(0, 140)); });

const pages = [
  ["01-overview", "/dashboard"],
  ["02-portfolio", "/dashboard/portfolio"],
  ["03-analytics", "/dashboard/analytics"],
  ["04-markets", "/dashboard/markets"],
  ["05-smart-portfolios", "/dashboard/portfolios"],
  ["06-generated", "/dashboard/generated"],
  ["07-options", "/dashboard/options"],
  ["08-bonds", "/dashboard/bonds"],
  ["09-earn", "/dashboard/earn"],
  ["10-tax", "/dashboard/tax"],
  ["11-strategy", "/dashboard/strategy"],
  ["12-automation", "/dashboard/automation"],
  ["13-alerts", "/dashboard/alerts"],
  ["14-copy", "/dashboard/copy"],
  ["15-feed", "/dashboard/feed"],
  ["16-research", "/dashboard/research"],
  ["17-earnings", "/dashboard/earnings"],
  ["18-settings", "/dashboard/settings"],
  ["19-stock-nvda", "/dashboard/stock/NVDA"],
  ["20-copy-profile", "/dashboard/copy/quantsarah"],
];

for (const [name, path] of pages) {
  try {
    await page.goto(`http://localhost:3000${path}`, { waitUntil: "networkidle2", timeout: 40000 });
    await new Promise((r) => setTimeout(r, 2200));
    await page.screenshot({ path: `${OUT}/aud-${name}.png`, fullPage: true });
    console.log("shot", name);
  } catch (e) {
    console.log("FAIL", name, String(e).slice(0, 100));
  }
}
await browser.close();
console.log("\n=== CONSOLE ERRORS ===");
let any = false;
for (const [u, errs] of Object.entries(consoleErrs)) {
  any = true;
  console.log(u.replace("http://localhost:3000",""), "→", errs.length);
  [...new Set(errs)].slice(0,3).forEach(e=>console.log("   ", e));
}
if (!any) console.log("none");
