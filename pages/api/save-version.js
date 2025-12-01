import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const filePath = path.join(process.cwd(), "data.json");

function loadData() {
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function saveData(data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const versions = loadData();
  const { content } = req.body;

  const newVersion = {
    id: uuidv4(),
    content,
    timestamp: new Date().toISOString(),
  };

  versions.push(newVersion);
  saveData(versions);

  return res.status(200).json({ message: "Saved", version: newVersion });
}
