// pages/index.js
import { useEffect, useState } from "react";

export default function Home() {
  const [content, setContent] = useState("");
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [lastLoadedId, setLastLoadedId] = useState(null);

  // ---------------------------
  // FETCH VERSIONS
  // ---------------------------
  async function fetchVersions() {
    setErrorMsg(null);

    try {
      const res = await fetch("/api/versions", { method: "GET" });

      if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.status}`);
      }

      const data = await res.json();
      setVersions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("fetchVersions error", err);
      setErrorMsg(err.message);
    }
  }

  useEffect(() => {
    fetchVersions();
  }, []);

  // ---------------------------
  // SAVE VERSION
  // ---------------------------
  async function saveVersion() {
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/save-version", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });

      const body = await res.json();

      if (!res.ok) {
        throw new Error(body?.error || `Status ${res.status}`);
      }

      // prepend newest version
      setVersions((prev) => [body, ...prev]);
    } catch (err) {
      console.error("saveVersion failed", err);
      setErrorMsg(`Save failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  // ---------------------------
  // UI
  // ---------------------------
  return (
    <main
      style={{
        padding: 28,
        maxWidth: 1000,
        margin: "0 auto",
        color: "#fff",
      }}
    >
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
          fontSize: 15,
          boxSizing: "border-box",
        }}
      />

      <div style={{ marginTop: 14, display: "flex", gap: 12 }}>
        <button
          onClick={saveVersion}
          disabled={loading}
          style={{ padding: "12px 18px" }}
        >
          {loading ? "Saving..." : "Save Version"}
        </button>

        <button
          onClick={() => setContent("")}
          style={{ padding: "12px 18px" }}
        >
          Clear
        </button>

        <button
          onClick={fetchVersions}
          style={{ padding: "12px 18px" }}
        >
          Refresh Versions
        </button>
      </div>

      <h2 style={{ marginTop: 40 }}>Version History</h2>

      {errorMsg && (
        <div
          style={{
            background: "#4f1b1b",
            padding: 12,
            borderRadius: 8,
            marginBottom: 18,
          }}
        >
          <strong>Error:</strong> {errorMsg}
        </div>
      )}

      {versions.length === 0 && <p>No versions yet.</p>}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {versions.map((v) => (
          <li
            key={v.id}
            style={{
              background: "#141414",
              borderRadius: 10,
              padding: 18,
              marginBottom: 14,
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <strong>{v.timestamp ?? "—"}</strong>
              <span style={{ color: "#777" }}>
                ({(v.id ?? "—").toString().slice(0, 8)})
              </span>
            </div>

            <div style={{ marginTop: 10 }}>
              <div>
                Length: {v.oldLength ?? "—"} → {v.newLength ?? "—"}
              </div>
              <div>
                <strong>Added:</strong>{" "}
                {(Array.isArray(v.addedWords)
                  ? v.addedWords.join(", ")
                  : "—") || "—"}
              </div>
              <div>
                <strong>Removed:</strong>{" "}
                {(Array.isArray(v.removedWords)
                  ? v.removedWords.join(", ")
                  : "—") || "—"}
              </div>
            </div>

            <button
              style={{ marginTop: 10 }}
              onClick={() => {
                setContent(v.content ?? "");
                setLastLoadedId(v.id ?? null);
              }}
            >
              Load
            </button>

            {lastLoadedId === v.id && (
              <span style={{ marginLeft: 10, color: "#3b8" }}>Loaded</span>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}

