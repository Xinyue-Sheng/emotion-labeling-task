import json, time, urllib.request

LABELS = ["sadness", "joy", "love", "anger", "fear", "surprise"]
TARGET_PER_LABEL = 20  # 20 * 6 = 120 tweets pool
OUT = "data/tweets.json"

buckets = {l: [] for l in LABELS}
offset = 0
length = 100
seen_texts = set()

def enough():
    return all(len(buckets[l]) >= TARGET_PER_LABEL for l in LABELS)

while not enough() and offset < 16000:
    url = f"https://datasets-server.huggingface.co/rows?dataset=dair-ai%2Femotion&config=split&split=train&offset={offset}&length={length}"
    with urllib.request.urlopen(url, timeout=20) as resp:
        data = json.load(resp)
    rows = data.get("rows", [])
    if not rows:
        break
    for r in rows:
        text = r["row"]["text"].strip()
        label_idx = r["row"]["label"]
        label = LABELS[label_idx]
        if text in seen_texts:
            continue
        if len(buckets[label]) < TARGET_PER_LABEL:
            buckets[label].append(text)
            seen_texts.add(text)
    offset += length
    time.sleep(0.05)

tweets = []
tid = 1
for label in LABELS:
    for text in buckets[label]:
        tweets.append({"id": tid, "text": text, "emotion": label})
        tid += 1

print("Counts:", {l: len(buckets[l]) for l in LABELS})
print("Total tweets:", len(tweets))

with open(OUT, "w", encoding="utf-8") as f:
    json.dump(tweets, f, ensure_ascii=False, indent=2)
