(function () {
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
  let tweets = []; // [{id, text}]
  let currentIndex = 0;
  let selectedEmotion = null;
  const submitted = []; // {text, label}

  // ---- dataset stats on the welcome screen ----
  fetch("/api/stats")
    .then((r) => r.json())
    .then((stats) => {
      const el = document.getElementById("dataset-stats");
      const pills = Object.entries(stats.perEmotion)
        .map(([emotion, count]) => `<span class="stat-pill">${emotion}: ${count}</span>`)
        .join("");
      el.innerHTML = `<p style="margin-bottom:6px;"><strong>${stats.totalTweets}</strong> tweets available, across all six emotions:</p><p>${pills}</p>`;
    })
    .catch(() => {});

  // ---- start session ----
  document.getElementById("start-btn").addEventListener("click", async () => {
    const nameInput = document.getElementById("participant-name");
    const name = nameInput.value.trim();
    const errorEl = document.getElementById("welcome-error");

    if (!name) {
      errorEl.textContent = "Please enter your name or ID before starting.";
      errorEl.classList.remove("hidden");
      return;
    }
    errorEl.classList.add("hidden");

    const res = await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantName: name }),
    });
    const data = await res.json();

    participantId = data.participantId;
    participantName = data.participantName;
    tweets = data.tweets;
    currentIndex = 0;

    document.getElementById("participant-tag").textContent = participantName;
    showScreen("label");
    renderTweet();
  });

  // ---- labeling screen ----
  function renderTweet() {
    selectedEmotion = null;
    const tweet = tweets[currentIndex];
    document.getElementById("tweet-text").textContent = `"${tweet.text}"`;
    document.getElementById("progress-label").textContent = `Tweet ${currentIndex + 1} of ${tweets.length}`;
    document.getElementById("progress-fill").style.width = `${(currentIndex / tweets.length) * 100}%`;

    document.querySelectorAll(".emotion-btn").forEach((btn) => btn.classList.remove("selected"));
    document.getElementById("next-btn").disabled = true;
    document.getElementById("next-btn").textContent =
      currentIndex === tweets.length - 1 ? "Submit & finish" : "Submit & continue";
  }

  document.getElementById("emotion-grid").addEventListener("click", (e) => {
    const btn = e.target.closest(".emotion-btn");
    if (!btn) return;
    document.querySelectorAll(".emotion-btn").forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");
    selectedEmotion = btn.dataset.emotion;
    document.getElementById("next-btn").disabled = false;
  });

  document.getElementById("next-btn").addEventListener("click", async () => {
    if (!selectedEmotion) return;
    const tweet = tweets[currentIndex];
    const nextBtn = document.getElementById("next-btn");
    nextBtn.disabled = true;

    await fetch("/api/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        participantId,
        participantName,
        tweetId: tweet.id,
        label: selectedEmotion,
      }),
    });

    submitted.push({ text: tweet.text, label: selectedEmotion });

    currentIndex += 1;
    if (currentIndex >= tweets.length) {
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
})();
