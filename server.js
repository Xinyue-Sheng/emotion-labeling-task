// Local preview server for the static, Firebase-backed labeling app.
//
// The deployed version runs entirely client-side (see public/app.js and
// public/admin.js, which talk directly to Firestore) and is served by
// Firebase Hosting (`firebase deploy`). This file just serves the same
// public/ folder locally so you can preview it with `npm start` before
// deploying, without needing the Firebase CLI's own emulator.
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

app.listen(PORT, () => {
  console.log(`Local preview running at http://localhost:${PORT}`);
});
