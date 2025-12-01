import { useState, useEffect, useRef } from "react";

export default function Home() {
  const [content, setContent] = useState("");
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastLoadedId, setLastLoadedId] = useState(null);

  async function fetchVersions() {
    try {
      const res = await fetch("/api/versions");
      const data = await res.json();
      setVersions(data);
    } catch (e) {
      console.error("fetch versions failed", e);
    }
  }

  useEffect(() => {
    fetchVersions();
  }, []);

  async function saveVersion() {
    setLoading(true);
    try {
      const res = await fetch("/api/save-version", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content })
      });
      const newVer = await res.json();
      setVersions((v) => [newVer, ...v]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 28, maxWidth: 1000, margin: "0 auto", color: "#fff" }}>

      <h1>Mini Audit Trail Generator</h1>

      <label>Content Editor</label>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Type text and click Save Version"
        style={{
          width: "100%",
          height: 180,
          background: "#2b2b2b",
          borderRadius: 8,
          padding: 12,
          color: "#fff",
          fontSize: 15
        }}
      />

      <div style={{ marginTop: 14, display: "flex", gap: 12 }}>
        <button onClick={saveVersion}>Save Version</button>
        <button onClick={() => setContent("")}>Clear</button>
      </div>

      <h2 style={{ marginTop: 40 }}>Version History</h2>

      {versions.length === 0 && <p>No versions yet.</p>}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {versions.map((v) => (
          <li key={v.id} style={{
            background: "#141414",
            borderRadius: 10,
            padding: 18,
            marginBottom: 14
          }}>
            <strong>{v.timestamp}</strong>{" "}
            <span style={{ color: "#777" }}>({v.id.slice(0, 8)})</span>

            <div style={{ marginTop: 10 }}>
              <div>Length: {v.oldLength} → {v.newLength}</div>
              <div><strong>Added:</strong> {v.addedWords.join(", ") || "—"}</div>
              <div><strong>Removed:</strong> {v.removedWords.join(", ") || "—"}</div>
            </div>

            <button
              style={{ marginTop: 10 }}
              onClick={() => setContent(v.content)}
            >
              Load
            </button>
          </li>
        ))}
      </ul>

    </main>
  );
}
