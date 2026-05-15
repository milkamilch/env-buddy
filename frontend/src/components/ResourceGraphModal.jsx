import { useState, useEffect, useRef } from "react";
import { fetchStatsHistory } from "../services/api";
import "./ResourceGraphModal.css";

function Sparkline({ data, color, height = 60, yMax }) {
  if (!data || data.length < 2) {
    return (
      <svg width="100%" height={height} className="sparkline">
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
          fill="var(--overlay1)" fontSize="11">Noch keine Daten</text>
      </svg>
    );
  }

  const max = yMax ?? Math.max(...data, 1);
  const w = 400;
  const pad = 4;
  const innerW = w - pad * 2;
  const innerH = height - pad * 2;

  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * innerW;
    const y = pad + innerH - (v / max) * innerH;
    return `${x},${y}`;
  });

  const areaPath = `M ${pts[0]} L ${pts.join(" L ")} L ${pad + innerW},${pad + innerH} L ${pad},${pad + innerH} Z`;
  const linePath = `M ${pts.join(" L ")}`;

  return (
    <svg viewBox={`0 0 ${w} ${height}`} width="100%" height={height} className="sparkline" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#grad-${color.replace("#", "")})`} />
      <path d={linePath} stroke={color} strokeWidth="1.5" fill="none" strokeLinejoin="round" />
      {/* Last value dot */}
      <circle
        cx={pad + innerW}
        cy={parseFloat(pts[pts.length - 1].split(",")[1])}
        r="3"
        fill={color}
      />
    </svg>
  );
}

export default function ResourceGraphModal({ containerId, containerName, onClose }) {
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function load() {
    try {
      const data = await fetchStatsHistory(containerId);
      setHistory(data.history || []);
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    intervalRef.current = setInterval(load, 15000);
    return () => clearInterval(intervalRef.current);
  }, [containerId]); // eslint-disable-line react-hooks/exhaustive-deps

  const cpuData    = history.map((p) => p.cpu);
  const ramData    = history.map((p) => p.ram_percent);
  const ramMbData  = history.map((p) => p.ram_mb);

  const lastCpu    = cpuData.at(-1) ?? null;
  const lastRamPct = ramData.at(-1) ?? null;
  const lastRamMb  = ramMbData.at(-1) ?? null;

  function formatTime(ts) {
    const d = new Date(ts * 1000);
    return d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }

  const timeRange = history.length >= 2
    ? `${formatTime(history[0].ts)} – ${formatTime(history.at(-1).ts)}`
    : null;

  return (
    <div className="rg-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="rg-modal">
        <div className="rg-header">
          <span className="rg-title">📊 Ressourcen — {containerName}</span>
          <button className="rg-close" onClick={onClose}>✕</button>
        </div>

        <div className="rg-body">
          {error ? (
            <p className="rg-error">{error}</p>
          ) : (
            <>
              <div className="rg-meta">
                <span className="rg-meta-count">{history.length} Messpunkte (alle 15 s)</span>
                {timeRange && <span className="rg-meta-range">{timeRange}</span>}
              </div>

              <div className="rg-charts">
                <div className="rg-chart-block">
                  <div className="rg-chart-header">
                    <span className="rg-chart-label">CPU</span>
                    {lastCpu !== null && (
                      <span className="rg-chart-value" style={{ color: "var(--blue)" }}>
                        {lastCpu.toFixed(1)} %
                      </span>
                    )}
                  </div>
                  <Sparkline data={cpuData} color="var(--blue)" yMax={100} height={72} />
                  <div className="rg-chart-axis"><span>0 %</span><span>100 %</span></div>
                </div>

                <div className="rg-chart-block">
                  <div className="rg-chart-header">
                    <span className="rg-chart-label">RAM</span>
                    {lastRamMb !== null && (
                      <span className="rg-chart-value" style={{ color: "var(--green)" }}>
                        {lastRamMb.toFixed(0)} MB ({lastRamPct?.toFixed(1)} %)
                      </span>
                    )}
                  </div>
                  <Sparkline data={ramData} color="var(--green)" yMax={100} height={72} />
                  <div className="rg-chart-axis"><span>0 %</span><span>100 %</span></div>
                </div>
              </div>

              {history.length === 0 && (
                <p className="rg-hint">Der Container läuft, aber es wurden noch keine Daten gesammelt. Die erste Messung erfolgt nach ca. 15 Sekunden.</p>
              )}
            </>
          )}
        </div>

        <div className="rg-footer">
          <button className="rg-btn-close" onClick={onClose}>Schließen</button>
        </div>
      </div>
    </div>
  );
}
