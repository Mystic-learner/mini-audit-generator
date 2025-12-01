import { readStore, writeStore } from "../../lib/storage";
import { v4 as uuidv4 } from "uuid";

export default function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { content } = req.body;

  const store = readStore();
  const previous = store.length ? store[store.length - 1].content : "";

  const tokenize = (t) => (String(t).match(/\w+/g) || []);
  const oldWords = tokenize(previous);
  const newWords = tokenize(content);

  const oldFreq = {};
  oldWords.forEach((w) => (oldFreq[w] = (oldFreq[w] || 0) + 1));

  const newFreq = {};
  newWords.forEach((w) => (newFreq[w] = (newFreq[w] || 0) + 1));

  const added = [];
  const removed = [];

  for (const w in newFreq) {
    if (newFreq[w] > (oldFreq[w] || 0)) added.push(w);
  }

  for (const w in oldFreq) {
    if (oldFreq[w] > (newFreq[w] || 0)) removed.push(w);
  }

  const entry = {
    id: uuidv4(),
    timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
    addedWords: added,
    removedWords: removed,
    oldLength: previous.length,
    newLength: content.length,
    content,
  };

  store.push(entry);
  writeStore(store);

  res.status(201).json(entry);
}
