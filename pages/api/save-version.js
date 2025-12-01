// pages/api/save-version.js
import fs from "fs";
import path from "path";

const FILE = path.join(process.cwd(), "versions.json");

// read versions.json (safe)
function readVersions() {
  try {
    if (!fs.existsSync(FILE)) return [];
    const raw = fs.readFileSync(FILE, "utf8");
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error("readVersions error:", err);
    return [];
  }
}

// write versions.json (safe)
function writeVersions(arr) {
  try {
    fs.writeFileSync(FILE, JSON.stringify(arr, null, 2), "utf8");
  } catch (err) {
    console.error("writeVersions error:", err);
    throw err;
  }
}

// generate a short unique-ish id
function genId() {
  return Date.now().toString(36) + "-" + Math.floor(Math.random() * 10000);
}

// simple word-diff: returns arrays of added and removed words (not perfect, but fine for audit)
function computeWordDiff(oldText = "", newText = "") {
  // split on whitespace, remove empty tokens
  const oldW = oldText ? oldText.split(/\s+/).filter(Boolean) : [];
  const newW = newText ? newText.split(/\s+/).filter(Boolean) : [];

  // quick frequency maps
  const freq = (arr) => {
    const m = new Map();
    for (const w of arr) m.set(w, (m.get(w) || 0) + 1);
    return m;
  };

  const oldMap = freq(oldW);
  const newMap = freq(newW);

  const added = [];
  const removed = [];

  // words in new that have higher count than in old => added
  for (const [w, count] of newMap.entries()) {
    const oldCount = oldMap.get(w) || 0;
    if (count > oldCount) {
      for (let i = 0; i < count - oldCount; i++) added.push(w);
    }
  }

  // words in old that have higher count than in new => removed
  for (const [w, count] of oldMap.entries()) {
    const newCount = newMap.get(w) || 0;
    if (count > newCount) {
      for (let i = 0; i < count - newCount; i++) removed.push(w);
    }
  }

  // dedupe a little while preserving some order (optional)
  const uniq = (arr) => Array.from(new Set(arr));
  return { addedWords: uniq(added), removedWords: uniq(removed) };
}

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { content } = req.body || {};
  if (typeof content !== "string") {
    return res.status(400).json({ error: "content (string) is required" });
  }

  // read existing versions
  const versions = readVersions();

  // previous content (most recent) to compute diff
  const prev = versions.length ? versions[0].content || "" : "";

  // compute diff & lengths
  const oldLength = prev.length;
  const newLength = content.length;
  const { addedWords, removedWords } = computeWordDiff(prev, content);

  const id = genId();
  const timestamp = new Date().toISOString();

  const newVersion = {
    id,
    content,
    timestamp,
    oldLength,
    newLength,
    addedWords,
    removedWords
  };

  // prepend and write
  const out = [newVersion, ...versions];
  try {
    writeVersions(out);
  } catch (err) {
    console.error("Failed to save version:", err);
    return res.status(500).json({ error: "failed to save" });
  }

  // return saved object (frontend expects either object or {ok,version})
  return res.status(200).json({ ok: true, version: newVersion });
}
