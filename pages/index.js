import { useState, useEffect } from "react";

export default function Home() {
  const [content, setContent] = useState("");
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState(null);

  async function fetchVersions() {
    setFetching(true);
    setError(null);
    try {
      const res = await fetch("/api/versions");
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Failed to fetch versions: ${res.status} ${txt}`);
      }
      const data = await res.json();
      // Ensure it's an array
      setVersions(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("fetch versions failed", e);
      setError(String(e));
      setVersions([]);
    } finally {
      setFetching(false);
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
        const txt = await res.text();
        throw new Error(`Save failed: ${res.status} ${txt}`);
      }

      const newVer = await res.json();
      // prepend the new version if it's an object
      setVersions((prev) => (newVer ? [newVer, ...prev] : prev));
      // optional: clear editor after save
      // setContent("");
    } catch (e) {
      console.error("save failed", e);
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 28, maxWidth: 1000, margin: "0 auto", color: "#fff" }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Mini Audit Trail Generator</h1>

      <label style={{ display: "block", marginBottom: 8 }}>Content Editor</label>
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
          fontSize: 15,
          border: "1px solid #333",
          boxSizing: "border-box",
          resize: "vertical"
        }}
      />

      <div style={{ marginTop: 14, display: "flex", gap: 12 }}>
        <button
          onClick={saveVersion}
          disabled={loading}
          style={{
            background: "#111",
            color: "#fff",
            padding: "10px 16px",
            borderRadius: 8,
            border: "1px solid #333",
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "Saving…" : "Save Version"}
        </button>

        <button
          onClick={() => setContent("")}
          style={{
            background: "#111",
            color: "#fff",
            padding: "10px 16px",
            borderRadius: 8,
            border: "1px solid #333",
            cursor: "pointer"
          }}
        >
          Clear
        </button>

        <button
          onClick={fetchVersions}
          disabled={fetching}
          title="Reload versions from server"
          style={{
            background: "#111",
            color: "#fff",
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #333",
            cursor: fetching ? "not-allowed" : "pointer"
          }}
        >
          {fetching ? "Refreshing…" : "Refresh Versions"}
        </button>
      </div>

      <h2 style={{ marginTop: 40 }}>Version History</h2>

      {error && (
        <div style={{ color: "#ffb4b4", background: "#2a1a1a", padding: 10, borderRadius: 8 }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {fetching && versions.length === 0 && <p>Loading versions…</p>}

      {versions.length === 0 && !fetching && !error && <p>No versions yet.</p>}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {versions.map((vRaw) => {
          const v = vRaw || {};
          const id = typeof v.id === "string" ? v.id : "";
          const shortId = id ? id.slice(0, 8) : "--------";
          const added = Array.isArray(v.addedWords) ? v.addedWords.join(", ") : "—";
          const removed = Array.isArray(v.removedWords) ? v.removedWords.join(", ") : "—";
          const oldLength = typeof v.oldLength === "number" ? v.oldLength : "—";
          const newLength = typeof v.newLength === "number" ? v.newLength : "—";
          const timestamp = v.timestamp || (id ? id : "—");

          return (
            <li
              key={id || Math.random().toString(36).slice(2, 9)}
              style={{
                background: "#141414",
                borderRadius: 10,
                padding: 18,
                marginBottom: 14
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ fontSize: 14 }}>{timestamp}</strong>
                <span style={{ color: "#777", fontSize: 13 }}>{`(${shortId})`}</span>
              </div>

              <div style={{ marginTop: 10, lineHeight: 1.4 }}>
                <div>Length: {oldLength} → {newLength}</div>
                <div><strong>Added:</strong> {added}</div>
                <div><strong>Removed:</strong> {removed}</div>
              </div>

              <div style={{ marginTop: 10 }}>
                <button
                  style={{
                    background: "#111",
                    color: "#fff",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid #333",
                    cursor: "pointer"
                  }}
                  onClick={() => setContent(v.content || "")}
                >
                  Load
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
