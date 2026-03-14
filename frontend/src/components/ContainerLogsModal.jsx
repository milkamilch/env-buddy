import { useState, useEffect, useRef } from "react";
import { fetchContainerLogs } from "../services/api";
import "./ContainerLogsModal.css";

const TAIL_OPTIONS = [100, 200, 500, 1000];

export default function ContainerLogsModal({ containerId, containerName, isRunning, onClose }) {
  const [lines, setLines] = useState([]);
  const [tail, setTail] = useState(200);
  const [loading, setLoading] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const bottomRef = useRef(null);
  const bodyRef = useRef(null);

  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function load() {
    try {
      const data = await fetchContainerLogs(containerId, tail);
      setLines(data);
    } catch {
      // silently ignore fetch errors during polling
    } finally {
      setLoading(false);
    }
  }

  function openInNewTab() {
    const text = lines.join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  function downloadLogs() {
    const text = lines.join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${containerName}-logs.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    setLoading(true);
    load();
  }, [containerId, tail]);

  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(load, 3000);
    return () => clearInterval(id);
  }, [containerId, tail, isRunning]);

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [lines, autoScroll]);

  function handleScroll() {
    const el = bodyRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    setAutoScroll(atBottom);
  }

  return (
    <div className="logs-overlay" onClick={onClose}>
      <div className="logs-modal" onClick={(e) => e.stopPropagation()}>
        <div className="logs-header">
          <div className="logs-title">
            <span className="logs-icon">▤</span>
            <span className="logs-name">{containerName}</span>
            {isRunning && <span className="logs-live-badge">● LIVE</span>}
          </div>
          <div className="logs-controls">
            <span className="logs-tail-label">Zeilen:</span>
            {TAIL_OPTIONS.map((t) => (
              <button
                key={t}
                className={`logs-tail-btn ${tail === t ? "active" : ""}`}
                onClick={() => setTail(t)}
              >
                {t}
              </button>
            ))}
            <div className="logs-actions">
              <button className="logs-action-btn" onClick={openInNewTab} title="In neuem Tab öffnen" disabled={lines.length === 0}>↗</button>
              <button className="logs-action-btn" onClick={downloadLogs} title="Logs herunterladen" disabled={lines.length === 0}>⬇</button>
            </div>
            <button className="logs-close-btn" onClick={onClose} title="Schließen">✕</button>
          </div>
        </div>

        <div className="logs-body" ref={bodyRef} onScroll={handleScroll}>
          {loading ? (
            <span className="logs-hint">Lade Logs…</span>
          ) : lines.length === 0 ? (
            <span className="logs-hint">Keine Logs vorhanden.</span>
          ) : (
            lines.map((line, i) => (
              <div key={i} className="log-line">{line}</div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {!autoScroll && (
          <button className="logs-scroll-btn" onClick={() => {
            setAutoScroll(true);
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
          }}>
            ↓ nach unten
          </button>
        )}
      </div>
    </div>
  );
}
