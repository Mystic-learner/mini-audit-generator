import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "versions.json");

export function readStore() {
  try {
    if (!fs.existsSync(filePath)) return [];
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data || "[]");
  } catch (e) {
    console.error("readStore error", e);
    return [];
  }
}

export function writeStore(arr) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(arr, null, 2), "utf8");
  } catch (e) {
    console.error("writeStore error", e);
  }
}
