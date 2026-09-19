// A1-2: Emotion labeling task web server
//
// Serves the static labeling interface (public/), hands out 5 randomly
// selected tweets per participant, and records every (participant, tweet,
// label) submission to data/responses.json.

const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

const TWEETS_PATH = path.join(__dirname, "data", "tweets.json");
const RESPONSES_PATH = path.join(__dirname, "data", "responses.json");
const VALID_LABELS = ["anger", "fear", "joy", "love", "sadness", "surprise"];
const TWEETS_PER_PARTICIPANT = 5;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ---------- helpers ----------

function loadTweets() {
  return JSON.parse(fs.readFileSync(TWEETS_PATH, "utf-8"));
}

function loadResponses() {
  try {
    return JSON.parse(fs.readFileSync(RESPONSES_PATH, "utf-8"));
  } catch {
    return [];
  }
}

function saveResponses(responses) {
  fs.writeFileSync(RESPONSES_PATH, JSON.stringify(responses, null, 2));
}

function sample(arr, n) {
  const copy = [...arr];
  const out = [];
  for (let i = 0; i < n && copy.length > 0; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

function csvEscape(value) {
  const s = String(value ?? "");
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

// ---------- API ----------

// Start (or resume) a labeling session: assigns 5 random tweets.
app.post("/api/session", (req, res) => {
  const { participantId, participantName } = req.body || {};
  const tweets = loadTweets();
  const id = participantId || crypto.randomUUID();
  const name = (participantName || "").trim() || "Anonymous";

  const assigned = sample(tweets, TWEETS_PER_PARTICIPANT).map((t) => ({
    id: t.id,
    text: t.text,
  })); // ground-truth emotion is intentionally withheld from the participant

  res.json({ participantId: id, participantName: name, tweets: assigned });
});

// Record one label submission.
app.post("/api/responses", (req, res) => {
  const { participantId, participantName, tweetId, label } = req.body || {};

  if (!participantId || !tweetId || !label) {
    return res.status(400).json({ error: "participantId, tweetId, and label are required" });
  }
  if (!VALID_LABELS.includes(label)) {
    return res.status(400).json({ error: `label must be one of: ${VALID_LABELS.join(", ")}` });
  }

  const tweets = loadTweets();
  const tweet = tweets.find((t) => t.id === tweetId);
  if (!tweet) {
    return res.status(404).json({ error: "unknown tweetId" });
  }

  const responses = loadResponses();
  const record = {
    responseId: crypto.randomUUID(),
    participantId,
    participantName: (participantName || "").trim() || "Anonymous",
    tweetId: tweet.id,
    tweetText: tweet.text,
    label,
    groundTruthEmotion: tweet.emotion, // kept for later accuracy analysis, not shown to participant
    timestamp: new Date().toISOString(),
  };
  responses.push(record);
  saveResponses(responses);

  res.status(201).json({ ok: true, record });
});

// All collected responses (used by the admin/results view).
app.get("/api/responses", (req, res) => {
  res.json(loadResponses());
});

// CSV export of all collected responses.
app.get("/api/responses.csv", (req, res) => {
  const responses = loadResponses();
  const cols = [
    "responseId",
    "participantId",
    "participantName",
    "tweetId",
    "tweetText",
    "label",
    "groundTruthEmotion",
    "timestamp",
  ];
  const lines = [cols.join(",")];
  for (const r of responses) {
    lines.push(cols.map((c) => csvEscape(r[c])).join(","));
  }
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=responses.csv");
  res.send(lines.join("\n"));
});

// Basic dataset stats (used on the instructions page).
app.get("/api/stats", (req, res) => {
  const tweets = loadTweets();
  const perEmotion = {};
  for (const t of tweets) {
    perEmotion[t.emotion] = (perEmotion[t.emotion] || 0) + 1;
  }
  res.json({ totalTweets: tweets.length, perEmotion });
});

app.listen(PORT, () => {
  console.log(`Emotion labeling task running at http://localhost:${PORT}`);
});
