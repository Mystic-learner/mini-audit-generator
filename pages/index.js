import { useState, useEffect } from "react";

export default function Home() {
  const [content, setContent] = useState("");
  const [versions, setVersions] = useState([]);
  const [loadingSave, setLoadingSave] = useState(false);
  const [loadingFetch, setLoadingFetch] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // fetch versions from API
  async function fetchVersions() {
    setError(null);
    setSuccessMsg(null);
    setLoadingFetch(true);
    try {
      const res = await fetch("/api/versions");
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`failed to fetch versions: ${res.status} ${body}`);
      }
      const data = await res.json();
      setVersions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("fetchVersions error:", err);
      setError("Failed to fetch versions. See console for details.");
    } finally {
      setLoadingFetch(false);
    }
  }

  useEffect(() => {
    fetchVersions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // save current content as a new version
  async function saveVersion() {
    setError(null);
    setSuccessMsg(null);

    // basic validation
    if (typeof content !== "string") {
      setError("Content must be text.");
      return;
    }

    setLoadingSave(true);
    try {
      const res = await fetch("/api/save-version", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      const body = await res.json().catch(() => null);

      if (!res.ok) {
        console.error("saveVersion failed:", res.status, body);
        setError(
          body && body.error ? `Save failed: ${body.error}` : "Save failed"
        );
        return;
      }

      // prepend returned version if present, otherwise refetch
      if (body && body.id) {
        setVersions((prev) => [body, ...prev]);
        setSuccessMsg("Saved version successfully.");
      } else {
        // fallback: refresh list from server
        await fetchVersions();
        setSuccessMsg("Saved version (fetched updated list).");
      }
    } catch (err) {
      console.error("saveVersion error:", err);
      setError("Save failed — check console for details.");
    } finally {
      setLoadingSave(false);
      // clear transient success message after a few seconds
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  }

  // helper to safely show id prefix
  function idPrefix(v) {
    try {
      return v && v.id ? String(v.id).slice(0, 8) : "--------";
    } catch {
      return "--------";
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
          height: 260,
          background: "#2b2b2b",
          borderRadius: 8,
          padding: 12,
          color: "#fff",
          fontSize: 15,
          border: "1px solid #444",
          boxSizing: "border-box",
        }}
      />

      <div style={{ marginTop: 14, display: "flex", gap: 12 }}>
        <button
          onClick={saveVersion}
          disabled={loadingSave}
          style={{
            padding: "12px 18px",
            borderRadius: 12,
            border: "1px solid #333",
            background: "#111",
            color: "#fff",
            cursor: loadingSave ? "not-allowed" : "pointer",
          }}
        >
          {loadingSave ? "Saving..." : "Save Version"}
        </button>

        <button
          onClick={() => setContent("")}
          style={{
            padding: "12px 18px",
            borderRadius: 12,
            border: "1px solid #333",
            background: "#111",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Clear
        </button>

        <button
          onClick={fetchVersions}
          disabled={loadingFetch}
          style={{
            padding: "12px 18px",
            borderRadius: 12,
            border: "1px solid #333",
            background: "#111",
            color: "#fff",
            cursor: loadingFetch ? "not-allowed" : "pointer",
          }}
        >
          {loadingFetch ? "Refreshing..." : "Refresh Versions"}
        </button>
      </div>

      <div style={{ height: 18 }} />

      {error && (
        <div
          style={{
            background: "#4b1f1f",
            color: "#fff",
            padding: 12,
            borderRadius: 8,
            marginTop: 10,
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {successMsg && (
        <div
          style={{
            background: "#163b16",
            color: "#cfeecd",
            padding: 12,
            borderRadius: 8,
            marginTop: 10,
          }}
        >
          {successMsg}
        </div>
      )}

      <h2 style={{ marginTop: 28 }}>Version History</h2>

      {loadingFetch && <p>Loading versions...</p>}
      {!loadingFetch && versions.length === 0 && <p>No versions yet.</p>}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {versions.map((v) => (
          <li
            key={v && v.id ? v.id : Math.random()}
            style={{
              background: "#141414",
              borderRadius: 10,
              padding: 18,
              marginBottom: 14,
              border: "1px solid #222",
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <strong style={{ fontSize: 14 }}>
                {v && v.timestamp ? v.timestamp : "unknown time"}
              </strong>
              <span style={{ color: "#777" }}>({idPrefix(v)})</span>
            </div>

            <div style={{ marginTop: 10 }}>
              <div>
                <strong>Length:</strong>{" "}
                {(v && v.oldLength != null ? v.oldLength : "—")} →{" "}
                {(v && v.newLength != null ? v.newLength : "—")}
              </div>

              <div style={{ marginTop: 6 }}>
                <strong>Added:</strong>{" "}
                {Array.isArray(v && v.addedWords) && v.addedWords.length
                  ? v.addedWords.join(", ")
                  : "—"}
              </div>

              <div style={{ marginTop: 6 }}>
                <strong>Removed:</strong>{" "}
                {Array.isArray(v && v.removedWords) && v.removedWords.length
                  ? v.removedWords.join(", ")
                  : "—"}
              </div>
            </div>

            <div style={{ marginTop: 10 }}>
              <button
                onClick={() => setContent(v && v.content ? v.content : "")}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: "1px solid #333",
                  background: "#0d0d0d",
                  color: "#fff",
                }}
              >
                Load
              </button>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
