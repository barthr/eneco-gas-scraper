import { chromium } from "playwright";
import fetch from "node-fetch";
import * as dotenv from "dotenv";
import { writeFile } from "fs/promises";

dotenv.config();

const usage = async (page) => {
  var secrets = await page.evaluate("window.__SSR_CONTEXT__.globalKeys");

  const currentDate = new Date();
  const start = `${currentDate.getFullYear()}-1-1`;
  const url = `https://api-digital.enecogroup.com/v1/enecoweb/v2/eneco/customers/43863032/accounts/2/usages?aggregation=Year&interval=Month&start=${start}&addBudget=false&addWeather=false&extrapolate=false`;

  const response = await fetch(url, {
    headers: {
      Authorization: secrets["my"]["secret"],
      apikey: secrets["digitalCore"]["private"],
    },
  });
  return response.json();
};

const crawlEnecoUsage = async () => {
  const browser = await chromium.launch({
    headless: true, // Show the browser.
  });

  const page = await browser.newPage();
  await page.goto("https://inloggen.eneco.nl/");
  await page.fill('input[name="username"]', process.env.ENECO_USERNAME);
  await page.click("input[type='submit']");
  await page.fill('input[name="password"]', process.env.ENECO_PASSWORD);
  await page.click("input[type='submit']");
  await page.waitForTimeout(10000);

  const enecoUsage = await usage(page);

  const gasUsage =
    enecoUsage.data.usages[0].entries[new Date().getMonth()].actual.gas
      .totalUsageCostInclVat;

  console.log(`Gas usage this month: € ${gasUsage}`);

  // write response to file
  await writeFile(
    process.env.RESULTS_DIRECTORY + "/usage.json",
    JSON.stringify(enecoUsage)
  );

  await browser.close();
};

crawlEnecoUsage().then(() => console.log("Done"));
