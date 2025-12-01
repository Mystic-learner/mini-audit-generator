// pages/api/save-version.js
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

const FILE = path.resolve(process.cwd(), "versions.json");

async function readVersions() {
  try {
    const raw = await fs.promises.readFile(FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (e) {
    return [];
  }
}

async function writeVersions(arr) {
  const tmp = FILE + ".tmp";
  await fs.promises.writeFile(tmp, JSON.stringify(arr, null, 2), "utf8");
  await fs.promises.rename(tmp, FILE);
}

/** simple word split - trims and splits on whitespace */
function tokenize(text = "") {
  return String(text)
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  let payload;
  try {
    payload = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch (e) {
    payload = req.body;
  }

  const content = typeof payload?.content === "string" ? payload.content : "";

  try {
    const versions = await readVersions();
    const previous = versions.length > 0 ? versions[0] : { content: "" };
    const oldContent = typeof previous.content === "string" ? previous.content : "";

    const oldLength = oldContent.length;
    const newLength = content.length;

    const oldTokens = tokenize(oldContent);
    const newTokens = tokenize(content);

    // naive diff: words present in new but not in old are "added"
    // and words present in old but not new are "removed"
    const addedWords = newTokens.filter((w) => !oldTokens.includes(w));
    const removedWords = oldTokens.filter((w) => !newTokens.includes(w));

    const version = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      content,
      oldLength,
      newLength,
      addedWords,
      removedWords
    };

    // prepend newest first
    const updated = [version, ...versions];
    await writeVersions(updated);

    return res.status(201).json(version);
  } catch (err) {
    console.error("save-version error:", err);
    return res.status(500).json({ error: "failed to save" });
  }
}
