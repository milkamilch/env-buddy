import { useState, useMemo, useEffect } from "react";
import { fetchSystemInfo, startStoppedContainer } from "../services/api";
import StartForm from "../components/StartForm";
import ContainerCard from "../components/ContainerCard";
import StackCard from "../components/StackCard";
import DashboardStats from "../components/DashboardStats";
import { useToast } from "../components/Toast";

const STATUS_FILTERS = ["alle", "running", "paused", "exited"];

export default function DashboardPage({
  containers,
  stacks,
  loading,
  startFormTemplates,
  onStarted,
  onStopped,
  onRemoved,
  onStackStopped,
}) {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [activeTemplate, setActiveTemplate] = useState("alle");
  const [activeStatus, setActiveStatus] = useState("alle");
  const [viewMode, setViewMode] = useState("grid");
  const [systemTotalRamMb, setSystemTotalRamMb] = useState(0);
  const [startingAll, setStartingAll] = useState(false);

  useEffect(() => {
    fetchSystemInfo()
      .then((info) => setSystemTotalRamMb(info.total_ram_mb))
      .catch(() => {});
  }, []);

  const stoppedContainers = containers.filter((c) => c.status !== "running");

  async function handleStartAll() {
    setStartingAll(true);
    try {
      await Promise.all(stoppedContainers.map((c) => startStoppedContainer(c.id)));
      onStopped();
      toast.success(`${stoppedContainers.length} Container gestartet`);
    } catch (err) {
      toast.error("Fehler beim Starten: " + err.message);
    } finally {
      setStartingAll(false);
    }
  }

  const templateFilterOptions = [
    "alle",
    ...new Set([
      ...containers.map((c) => c.template),
      ...stacks.flatMap((s) => s.containers.map((c) => c.template)),
    ]),
  ];

  const filtered = useMemo(() => {
    return containers.filter((c) => {
      const matchSearch   = c.name.toLowerCase().includes(search.toLowerCase());
      const matchTemplate = activeTemplate === "alle" || c.template === activeTemplate;
      const matchStatus   = activeStatus   === "alle" || c.status   === activeStatus;
      return matchSearch && matchTemplate && matchStatus;
    });
  }, [containers, search, activeTemplate, activeStatus]);

  const filteredStacks = useMemo(() => {
    return stacks.filter((s) => {
      const q = search.toLowerCase();
      const matchSearch   = !q
        || s.stack_name.toLowerCase().includes(q)
        || s.containers.some((c) => c.name.toLowerCase().includes(q) || c.template.toLowerCase().includes(q));
      const matchTemplate = activeTemplate === "alle"
        || s.containers.some((c) => c.template === activeTemplate);
      const matchStatus   = activeStatus === "alle"
        || s.containers.some((c) => c.status === activeStatus);
      return matchSearch && matchTemplate && matchStatus;
    });
  }, [stacks, search, activeTemplate, activeStatus]);

  return (
    <main className="app-main">
      <aside className="app-sidebar">
        {startFormTemplates.length > 0 && (
          <StartForm templates={startFormTemplates} onStarted={onStarted} />
        )}
      </aside>

      <section className="app-content">
        <div className="content-header">
          <h2>Laufende Container</h2>
          <span className="container-count">
            {filtered.length + filteredStacks.length} / {containers.length + stacks.length}
          </span>
          {stoppedContainers.length > 0 && (
            <button
              className="btn-start-all"
              onClick={handleStartAll}
              disabled={startingAll}
              title="Alle gestoppten Container starten"
            >
              {startingAll ? "…" : `▶ Alle starten (${stoppedContainers.length})`}
            </button>
          )}
        </div>

        {!loading && (containers.length > 0 || stacks.length > 0) && (
          <DashboardStats containers={containers} stacks={stacks} systemTotalRamMb={systemTotalRamMb} />
        )}

        <div className="toolbar">
          <div className="search-wrapper">
            <span className="search-icon">🔍</span>
            <input
              className="search-input"
              type="text"
              placeholder="Container suchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="search-clear" onClick={() => setSearch("")}>✕</button>
            )}
          </div>

          <div className="filter-group">
            <span className="filter-label">Template:</span>
            {templateFilterOptions.map((t) => (
              <button
                key={t}
                className={`filter-btn ${activeTemplate === t ? "active" : ""}`}
                onClick={() => setActiveTemplate(t)}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="filter-group">
            <span className="filter-label">Status:</span>
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                className={`filter-btn filter-status-${s} ${activeStatus === s ? "active" : ""}`}
                onClick={() => setActiveStatus(s)}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="view-toggle">
            <button className={`view-btn ${viewMode === "grid" ? "active" : ""}`} onClick={() => setViewMode("grid")} title="Kachelansicht">⊞</button>
            <button className={`view-btn ${viewMode === "list" ? "active" : ""}`} onClick={() => setViewMode("list")} title="Listenansicht">☰</button>
          </div>
        </div>

        {loading ? (
          <div className="loading-spinner-wrap">
            <span className="loading-spinner" />
          </div>
        ) : containers.length === 0 && stacks.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">🧪</span>
            <p className="empty-state-title">Noch keine Container</p>
            <p className="empty-state-sub">Wähle links ein Template und starte deinen ersten Container.</p>
          </div>
        ) : filtered.length === 0 && filteredStacks.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">🔍</span>
            <p className="empty-state-title">Keine Treffer</p>
            <p className="empty-state-sub">Kein Container passt zu den aktiven Filtern.</p>
          </div>
        ) : (
          <>
            {filteredStacks.length > 0 && (
              <div className="section-block">
                <div className="section-label">Stacks <span className="section-count">{filteredStacks.length}</span></div>
                <div className={`container-grid ${viewMode === "list" ? "grid-list" : ""}`}>
                  {filteredStacks.map((s) => (
                    <StackCard key={s.stack_id} stack={s} onStopped={onStackStopped} viewMode={viewMode} />
                  ))}
                </div>
              </div>
            )}

            {filteredStacks.length > 0 && filtered.length > 0 && (
              <hr className="section-divider" />
            )}

            {filtered.length > 0 && (
              <div className="section-block">
                <div className="section-label">Container <span className="section-count">{filtered.length}</span></div>
                <div className={`container-grid ${viewMode === "list" ? "grid-list" : ""}`}>
                  {filtered.map((c) => (
                    <ContainerCard key={c.id} container={c} onStopped={onStopped} onRemoved={onRemoved} viewMode={viewMode} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
