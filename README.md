# A1-2: Emotion Labeling Task

A web app for a human-annotation task: participants read 5 randomly selected tweets
and label the emotion each one expresses (anger, fear, joy, love, sadness, surprise),
using tweets drawn from the
[dair-ai/emotion](https://huggingface.co/datasets/dair-ai/emotion) dataset.

**Live task:** https://emotion-label-task.web.app
**Collected data (admin view):** https://emotion-label-task.web.app/admin.html

## Architecture

The app is entirely static and client-side, hosted on Firebase Hosting, with
[Cloud Firestore](https://firebase.google.com/docs/firestore) as the datastore:

- `public/index.html` + `app.js` — the participant-facing interface. On start, it
  samples 5 tweets client-side from the embedded dataset and writes one Firestore
  document per label to the `responses` collection.
- `public/admin.html` + `admin.js` — reads every document in `responses` and renders
  it as a table, with a CSV export button.
- `public/tweets-data.js` — the 120-tweet sample, embedded directly so the app needs
  no backend to serve it.
- `public/firebase-init.js` — Firebase project config (safe to be public — see the
  comment in that file) and SDK setup, imported as an ES module by `app.js`/`admin.js`.
- `firestore.rules` — anyone can create a well-formed response document and read the
  collection (there's no user auth for this class exercise), but no one can edit or
  delete a submitted response from the client.

There is no server: `server.js` only serves the same `public/` folder locally for
previewing changes before deploying (`npm start`) — it is not what's actually deployed.

## Structure

```
website/
├── firebase.json / .firebaserc     Firebase Hosting + Firestore deploy config
├── firestore.rules                 Security rules (see above)
├── firestore.indexes.json
├── server.js                       Local static-file preview server (see Architecture)
├── package.json
├── scripts/
│   ├── fetch_dataset.py            Pulled the tweet sample from the Hugging Face
│   │                               datasets-server API into data/tweets.json
│   └── test_participant.js         Playwright script used to test the deployed site
│                                   end-to-end as a participant (see screenshots/)
├── data/
│   └── tweets.json                 120 tweets (20 per emotion) sampled from
│                                   dair-ai/emotion — source of truth for tweets-data.js
├── public/
│   ├── index.html / app.js         Participant-facing labeling interface
│   ├── admin.html / admin.js       Read-only view of all collected responses + CSV export
│   ├── firebase-init.js            Firebase config + SDK setup
│   ├── tweets-data.js              Dataset embedded for the client (generated from
│   │                               data/tweets.json)
│   └── style.css
└── screenshots/                    Screenshots from testing the live deployed site
    ├── 01-welcome.png
    ├── 02-labeling.png
    ├── 03-done.png
    └── 04-admin-collected-data.png
```

## How the assignment requirements are met

- **Dataset (≥ 50 tweets, all 6 categories):** `data/tweets.json` (embedded for the
  client as `public/tweets-data.js`) has **120 tweets**, a balanced 20 per emotion,
  pulled live from the official dataset via the Hugging Face datasets-server API.
- **Instructions:** the welcome screen (`index.html`) explains the task, how many
  tweets to expect, and how to respond before the participant starts.
- **Random, per-participant subsets:** `app.js` samples 5 tweets without replacement
  from the 120-tweet pool independently for every participant in the browser, so
  different participants are not guaranteed (and in practice very unlikely) to see
  the same 5 tweets — see `screenshots/04-admin-collected-data.png`, where two test
  participants got 10 different tweets between them.
- **Recording who labeled what:** every submission is written to Firestore with
  `participantId`, `participantName`, `tweetId`, `tweetText`, `label`, the dataset's
  `groundTruthEmotion` (kept for later analysis, never shown to the participant), and
  a server timestamp. `admin.html` renders this live and can export it as CSV.

## Running / deploying

```bash
npm install
npm start                 # local static preview at http://localhost:3000

firebase login
firebase deploy           # deploys firestore.rules + public/ to Firebase Hosting
```

To regenerate the embedded dataset after changing `data/tweets.json`:

```bash
python3 -c "
import json
tweets = json.load(open('data/tweets.json'))
with open('public/tweets-data.js', 'w') as f:
    f.write('export const TWEETS = ')
    json.dump(tweets, f, indent=2)
    f.write(';\n')
"
```

## Bonus reflection

See [`reflection.md`](reflection.md) for a short essay on the ethics of using AI to
classify human emotion.
