# A1-2: Emotion Labeling Task

A small full-stack web app for a human-annotation task: participants read 5 randomly
selected tweets and label the emotion each one expresses (anger, fear, joy, love,
sadness, surprise), using tweets drawn from the
[dair-ai/emotion](https://huggingface.co/datasets/dair-ai/emotion) dataset.

## Structure

```
website/
├── server.js              Express server: serves the UI, assigns random tweets,
│                           records submissions
├── package.json
├── scripts/
│   └── fetch_dataset.py    One-off script that pulled the tweet sample from the
│                           Hugging Face datasets-server API
├── data/
│   ├── tweets.json          120 tweets (20 per emotion) sampled from dair-ai/emotion
│   └── responses.json       Collected labels (participant, tweet, label, timestamp) —
│                             created/updated at runtime
├── public/
│   ├── index.html / app.js  Participant-facing labeling interface
│   ├── admin.html / admin.js  Read-only view of all collected responses + CSV export
│   └── style.css
└── screenshots/
    └── collected-data.png   Screenshot of the admin view after a test run
```

## How the assignment requirements are met

- **Dataset (≥ 50 tweets, all 6 categories):** `data/tweets.json` has **120 tweets**,
  a balanced 20 per emotion, pulled live from the official dataset via the Hugging
  Face datasets-server API (`scripts/fetch_dataset.py`).
- **Instructions:** the welcome screen (`index.html`) explains the task, how many
  tweets to expect, and how to respond before the participant starts.
- **Random, per-participant subsets:** `POST /api/session` samples 5 tweets without
  replacement from the 120-tweet pool independently for every participant, so
  different participants are very unlikely to see the same 5 tweets (and are not
  guaranteed to, by design).
- **Recording who labeled what:** every submission (`POST /api/responses`) is appended
  to `data/responses.json` with `participantId`, `participantName`, `tweetId`,
  `tweetText`, `label`, the dataset's `groundTruthEmotion` (kept for later analysis,
  never shown to the participant), and a timestamp. `admin.html` renders this table
  live and can export it as CSV.

## Running it

```bash
npm install
npm start
# open http://localhost:3000            (participant view)
# open http://localhost:3000/admin.html (collected data / CSV export)
```

## Bonus reflection

See [`reflection.md`](reflection.md) for a short essay on the ethics of using AI to
classify human emotion.
