import "./DashboardStats.css";

export default function DashboardStats({ containers, stacks, systemTotalRamMb, maxContainers = 0 }) {
  const allContainers = [
    ...containers,
    ...stacks.flatMap((s) => s.containers),
  ];

  const running = allContainers.filter((c) => c.status === "running");
  const stopped = allContainers.filter((c) => c.status !== "running");
  const activeStacks = stacks.filter((s) =>
    s.containers.some((c) => c.status === "running")
  );

  const totalRamMb = running.reduce((sum, c) => sum + (c.ram_mb || 0), 0);
  const totalCpu = running.reduce((sum, c) => sum + (c.cpu_percent || 0), 0);

  const ramDisplay =
    totalRamMb >= 1024
      ? `${(totalRamMb / 1024).toFixed(1)} GB`
      : `${Math.round(totalRamMb)} MB`;

  const ramPercent = systemTotalRamMb > 0
    ? Math.min((totalRamMb / systemTotalRamMb) * 100, 100)
    : 0;

  const cpuColor = totalCpu > 80 ? "#f38ba8" : totalCpu > 50 ? "#fab387" : "#a6e3a1";
  const ramColor = ramPercent > 80 ? "#f38ba8" : ramPercent > 50 ? "#fab387" : "#a6e3a1";

  // top 3 templates by usage
  const templateCounts = {};
  allContainers.forEach((c) => {
    templateCounts[c.template] = (templateCounts[c.template] || 0) + 1;
  });
  const topTemplates = Object.entries(templateCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  const maxCount = topTemplates[0]?.[1] || 1;

  return (
    <div className="dash-stats">
      {/* Status-Zahlen */}
      <div className="stat-card">
        <span className="stat-card-value stat-green">
          {running.length}{maxContainers > 0 ? ` / ${maxContainers}` : ""}
        </span>
        <span className="stat-card-label">Running</span>
      </div>
      <div className="stat-card">
        <span className="stat-card-value stat-red">{stopped.length}</span>
        <span className="stat-card-label">Stopped</span>
      </div>
      <div className="stat-card">
        <span className="stat-card-value stat-blue">{stacks.length}</span>
        <span className="stat-card-label">Stacks <span className="stat-card-sub">({activeStacks.length} aktiv)</span></span>
      </div>

      <div className="stat-divider" />

      {/* RAM mit Balken */}
      <div className="stat-card stat-card-bar">
        <div className="stat-bar-header">
          <span className="stat-card-label">RAM</span>
          <span className="stat-bar-value" style={{ color: ramColor }}>{ramDisplay}</span>
        </div>
        <div className="stat-progress-track">
          <div
            className="stat-progress-fill"
            style={{ width: `${ramPercent}%`, background: ramColor }}
          />
        </div>
        {systemTotalRamMb > 0 && (
          <span className="stat-bar-sub">
            {ramPercent.toFixed(1)}% von {Math.round(systemTotalRamMb / 1024)} GB
          </span>
        )}
      </div>

      {/* CPU mit Balken */}
      <div className="stat-card stat-card-bar">
        <div className="stat-bar-header">
          <span className="stat-card-label">CPU</span>
          <span className="stat-bar-value" style={{ color: cpuColor }}>{totalCpu.toFixed(1)}%</span>
        </div>
        <div className="stat-progress-track">
          <div
            className="stat-progress-fill"
            style={{ width: `${Math.min(totalCpu, 100)}%`, background: cpuColor }}
          />
        </div>
        <span className="stat-bar-sub">alle Container zusammen</span>
      </div>

      {/* Top Templates als Mini-Balken */}
      {topTemplates.length > 0 && (
        <>
          <div className="stat-divider" />
          <div className="stat-card stat-card-templates">
            <span className="stat-card-label stat-card-label-top">Top Templates</span>
            <div className="stat-template-bars">
              {topTemplates.map(([tpl, count]) => (
                <div key={tpl} className="stat-tpl-row">
                  <span className="stat-tpl-name">{tpl}</span>
                  <div className="stat-tpl-track">
                    <div
                      className="stat-tpl-fill"
                      style={{ width: `${(count / maxCount) * 100}%` }}
                    />
                  </div>
                  <span className="stat-tpl-count">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
