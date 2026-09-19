(function () {
  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  async function load() {
    const res = await fetch("/api/responses");
    const data = await res.json();

    const uniqueParticipants = new Set(data.map((r) => r.participantId));
    const matches = data.filter((r) => r.label === r.groundTruthEmotion).length;
    const accuracy = data.length ? ((matches / data.length) * 100).toFixed(1) : "0.0";

    document.getElementById("summary").innerHTML = `
      <p>
        <span class="stat-pill">${data.length} labels submitted</span>
        <span class="stat-pill">${uniqueParticipants.size} participant(s)</span>
        <span class="stat-pill">${accuracy}% match dataset ground truth</span>
      </p>`;

    const rows = document.getElementById("rows");
    rows.innerHTML = data
      .slice()
      .reverse()
      .map(
        (r, i) => `
      <tr>
        <td>${data.length - i}</td>
        <td>${escapeHtml(r.participantName)}</td>
        <td><code style="font-size:0.75rem;">${r.participantId.slice(0, 8)}…</code></td>
        <td>${escapeHtml(r.tweetText)}</td>
        <td><span class="tag" data-emotion="${r.label}">${r.label}</span></td>
        <td><span class="tag" data-emotion="${r.groundTruthEmotion}">${r.groundTruthEmotion}</span></td>
        <td>${new Date(r.timestamp).toLocaleString()}</td>
      </tr>`
      )
      .join("");
  }

  document.getElementById("refresh-btn").addEventListener("click", load);
  load();
})();
