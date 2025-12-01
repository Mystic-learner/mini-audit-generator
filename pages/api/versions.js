// pages/api/versions.js
import fs from "fs";
import path from "path";
import os from "os";

const DATA_PATH = path.join(os.tmpdir(), "mini-audit-trail-versions.json");

export default function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    if (!fs.existsSync(DATA_PATH)) {
      fs.writeFileSync(DATA_PATH, "[]", "utf8");
    }
    const raw = fs.readFileSync(DATA_PATH, "utf8");
    const data = JSON.parse(raw || "[]");
    return res.status(200).json(data);
  } catch (err) {
    console.error("GET /api/versions error:", err);
    return res.status(500).json({ error: "failed to read versions" });
  }
}

