// Importing required modules
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const SCROLL_DURATION = 5000; // 5s
const SCROLL_INTERVAL = 100; // 0.1s

// Function to scroll the page
async function scrollPage(page) {
  await page.evaluate(async (duration, interval) => {
    await new Promise((resolve) => {
      const scrollStep = () => {
        window.scrollBy(0, window.innerHeight);
        if (window.innerHeight + window.scrollY < document.body.offsetHeight) {
          setTimeout(scrollStep, interval);
        } else {
          resolve();
        }
      };
      setTimeout(scrollStep, interval);
      setTimeout(resolve, duration);
    });
  }, SCROLL_DURATION, SCROLL_INTERVAL);
}

// Function to process a region
async function processRegion(region) {
  // Launch Puppeteer and create a new page
  const browser = await puppeteer.launch({headless: "new"});
  const page = await browser.newPage();

  // Go to the leaderboard page for the current region
  const url = region.name !== 'global' ? `https://tactics.tools/leaderboards/${region.name}` : 'https://tactics.tools/leaderboards';
  await page.goto(url);
  await page.waitForSelector('a[class^="flex items-center"] .truncate');

  // Scroll the page to load all player names
  await scrollPage(page);

  // Extract player names from the page
  const playerData = await page.$$eval(
    'a[class^="flex items-center"]',
    (elements) =>
      elements.map((element) => {
        const regionCode = element.querySelector('.flex-shrink-0').textContent.trim();
        const playerName = element.querySelector('.truncate').textContent.trim();
        return { regionCode, playerName };
      })
  );

  // Output the player names for the current region
  const regionName = region.name !== 'global' ? region.name.toUpperCase() : 'GLOBAL';
  console.log(`${regionName} Player List:`);
  console.log(playerData);

  // Write player names to a file
  const outputFolder = 'playerlists';
  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder);
  }
  const filePath = path.join(outputFolder, region.fileName);
  fs.writeFileSync(filePath, JSON.stringify(playerData));

  // Close the browser
  await browser.close();
}

// Main function
(async () => {
  // Define regions and corresponding filenames
  const regions = [
    { name: 'euw', fileName: 'euw_playerlist.json' },
    { name: 'na', fileName: 'na_playerlist.json' },
    { name: 'kr', fileName: 'kr_playerlist.json' },
    { name: 'global', fileName: 'global_playerlist.json' },
  ];

  // Create an array to hold the tasks
  const tasks = [];

  // Process each region
  for (const region of regions) {
    // Create a task for each region and add it to the tasks array
    const task = processRegion(region);
    tasks.push(task);
  }

  // Wait for all tasks to complete
  await Promise.all(tasks);

  console.log('All regions processed.');

})();
