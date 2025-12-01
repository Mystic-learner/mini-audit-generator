// pages/index.js
import { useState, useEffect } from "react";

export default function Home() {
  const [content, setContent] = useState("");
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchVersions() {
    setError(null);
    try {
      const res = await fetch("/api/versions");
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Failed to fetch versions: ${res.status} ${body}`);
      }
      const data = await res.json();
      setVersions(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("fetchVersions error:", e);
      setError(e.message || "Failed to fetch versions");
      setVersions([]);
    }
  }

  useEffect(() => {
    fetchVersions();
  }, []);

  async function saveVersion() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/save-version", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content })
      });

      if (!res.ok) {
        // read response body to show server message
        const text = await res.text();
        throw new Error(`Save failed: ${res.status} ${text}`);
      }

      const newVer = await res.json();
      // guard shape: ensure newVer has id/timestamp
      if (newVer && newVer.id) {
        setVersions((v) => [newVer, ...v]);
      } else {
        // refresh from server in case server returns updated list
        fetchVersions();
      }
      setContent("");
    } catch (e) {
      console.error("saveVersion error:", e);
      setError(e.message || "Failed to save");
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
          height: 220,
          background: "#2b2b2b",
          borderRadius: 8,
          padding: 12,
          color: "#fff",
          fontSize: 15
        }}
      />

      <div style={{ marginTop: 14, display: "flex", gap: 12 }}>
        <button onClick={saveVersion} disabled={loading || !content.trim()}>
          {loading ? "Saving..." : "Save Version"}
        </button>
        <button onClick={() => setContent("")}>Clear</button>
        <button onClick={fetchVersions}>Refresh Versions</button>
      </div>

      <h2 style={{ marginTop: 36 }}>Version History</h2>

      {error && (
        <div style={{
          background: "#4d2020",
          color: "#fff",
          padding: 14,
          borderRadius: 8,
          marginBottom: 16
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {versions.length === 0 && !error && <p>No versions yet.</p>}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {versions.map((v) => {
          const idShort = v && v.id ? String(v.id).slice(0, 8) : "—";
          const ts = v && v.timestamp ? v.timestamp : "—";
          const oldLength = v && typeof v.oldLength === "number" ? v.oldLength : "—";
          const newLength = v && typeof v.newLength === "number" ? v.newLength : "—";
          const added = Array.isArray(v?.addedWords) ? v.addedWords : [];
          const removed = Array.isArray(v?.removedWords) ? v.removedWords : [];

          return (
            <li key={v.id || Math.random()} style={{
              background: "#141414",
              borderRadius: 10,
              padding: 18,
              marginBottom: 14
            }}>
              <strong>{ts}</strong>{" "}
              <span style={{ color: "#777" }}>({idShort})</span>

              <div style={{ marginTop: 10 }}>
                <div>Length: {oldLength} → {newLength}</div>
                <div><strong>Added:</strong> {added.length ? added.join(", ") : "—"}</div>
                <div><strong>Removed:</strong> {removed.length ? removed.join(", ") : "—"}</div>
              </div>

              <button
                style={{ marginTop: 10 }}
                onClick={() => setContent(v.content || "")}
              >
                Load
              </button>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
