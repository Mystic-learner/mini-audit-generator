import fs from "fs";
import path from "path";

const DATA_PATH = path.join(process.cwd(), "data", "versions.json");

export default function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    if (!fs.existsSync(DATA_PATH)) {
      fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
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
