import { useState, useEffect, useRef } from "react";
import { fetchContainerLogs } from "../services/api";
import "./ContainerLogsModal.css";

const TAIL_OPTIONS = [100, 200, 500, 1000];
const WS_BASE = (import.meta.env.VITE_API_URL || "").replace(/^http/, "ws");

export default function ContainerLogsModal({ containerId, containerName, isRunning, onClose }) {
  const [lines, setLines] = useState([]);
  const [tail, setTail] = useState(200);
  const [loading, setLoading] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const bottomRef = useRef(null);
  const bodyRef = useRef(null);
  const wsRef = useRef(null);

  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Initial load via HTTP (works for stopped containers too)
  useEffect(() => {
    setLoading(true);
    setLines([]);
    fetchContainerLogs(containerId, tail)
      .then(setLines)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [containerId, tail]);

  // WebSocket streaming for running containers
  useEffect(() => {
    if (!isRunning) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    const ws = new WebSocket(`${WS_BASE}/api/containers/${containerId}/logs/stream?token=${encodeURIComponent(token)}`);
    wsRef.current = ws;

    ws.onopen = () => setWsConnected(true);

    ws.onmessage = (e) => {
      const line = e.data;
      setLines((prev) => {
        const next = [...prev, line];
        return next.length > 2000 ? next.slice(-2000) : next;
      });
    };

    ws.onclose = () => setWsConnected(false);
    ws.onerror = () => setWsConnected(false);

    return () => {
      ws.close();
      wsRef.current = null;
      setWsConnected(false);
    };
  }, [containerId, isRunning]);

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

  function openInNewTab() {
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  function downloadLogs() {
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${containerName}-logs.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="logs-overlay" onClick={onClose}>
      <div className="logs-modal" onClick={(e) => e.stopPropagation()}>
        <div className="logs-header">
          <div className="logs-title">
            <span className="logs-icon">▤</span>
            <span className="logs-name">{containerName}</span>
            {isRunning && (
              <span className={`logs-live-badge ${wsConnected ? "" : "logs-live-badge-polling"}`}>
                {wsConnected ? "● LIVE" : "● POLLING"}
              </span>
            )}
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
