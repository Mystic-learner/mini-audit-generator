import fs from "fs";
import path from "path";

const DATA_PATH = path.join(process.cwd(), "data", "versions.json");

export default async function handler(req, res) {
  try {
    if (!fs.existsSync(DATA_PATH)) {
      // ensure file exists
      fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
      fs.writeFileSync(DATA_PATH, "[]", "utf8");
    }
    const raw = fs.readFileSync(DATA_PATH, "utf8");
    const data = JSON.parse(raw || "[]");
    res.status(200).json(data);
  } catch (err) {
    console.error("GET /api/versions error:", err);
    res.status(500).json({ error: "failed to read versions" });
  }
}

