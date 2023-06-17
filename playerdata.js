const puppeteer = require('puppeteer-extra');
const { Cluster } = require('puppeteer-cluster');
const fs = require('fs');

// Add adblocker plugin, which will transparently block ads in all pages you
// create using puppeteer.
const { DEFAULT_INTERCEPT_RESOLUTION_PRIORITY } = require('puppeteer');
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
puppeteer.use(
  AdblockerPlugin({
    // Optionally enable Cooperative Mode for several request interceptors
    interceptResolutionPriority: DEFAULT_INTERCEPT_RESOLUTION_PRIORITY,
  })
);

// Pfade zu den JSON-Dateien
const filePaths = [
  'playerlists/euw_playerlist.json',
  'playerlists/global_playerlist.json',
  'playerlists/kr_playerlist.json',
  'playerlists/na_playerlist.json',
];

// Funktion zum Durchgehen der Spielerliste einer Region
async function processPlayerList(playerList, isGlobal = false) {
  const browser = await puppeteer.launch({
    headless: 'new',
    // `headless: true` (default) enables old Headless;
    // `headless: 'new'` enables new Headless;
    // `headless: false` enables “headful” mode.
  });
  const page = await browser.newPage();

  for (const player of playerList) {
    const playerName = player.playerName;
    const region = player.regionCode; // Lesen der Region aus der JSON-Datei

    let playerFolderPath = `playerlists/${region}`;
    if (isGlobal) {
      playerFolderPath = 'playerlists/GLOBAL';
    }
    playerFolderPath = `${playerFolderPath}/${playerName}`;

    if (!fs.existsSync(playerFolderPath)) {
      fs.mkdirSync(playerFolderPath, { recursive: true });
    }

    const totalPages = 2;
    const gameData = [];

    for (let pageIdx = 1; pageIdx <= totalPages; pageIdx++) {
      const url = `https://lolchess.gg/profile/${region}/${playerName}/s9/matches/ranked/${pageIdx}`;
      await page.goto(url);
      const gameElements = await page.$$('.profile__match-history-v2__item');

      for (const gameElement of gameElements) {
        const placement = await gameElement.$eval('.placement', (el) => el.innerText.trim());
        const gameMode = await gameElement.$eval('.game-mode', (el) => el.innerText.trim());
        const length = await gameElement.$eval('.length', (el) => el.innerText.trim());
        const age = await gameElement.$eval('.age span', (el) => el.innerText.trim());

        const avatarLevel = await gameElement.$eval('.avatar .level', (el) => el.innerText.trim());

        const traitsElements = await gameElement.$$('.traits [data-original-title]');
        const traits = [];
        for (const traitElement of traitsElements) {
          const trait = await traitElement.evaluate((el) => el.getAttribute('data-original-title'));
          traits.push(trait);
        }

        await page.waitForSelector('.units .tft-champion');

        const unitElements = await gameElement.$$('.units .unit');
        const units = [];
        for (const unitElement of unitElements) {
          const unitName = await unitElement.$eval('.tft-champion img', (el) => el.getAttribute('alt'));

          await unitElement.click('.tft-champion');

          await page.waitForSelector('.unit .items img');

          const itemElements = await unitElement.$$('.items img');
          const items = [];
          for (const itemElement of itemElements) {
            const itemName = await itemElement.evaluate((el) => el.getAttribute('data-original-title'));
            items.push(itemName);
          }

          await unitElement.click('.tft-champion');

          const unitInfo = {
            unitName,
            items,
          };

          units.push(unitInfo);
        }

        const gameInfo = {
          placement,
          gameMode,
          length,
          age,
          avatarLevel,
          traits,
          units,
        };

        gameData.push(gameInfo);
      }
    }

    // Speichere die Spieldaten in einer Datei für den Spieler
    const playerFilePath = `${playerFolderPath}/${playerName}_spieldaten.json`;
    fs.writeFileSync(playerFilePath, JSON.stringify(gameData, null, 2));
  }

  await browser.close();
}

async function processJSONFiles() {
  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: 4, // Anzahl der parallelen Instanzen von Chromium-Browsern
  });

  await cluster.task(async ({ page, data: filePath }) => {
    try {
      const isGlobal = filePath.includes('global_playerlist.json');
      const playerList = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      await processPlayerList(playerList, isGlobal);
    } catch (error) {
      console.error(`Fehler beim Lesen der Datei ${filePath}:`, error);
    }
  });

  for (const filePath of filePaths) {
    await cluster.queue(filePath);
  }

  await cluster.idle();
  await cluster.close();
}

processJSONFiles();
