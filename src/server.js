import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

export async function renderBCEvictionNotice(data) {
  console.log("Renderer: starting");

  const templatePath = path.join(process.cwd(), "src", "templates", "bc-eviction-10day.html");
  const cssPath = path.join(process.cwd(), "src", "styles", "bc-eviction-10day.css");

  console.log("Renderer: templatePath =", templatePath);
  console.log("Renderer: cssPath =", cssPath);

  let html;
  let css;

  try {
    html = fs.readFileSync(templatePath, "utf8");
    css = fs.readFileSync(cssPath, "utf8");
    console.log("Renderer: template + css loaded");
  } catch (err) {
    console.error("Renderer: failed to load template or css", err);
    throw err;
  }

  html = html.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] !== undefined ? data[key] : "";
  });

  console.log("Renderer: launching browser…");

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    console.log("Renderer: browser launched");
  } catch (err) {
    console.error("Renderer: browser launch failed", err);
    throw err;
  }

  const page = await browser.newPage();

  try {
    await page.setContent(`<style>${css}</style>${html}`);
    console.log("Renderer: content set");
  } catch (err) {
    console.error("Renderer: setContent failed", err);
    throw err;
  }

  try {
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "1in", bottom: "1in", left: "1in", right: "1in" }
    });
    console.log("Renderer: pdf generated");
    await browser.close();
    return pdf;
  } catch (err) {
    console.error("Renderer: pdf generation failed", err);
    throw err;
  }
}
