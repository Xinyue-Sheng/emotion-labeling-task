// Drives the real UI in a headless browser to simulate one participant
// (Xinyue Sheng) working through the task end-to-end, then screenshots the
// admin view of the collected data. Emotion choices are made with a simple
// keyword heuristic over the displayed tweet text, so they read as
// plausible human judgments rather than random clicks.
const { chromium } = require("playwright");

const KEYWORDS = {
  anger: ["hate", "angry", "annoyed", "furious", "mad", "irritat", "pissed", "rage", "bitter"],
  fear: ["afraid", "scared", "anxious", "nervous", "terrified", "worr", "unpleasant", "threat", "danger", "fright"],
  joy: ["happy", "joy", "glad", "excited", "great", "wonderful", "delight", "proud", "impressed"],
  love: ["love", "adore", "cherish", "affection"],
  sadness: ["sad", "lonely", "depress", "heartbroken", "miserable", "cry", "hopeless", "grief", "defeated", "burdened"],
  surprise: ["surpris", "shocked", "amazed", "unexpected", "wow", "astonish", "curious"],
};

function pickEmotion(text) {
  const lower = text.toLowerCase();
  for (const [emotion, words] of Object.entries(KEYWORDS)) {
    // \b...\w* matches the keyword stem as a whole word start, avoiding
    // false positives like "mad" inside "handmade".
    if (words.some((w) => new RegExp(`\\b${w}\\w*`).test(lower))) return emotion;
  }
  // no obvious keyword match -> fall back to a fixed default
  return "joy";
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 900, height: 1000 } });
  const dir = process.env.SCREENSHOT_DIR;

  await page.goto("http://localhost:3000/");
  await page.waitForSelector("#dataset-stats .stat-pill");
  await page.fill("#participant-name", "Xinyue Sheng");
  await page.screenshot({ path: `${dir}/01-welcome.png`, fullPage: true });
  await page.click("#start-btn");

  for (let i = 0; i < 5; i++) {
    await page.waitForSelector("#screen-label:not(.hidden)");
    const tweetText = await page.textContent("#tweet-text");
    const choice = pickEmotion(tweetText);
    await page.click(`.emotion-btn[data-emotion="${choice}"]`);
    if (i === 0) {
      await page.waitForTimeout(200);
      await page.screenshot({ path: `${dir}/02-labeling.png`, fullPage: true });
    }
    await page.click("#next-btn");
    await page.waitForTimeout(200);
  }

  await page.waitForSelector("#screen-done:not(.hidden)");
  await page.screenshot({ path: `${dir}/03-done.png`, fullPage: true });

  await page.goto("http://localhost:3000/admin.html");
  await page.waitForSelector("#rows tr");
  await page.screenshot({ path: `${dir}/04-admin-collected-data.png`, fullPage: true });

  await browser.close();
  console.log("Screenshots saved to", dir);
})();
