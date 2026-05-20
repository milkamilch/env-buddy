import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchSystemInfo, startStoppedContainer, stopContainer, removeContainer } from "../services/api";
import ContainerCard from "../components/ContainerCard";
import StackCard from "../components/StackCard";
import DashboardStats from "../components/DashboardStats";
import ImportContainerModal from "../components/ImportContainerModal";
import { useToast } from "../components/Toast";

const STATUS_FILTERS = ["alle", "running", "paused", "exited"];

export default function DashboardPage({
  containers, stacks, loading,
  onStarted, onStopped, onRemoved, onStackStopped,
  onOpenDrawer, onClone,
}) {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [activeTemplate, setActiveTemplate] = useState("alle");
  const [activeStatus, setActiveStatus] = useState("alle");
  const [viewMode, setViewMode] = useState("grid");
  const [systemTotalRamMb, setSystemTotalRamMb] = useState(0);
  const [maxContainers, setMaxContainers] = useState(0);
  const [startingAll, setStartingAll] = useState(false);
  const [selectMode, setSelectMode]   = useState(false);
  const [selected, setSelected]       = useState(new Set());
  const [bulkWorking, setBulkWorking] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  // #50: Decode shared config from URL ?start=base64
  useEffect(() => {
    const encoded = searchParams.get("start");
    if (!encoded) return;
    try {
      const config = JSON.parse(atob(encoded));
      onClone?.(config);
      setSearchParams({}, { replace: true });
    } catch {
      // ignore malformed share links
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchSystemInfo()
      .then((info) => {
        setSystemTotalRamMb(info.total_ram_mb);
        setMaxContainers(info.max_containers_per_user || 0);
      })
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

  function toggleSelectMode() {
    setSelectMode((m) => { if (m) setSelected(new Set()); return !m; });
  }

  function toggleSelect(id) {
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  async function handleBulkStop() {
    setBulkWorking(true);
    try {
      const ids = [...selected].filter((id) => {
        const c = containers.find((c) => c.id === id);
        return c && c.status === "running";
      });
      await Promise.all(ids.map(stopContainer));
      setSelected(new Set());
      onStopped();
      toast.success(`${ids.length} Container gestoppt`);
    } catch (err) { toast.error(err.message); }
    finally { setBulkWorking(false); }
  }

  async function handleBulkRemove() {
    const count = selected.size;
    setBulkWorking(true);
    try {
      await Promise.all([...selected].map(removeContainer));
      [...selected].forEach(onRemoved);
      setSelected(new Set());
      toast.success(`${count} Container gelöscht`);
    } catch (err) { toast.error(err.message); }
    finally { setBulkWorking(false); }
  }

  async function handleCleanupExited() {
    setBulkWorking(true);
    try {
      const exitedIds = containers
        .filter((c) => c.status === "exited" || c.status === "stopped")
        .map((c) => c.id);
      await Promise.all(exitedIds.map(removeContainer));
      exitedIds.forEach(onRemoved);
      setSelectMode(false);
      setSelected(new Set());
      toast.success(`${exitedIds.length} Container aufgeräumt`);
    } catch (err) { toast.error(err.message); }
    finally { setBulkWorking(false); }
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
    <div className="dashboard-page">
      <div className="content-header">
        <h2 className="content-title">Laufende Container</h2>
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
        <button className="btn-open-drawer" onClick={onOpenDrawer}>
          + Starten
        </button>
      </div>

      {!loading && (containers.length > 0 || stacks.length > 0) && (
        <DashboardStats containers={containers} stacks={stacks} systemTotalRamMb={systemTotalRamMb} maxContainers={maxContainers} />
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
          <button
            className="btn-start-all"
            onClick={() => setImportOpen(true)}
            title="Container aus JSON importieren"
            style={{ background: "var(--overlay1)" }}
          >
            ↑ Importieren
          </button>
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

        <button
          className={`btn-view-toggle ${selectMode ? "active" : ""}`}
          onClick={toggleSelectMode}
        >
          {selectMode ? "✕ Abbrechen" : "Auswählen"}
        </button>

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
          <EmptyIcon />
          <p className="empty-state-title">Noch keine Container</p>
          <p className="empty-state-sub">Klicke auf „+ Starten" um deinen ersten Container zu starten.</p>
        </div>
      ) : filtered.length === 0 && filteredStacks.length === 0 ? (
        <div className="empty-state">
          <EmptyIcon />
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
                  <ContainerCard key={c.id} container={c} onStopped={onStopped} onRemoved={onRemoved} viewMode={viewMode} selectMode={selectMode} isSelected={selected.has(c.id)} onToggleSelect={toggleSelect} onClone={onClone} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
      {selectMode && (
        <div className="bulk-bar">
          <span style={{ color: "var(--fg-subtext0)", fontSize: "13px", marginRight: "4px" }}>{selected.size} ausgewählt</span>
          <button className="btn-sm btn-destructive" disabled={bulkWorking || selected.size === 0} onClick={handleBulkStop}>⏹ Stoppen</button>
          <button className="btn-sm btn-destructive" disabled={bulkWorking || selected.size === 0} onClick={handleBulkRemove}>🗑 Löschen</button>
          <button className="btn-sm btn-default" disabled={bulkWorking} onClick={handleCleanupExited} style={{ marginLeft: "auto" }}>🧹 Exited aufräumen</button>
        </div>
      )}
      {importOpen && (
        <ImportContainerModal
          onImport={(config) => onClone?.(config)}
          onClose={() => setImportOpen(false)}
        />
      )}
    </div>
  );
}

function EmptyIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="empty-state-icon" style={{ color: "var(--fg-subtext0)" }}>
      <rect x="8" y="8" width="32" height="32" rx="4" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.4"/>
      <circle cx="24" cy="24" r="8" stroke="currentColor" strokeWidth="1.5" opacity="0.4"/>
    </svg>
  );
}
