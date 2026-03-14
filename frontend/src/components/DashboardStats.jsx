import "./DashboardStats.css";

export default function DashboardStats({ containers, stacks }) {
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

  // top 3 templates by usage
  const templateCounts = {};
  allContainers.forEach((c) => {
    templateCounts[c.template] = (templateCounts[c.template] || 0) + 1;
  });
  const topTemplates = Object.entries(templateCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <div className="dash-stats">
      <div className="stat-card">
        <span className="stat-card-value stat-green">{running.length}</span>
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

      <div className="stat-card">
        <span className="stat-card-value">{ramDisplay}</span>
        <span className="stat-card-label">RAM gesamt</span>
      </div>
      <div className="stat-card">
        <span className="stat-card-value">{totalCpu.toFixed(1)}%</span>
        <span className="stat-card-label">CPU gesamt</span>
      </div>

      {topTemplates.length > 0 && (
        <>
          <div className="stat-divider" />
          <div className="stat-card stat-card-templates">
            <span className="stat-card-label stat-card-label-top">Top Templates</span>
            <div className="stat-template-list">
              {topTemplates.map(([tpl, count]) => (
                <span key={tpl} className="stat-template-chip">
                  {tpl} <span className="stat-template-count">{count}</span>
                </span>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
