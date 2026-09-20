import { db } from "./firebase-init.js";
import {
  collection,
  getDocs,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function csvEscape(value) {
  const s = String(value ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

let currentData = [];

async function load() {
  const rowsEl = document.getElementById("rows");
  rowsEl.innerHTML = `<tr><td colspan="6">Loading…</td></tr>`;

  const snap = await getDocs(query(collection(db, "responses"), orderBy("timestamp", "desc")));
  currentData = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const uniqueParticipants = new Set(currentData.map((r) => r.participantId));

  document.getElementById("summary").innerHTML = `
    <p>
      <span class="stat-pill">${currentData.length} labels submitted</span>
      <span class="stat-pill">${uniqueParticipants.size} participant(s)</span>
    </p>`;

  rowsEl.innerHTML = currentData
    .map(
      (r, i) => `
      <tr>
        <td>${currentData.length - i}</td>
        <td>${escapeHtml(r.participantName)}</td>
        <td><code style="font-size:0.75rem;">${(r.participantId || "").slice(0, 8)}…</code></td>
        <td>${escapeHtml(r.tweetText)}</td>
        <td><span class="tag" data-emotion="${r.label}">${r.label}</span></td>
        <td>${r.timestamp && r.timestamp.toDate ? r.timestamp.toDate().toLocaleString() : ""}</td>
      </tr>`
    )
    .join("");
}

function downloadCsv() {
  const cols = [
    "participantId",
    "participantName",
    "tweetId",
    "tweetText",
    "label",
    "groundTruthEmotion",
    "timestamp",
  ];
  const lines = [cols.join(",")];
  for (const r of currentData) {
    const row = { ...r, timestamp: r.timestamp && r.timestamp.toDate ? r.timestamp.toDate().toISOString() : "" };
    lines.push(cols.map((c) => csvEscape(row[c])).join(","));
  }
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "responses.csv";
  a.click();
  URL.revokeObjectURL(url);
}

document.getElementById("refresh-btn").addEventListener("click", load);
document.getElementById("csv-btn").addEventListener("click", downloadCsv);
load();
