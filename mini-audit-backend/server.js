// mini-audit-backend/server.js
const express = require("express");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(express.json());

const DATA_FILE = path.join(__dirname, "versions.json");

function ensureDataFile() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, "[]", "utf8");
      console.log("Created versions.json");
    }
  } catch (err) {
    console.error("ensureDataFile error:", err);
    throw err;
  }
}

function readData() {
  try {
    ensureDataFile();
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    return JSON.parse(raw || "[]");
  } catch (err) {
    console.error("readData error:", err);
    throw err;
  }
}

function writeData(arr) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(arr, null, 2), "utf8");
    return true;
  } catch (err) {
    console.error("writeData error:", err);
    throw err;
  }
}

app.post("/api/save-version", (req, res) => {
  console.log("Received save-version request");
  try {
    if (!req.body) {
      console.warn("No body on request");
    }
    const { content = "" } = req.body || {};
    console.log("content length:", (content && content.length) || 0);

    // load existing
    const versions = readData();
    const last = versions[0] || null;
    const oldLength = last ? last.newLength : 0;
    const newLength = content.length;

    const v = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      content,
      oldLength,
      newLength,
      addedWords: [],
      removedWords: []
    };

    versions.unshift(v);

    // save
    writeData(versions);
    console.log("Saved new version id=", v.id);
    return res.json(v);
  } catch (err) {
    console.error("save-version handler error:", err);
    // return error details for debugging (remove in production)
    return res.status(500).json({ error: "failed to save", detail: String(err) });
  }
});

app.get("/api/versions", (req, res) => {
  console.log("GET /api/versions");
  try {
    const versions = readData();
    res.json(versions);
  } catch (err) {
    console.error("GET /api/versions error:", err);
    res.status(500).json({ error: "failed to read versions", detail: String(err) });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`mini-audit-backend listening on http://localhost:${port}`);
});
