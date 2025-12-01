// pages/api/versions.js
import fs from "fs";
import path from "path";

const FILE = path.resolve(process.cwd(), "versions.json");

async function readVersions() {
  try {
    const raw = await fs.promises.readFile(FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (e) {
    // if file does not exist or parse error -> return empty list
    return [];
  }
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const versions = await readVersions();
    // Return most recent first for convenience
    return res.status(200).json(versions);
  } catch (err) {
    console.error("versions read error:", err);
    return res.status(500).json({ error: "failed to read versions" });
  }
}
