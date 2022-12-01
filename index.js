import * as dotenv from "dotenv";
import { readFile } from "fs/promises";
import { setInterval } from "timers/promises";
import express from "express";
import {
  retrieveCurrentEnergyPrice,
  retrieveUsageThisPeriod,
} from "./tibber.mjs";
import { crawlEnecoUsage } from "./eneco.mjs";

dotenv.config();

const enecoUsageFile = process.env.RESULTS_DIRECTORY + "/usage.json";
const app = express();
const port = process.env.PORT;

app.get("/gas/crawl", async (_, res) => {
  await crawlEnecoUsage(enecoUsageFile);
  res.json({ success: true });
});

app.get("/energy/summary", async (_, res) => {
  const enecoUsage = JSON.parse(await readFile(enecoUsageFile));

  const month = new Date().getMonth();
  const gasUsageThisPeriod =
    enecoUsage.data.usages[0].entries[month].actual.gas;

  const energyCurrentPrice = await retrieveCurrentEnergyPrice();
  const energyPeriodUsage = await retrieveUsageThisPeriod(
    new Date().getDate() - 1
  ); // Adjust for 0 based index (this is the actual start of the month)

  res.json({
    gas: {
      month: month + 1,
      usage: gasUsageThisPeriod.high,
      usageUnit: "\u33A5",
      totalCost: gasUsageThisPeriod.totalCostInclVat,
      price:
        gasUsageThisPeriod.totalUsageCostInclVat / gasUsageThisPeriod.high ?? 0,
      costUnit: "\u20AC",
    },
    electricity: {
      month: {
        month: month + 1,
        usage: energyPeriodUsage.data.viewer.homes[0].consumption.nodes.reduce(
          (acc, item) => acc + item.consumption,
          0.0
        ),
        usageUnit: "kWh",
        totalCost:
          energyPeriodUsage.data.viewer.homes[0].consumption.nodes.reduce(
            (acc, item) => acc + item.cost,
            0.0
          ),
        costUnit: "\u20AC",
      },
      current: {
        price:
          energyCurrentPrice.data.viewer.homes[0].currentSubscription.priceInfo
            .current.total,
        unit: "\u20AC",
      },
    },
  });
});

app.listen(port, () => {
  console.log(`Energy dashboard listening on port ${port}`);
});

for await (const _startTime of setInterval(
  process.env.SCRAPE_INTERVAL_MINUTES * 60 * 1000
)) {
  crawlEnecoUsage(enecoUsageFile).then(() =>
    console.log(`Executed crawling round at: ${new Date()}`)
  );
}
