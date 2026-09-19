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

  await page.goto("https://emotion-label-task.web.app/");
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
    // Wait for the Firestore write to resolve and the UI to actually move on
    // (either the next tweet's text loads, or we reach the done screen) --
    // a fixed short timeout isn't reliable over a real network round trip.
    // Note: page.textContent() already returns the rendered text (including
    // the quote marks the app wraps around it), so compare directly instead
    // of re-wrapping it in another layer of quotes.
    await page.waitForFunction(
      (prevText) => {
        const done = document.getElementById("screen-done");
        if (done && !done.classList.contains("hidden")) return true;
        const el = document.getElementById("tweet-text");
        return el && el.textContent !== prevText;
      },
      tweetText,
      { timeout: 15000 }
    );
  }

  await page.waitForSelector("#screen-done:not(.hidden)");
  await page.screenshot({ path: `${dir}/03-done.png`, fullPage: true });

  await page.goto("https://emotion-label-task.web.app/admin.html");
  await page.waitForFunction(
    () => !document.getElementById("rows").textContent.includes("Loading"),
    { timeout: 20000 }
  );
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${dir}/04-admin-collected-data.png`, fullPage: true });

  await browser.close();
  console.log("Screenshots saved to", dir);
})();
