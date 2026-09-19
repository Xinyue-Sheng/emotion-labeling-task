import { db } from "./firebase-init.js";
import { TWEETS } from "./tweets-data.js";
import {
  collection,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const screens = {
  welcome: document.getElementById("screen-welcome"),
  label: document.getElementById("screen-label"),
  done: document.getElementById("screen-done"),
};

function showScreen(name) {
  Object.values(screens).forEach((el) => el.classList.add("hidden"));
  screens[name].classList.remove("hidden");
}

// ---- state ----
let participantId = null;
let participantName = null;
let assignedTweets = []; // [{id, text}]
let currentIndex = 0;
let selectedEmotion = null;
let isSubmitting = false; // guards against double submits (e.g. clicking a new
                           // emotion while the previous submission is still saving)
const submitted = []; // {text, label}

// ---- dataset stats on the welcome screen ----
(function renderStats() {
  const perEmotion = {};
  for (const t of TWEETS) {
    perEmotion[t.emotion] = (perEmotion[t.emotion] || 0) + 1;
  }
  const pills = Object.entries(perEmotion)
    .map(([emotion, count]) => `<span class="stat-pill">${emotion}: ${count}</span>`)
    .join("");
  document.getElementById("dataset-stats").innerHTML =
    `<p style="margin-bottom:6px;"><strong>${TWEETS.length}</strong> tweets available, across all six emotions:</p><p>${pills}</p>`;
})();

function sample(arr, n) {
  const copy = [...arr];
  const out = [];
  for (let i = 0; i < n && copy.length > 0; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

// ---- start session ----
document.getElementById("start-btn").addEventListener("click", () => {
  const nameInput = document.getElementById("participant-name");
  const name = nameInput.value.trim();
  const errorEl = document.getElementById("welcome-error");

  if (!name) {
    errorEl.textContent = "Please enter your name or ID before starting.";
    errorEl.classList.remove("hidden");
    return;
  }
  errorEl.classList.add("hidden");

  participantId = crypto.randomUUID();
  participantName = name;
  assignedTweets = sample(TWEETS, 5).map((t) => ({ id: t.id, text: t.text, emotion: t.emotion }));
  currentIndex = 0;

  document.getElementById("participant-tag").textContent = participantName;
  showScreen("label");
  renderTweet();
});

// ---- labeling screen ----
function renderTweet() {
  selectedEmotion = null;
  const tweet = assignedTweets[currentIndex];
  document.getElementById("tweet-text").textContent = `"${tweet.text}"`;
  document.getElementById("progress-label").textContent = `Tweet ${currentIndex + 1} of ${assignedTweets.length}`;
  document.getElementById("progress-fill").style.width = `${(currentIndex / assignedTweets.length) * 100}%`;

  document.querySelectorAll(".emotion-btn").forEach((btn) => btn.classList.remove("selected"));
  document.getElementById("next-btn").disabled = true;
  document.getElementById("next-btn").textContent =
    currentIndex === assignedTweets.length - 1 ? "Submit & finish" : "Submit & continue";
}

document.getElementById("emotion-grid").addEventListener("click", (e) => {
  if (isSubmitting) return; // ignore re-selection while a submission is in flight
  const btn = e.target.closest(".emotion-btn");
  if (!btn) return;
  document.querySelectorAll(".emotion-btn").forEach((b) => b.classList.remove("selected"));
  btn.classList.add("selected");
  selectedEmotion = btn.dataset.emotion;
  document.getElementById("next-btn").disabled = false;
});

document.getElementById("next-btn").addEventListener("click", async () => {
  if (!selectedEmotion || isSubmitting) return;
  isSubmitting = true;
  const tweet = assignedTweets[currentIndex];
  const nextBtn = document.getElementById("next-btn");
  nextBtn.disabled = true;

  try {
    await addDoc(collection(db, "responses"), {
      participantId,
      participantName,
      tweetId: tweet.id,
      tweetText: tweet.text,
      label: selectedEmotion,
      groundTruthEmotion: tweet.emotion, // kept for later analysis, never shown to the participant
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.error("Failed to save response:", err);
    alert("Sorry, we couldn't save that response. Please check your connection and try again.");
    nextBtn.disabled = false;
    isSubmitting = false;
    return;
  }

  submitted.push({ text: tweet.text, label: selectedEmotion });

  currentIndex += 1;
  isSubmitting = false;
  if (currentIndex >= assignedTweets.length) {
    document.getElementById("progress-fill").style.width = "100%";
    finish();
  } else {
    renderTweet();
  }
});

// ---- done screen ----
function finish() {
  const body = document.getElementById("summary-body");
  body.innerHTML = submitted
    .map(
      (s, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${escapeHtml(s.text)}</td>
        <td><span class="tag" data-emotion="${s.label}">${s.label}</span></td>
      </tr>`
    )
    .join("");
  document.getElementById("done-participant-id").textContent = participantId;
  showScreen("done");
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
