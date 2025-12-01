@"
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

const DATA_FILE = path.join(process.cwd(), 'versions.json');
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]', 'utf8');

function readStore() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch (e) { return []; }
}
function writeStore(arr) { fs.writeFileSync(DATA_FILE, JSON.stringify(arr, null, 2), 'utf8'); }

app.get('/', (req, res) => res.send('Mini Audit Backend running'));
app.get('/healthz', (req, res) => res.json({ ok: true }));
app.get('/versions', (req, res) => {
  const store = readStore();
  // return newest first
  res.json(store.slice().reverse());
});

app.post('/save-version', (req, res) => {
  const { content } = req.body || {};
  if (typeof content !== 'string') return res.status(400).json({ error: 'content (string) required' });

  const store = readStore();
  const previous = store.length ? store[store.length - 1].content : '';
  const oldLength = previous.length;
  const newLength = content.length;

  // simple word frequency diff
  const tokenize = (t) => (String(t).match(/\w+/g) || []).map(w => w.toLowerCase());
  const freq = (arr) => arr.reduce((m, w) => { m[w] = (m[w] || 0) + 1; return m; }, {});
  const oldMap = freq(tokenize(previous));
  const newMap = freq(tokenize(content));

  const added = [];
  const removed = [];
  for (const w in newMap) if (newMap[w] > (oldMap[w] || 0)) added.push(w);
  for (const w in oldMap) if (oldMap[w] > (newMap[w] || 0)) removed.push(w);

  const entry = {
    id: uuidv4(),
    timestamp: new Date().toISOString().slice(0,16).replace('T',' '),
    addedWords: added,
    removedWords: removed,
    oldLength,
    newLength,
    content
  };

  store.push(entry);
  writeStore(store);
  res.status(201).json(entry);
});

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => console.log(`Backend listening on http://localhost:${PORT}`));
"@ | Out-File -FilePath server.js -Encoding utf8
