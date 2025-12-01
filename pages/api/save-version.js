// pages/api/save-version.js
import fs from "fs";
import path from "path";

const FILE = path.join(process.cwd(), "versions.json");

function readVersions() {
  try {
    if (!fs.existsSync(FILE)) return [];
    const s = fs.readFileSync(FILE, "utf8");
    return s ? JSON.parse(s) : [];
  } catch (e) {
    return [];
  }
}

function writeVersions(arr) {
  fs.writeFileSync(FILE, JSON.stringify(arr, null, 2), "utf8");
}

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { content } = req.body || {};
  if (typeof content !== "string") {
    return res.status(400).json({ error: "content (string) is required" });
  }

  const versions = readVersions();

  // create a safe unique id if uuid package not installed
  const id = Date.now().toString(36) + "-" + Math.floor(Math.random() * 10000);

  const newVersion = {
    id,
    content,
    length: content.length,
    timestamp: new Date().toISOString()
  };

  versions.unshift(newVersion);
  writeVersions(versions);

  return res.status(200).json({ ok: true, version: newVersion });
}

