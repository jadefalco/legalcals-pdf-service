import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

export async function renderBCEvictionNotice(data) {
  const templatePath = path.join(process.cwd(), "src", "templates", "bc-eviction-10day.html");
  const cssPath = path.join(process.cwd(), "src", "styles", "bc-eviction-10day.css");

  let html = fs.readFileSync(templatePath, "utf8");
  const css = fs.readFileSync(cssPath, "utf8");

  html = html.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] !== undefined ? data[key] : "";
  });

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  await page.setContent(`
    <style>${css}</style>
    ${html}
  `);

  const pdf = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: { top: "1in", bottom: "1in", left: "1in", right: "1in" }
  });

  await browser.close();
  return pdf;
}
