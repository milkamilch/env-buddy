import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

const WS_BASE = (import.meta.env.VITE_API_URL || "").replace(/^http/, "ws");

export default function ContainerTerminalModal({ containerId, containerName, onClose }) {
  const containerRef = useRef(null);
  const termRef = useRef(null);
  const wsRef = useRef(null);

  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: "monospace",
      theme: { background: "#1e1e2e", foreground: "#cdd6f4", cursor: "#f5e0dc" },
    });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(containerRef.current);
    fitAddon.fit();
    termRef.current = term;

    const token = localStorage.getItem("token");
    const ws = new WebSocket(`${WS_BASE}/api/containers/${containerId}/terminal?token=${encodeURIComponent(token)}`);
    wsRef.current = ws;
    ws.binaryType = "arraybuffer";

    ws.onopen = () => term.write("\r\n\x1b[32mVerbunden mit " + containerName + "\x1b[0m\r\n");
    ws.onmessage = (e) => {
      if (e.data instanceof ArrayBuffer) {
        term.write(new Uint8Array(e.data));
      } else {
        term.write(e.data);
      }
    };
    ws.onclose = () => term.write("\r\n\x1b[31m[Verbindung getrennt]\x1b[0m\r\n");
    ws.onerror = () => term.write("\r\n\x1b[31m[Verbindungsfehler]\x1b[0m\r\n");

    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(new TextEncoder().encode(data));
      }
    });

    const observer = new ResizeObserver(() => fitAddon.fit());
    if (containerRef.current) observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      ws.close();
      term.dispose();
    };
  }, [containerId, containerName]);

  return (
    <div className="logs-overlay" onClick={onClose}>
      <div
        className="logs-modal"
        style={{ maxWidth: "70rem", height: "36rem", display: "flex", flexDirection: "column" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="logs-header">
          <div className="logs-title">
            <span className="logs-icon">$</span>
            <span className="logs-name">{containerName}</span>
            <span className="logs-live-badge">● TERMINAL</span>
          </div>
          <div className="logs-controls">
            <button className="logs-close-btn" onClick={onClose} title="Schließen">✕</button>
          </div>
        </div>
        <div ref={containerRef} style={{ flex: 1, padding: "0.5rem", background: "#1e1e2e" }} />
      </div>
    </div>
  );
}
