import { useEffect, useState } from "react";

/**
 * Frontend for Mini Audit Trail Generator
 *
 * - If you want to point frontend to a remote backend (Render/Railway),
 *   set NEXT_PUBLIC_BACKEND_URL in Vercel/Environment variables, e.g.
 *   https://mini-audit-backend.onrender.com
 *
 * - Otherwise keep backend in /pages/api and leave NEXT_PUBLIC_BACKEND_URL empty.
 */

const BASE = (typeof window !== "undefined" && process.env.NEXT_PUBLIC_BACKEND_URL)
  ? process.env.NEXT_PUBLIC_BACKEND_URL.replace(/\/$/, "")
  : ""; // relative

export default function Home() {
  const [content, setContent] = useState("");
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const apiPath = (path) => {
    if (BASE) return `${BASE}${path}`;
    return path; // relative, e.g. /api/versions
  };

  async function fetchVersions() {
    setErrorMsg("");
    try {
      const res = await fetch(apiPath("/api/versions"));
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to fetch versions: ${res.status} ${text}`);
      }
      const data = await res.json();
      if (!Array.isArray(data)) {
        console.warn("versions response not array:", data);
        setVersions([]);
        return;
      }
      setVersions(data);
    } catch (e) {
      console.error("fetchVersions error", e);
      setErrorMsg(e.message || "Failed to fetch versions");
      setVersions([]);
    }
  }

  useEffect(() => {
    fetchVersions();
  }, []);

  async function saveVersion() {
    setErrorMsg("");
    setLoading(true);
    try {
      const res = await fetch(apiPath("/api/save-version"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content })
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Save failed: ${res.status} ${text}`);
      }
      const newVer = await res.json();
      // ensure shape is fine before inserting
      const safeVer = {
        id: newVer?.id ?? String(Date.now()),
        timestamp: newVer?.timestamp ?? new Date().toISOString(),
        content: newVer?.content ?? content,
        oldLength: typeof newVer?.oldLength === "number" ? newVer.oldLength : null,
        newLength: typeof newVer?.newLength === "number" ? newVer.newLength : (newVer?.content?.length ?? content.length),
        addedWords: Array.isArray(newVer?.addedWords) ? newVer.addedWords : [],
        removedWords: Array.isArray(newVer?.removedWords) ? newVer.removedWords : []
      };
      setVersions((prev) => [safeVer, ...prev]);
    } catch (e) {
      console.error("saveVersion error", e);
      setErrorMsg(e.message || "Save failed");
    } finally {
      setLoading(false);
    }
  }

  function loadVersion(ver) {
    setContent(ver?.content ?? "");
    // optionally scroll to editor or show toast
  }

  return (
    <main style={{ padding: 28, maxWidth: 1000, margin: "0 auto", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 28 }}>Mini Audit Trail Generator</h1>

      <label style={{ display: "block", marginBottom: 8 }}>Content Editor</label>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Type text and click Save Version"
        style={{
          width: "100%",
          height: 260,
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
            padding: "12px 20px",
            borderRadius: 10,
            border: "none",
            background: "#111",
            color: "#fff",
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "Saving..." : "Save Version"}
        </button>

        <button
          onClick={() => setContent("")}
          style={{
            padding: "12px 20px",
            borderRadius: 10,
            border: "none",
            background: "#1b1b1b",
            color: "#fff",
            cursor: "pointer"
          }}
        >
          Clear
        </button>

        <button
          onClick={fetchVersions}
          style={{
            padding: "12px 20px",
            borderRadius: 10,
            border: "none",
            background: "#1b1b1b",
            color: "#fff",
            cursor: "pointer"
          }}
        >
          Refresh Versions
        </button>
      </div>

      <h2 style={{ marginTop: 40 }}>Version History</h2>

      {errorMsg && (
        <div style={{ background: "#3b1a1a", color: "#fff", padding: 12, borderRadius: 8, marginBottom: 12 }}>
          <strong>Error:</strong> {errorMsg}
        </div>
      )}

      {versions.length === 0 && !errorMsg && <p>No versions yet.</p>}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {versions.map((v) => {
          const id = v?.id ?? "";
          const idShort = id ? (String(id).slice(0, 8)) : "—";
          const added = Array.isArray(v?.addedWords) ? v.addedWords.join(", ") || "—" : "—";
          const removed = Array.isArray(v?.removedWords) ? v.removedWords.join(", ") || "—" : "—";

          return (
            <li key={id || Math.random()} style={{
              background: "#141414",
              borderRadius: 10,
              padding: 18,
              marginBottom: 14
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong>{v?.timestamp ?? "—"}</strong>{" "}
                  <span style={{ color: "#777" }}>({idShort})</span>
                </div>

                <div>
                  <button
                    onClick={() => loadVersion(v)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "none",
                      background: "#222",
                      color: "#fff",
                      cursor: "pointer"
                    }}
                  >
                    Load
                  </button>
                </div>
              </div>

              <div style={{ marginTop: 10 }}>
                <div>Length: {v?.oldLength ?? "—"} → {v?.newLength ?? "—"}</div>
                <div><strong>Added:</strong> {added}</div>
                <div><strong>Removed:</strong> {removed}</div>
              </div>
            </li>
          );
        })}
      </ul>

      <div style={{ height: 40 }} />
    </main>
  );
}

