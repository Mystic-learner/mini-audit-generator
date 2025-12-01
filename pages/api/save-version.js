import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const DATA_PATH = path.join(process.cwd(), "data", "versions.json");

function nowIso() {
  return new Date().toISOString();
}

export default function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { content } = req.body || {};
    if (typeof content !== "string") {
      return res.status(400).json({ error: "content must be a string" });
    }

    if (!fs.existsSync(DATA_PATH)) {
      fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
      fs.writeFileSync(DATA_PATH, "[]", "utf8");
    }

    const raw = fs.readFileSync(DATA_PATH, "utf8");
    const versions = JSON.parse(raw || "[]");

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
    fs.writeFileSync(DATA_PATH, JSON.stringify(versions, null, 2), "utf8");

    return res.status(201).json(ver);
  } catch (err) {
    console.error("POST /api/save-version error:", err);
    return res.status(500).json({ error: "failed to save" });
  }
}
