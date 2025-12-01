// pages/api/save-version.js
import fs from "fs";
import path from "path";
import os from "os";
import { v4 as uuidv4 } from "uuid";

const DATA_PATH = path.join(os.tmpdir(), "mini-audit-trail-versions.json");

function nowIso() {
  return new Date().toISOString();
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { content } = req.body || {};
    if (typeof content !== "string") {
      return res.status(400).json({ error: "content must be a string" });
    }

    // Ensure file exists
    try {
      if (!fs.existsSync(DATA_PATH)) {
        fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
        fs.writeFileSync(DATA_PATH, "[]", "utf8");
      }
    } catch (e) {
      console.error("Could not ensure DATA_PATH exists:", DATA_PATH, e.stack || e);
      return res.status(500).json({ error: "filesystem init failed", detail: String(e.message || e) });
    }

    // Read, parse, mutate, write
    const raw = fs.readFileSync(DATA_PATH, "utf8");
    let versions = [];
    try {
      versions = JSON.parse(raw || "[]");
    } catch (e) {
      console.error("JSON parse error reading versions file:", e.stack || e, "raw:", raw.slice(0, 200));
      versions = [];
    }

    const last = versions[0] || null;
    const oldContent = (last && last.content) || "";
    const oldWords = oldContent ? oldContent.split(/\s+/).filter(Boolean) : [];
    const newWords = content ? content.split(/\s+/).filter(Boolean) : [];

    const added = newWords.filter((w) => !oldWords.includes(w));
    const removed = oldWords.filter((w) => !newWords.includes(w));

    const ver = {
      id: uuidv4(),
      timestamp: nowIso(),
      content,
      oldLength: oldContent.length,
      newLength: content.length,
      addedWords: added,
      removedWords: removed,
    };

    versions.unshift(ver);

    try {
      fs.writeFileSync(DATA_PATH, JSON.stringify(versions, null, 2), "utf8");
    } catch (e) {
      console.error("Failed to write versions file:", DATA_PATH, e.stack || e);
      return res.status(500).json({ error: "failed to write", detail: String(e.message || e) });
    }

    return res.status(201).json(ver);
  } catch (err) {
    console.error("POST /api/save-version unexpected error:", err.stack || err);
    return res.status(500).json({ error: err.message || "failed to save" });
  }
}


