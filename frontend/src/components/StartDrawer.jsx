import { useEffect } from "react";
import { X } from "lucide-react";
import StartForm from "./StartForm";

export default function StartDrawer({ open, onClose, templates, onStarted, prefill, onPrefillConsumed }) {
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="drawer-scrim" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="Neue Umgebung starten">
        <div className="drawer-header">
          <span className="drawer-title">Container starten</span>
          <button className="drawer-close" onClick={onClose} aria-label="Drawer schließen">
            <X size={16} />
          </button>
        </div>
        <div className="drawer-body">
          {templates.length > 0 && (
            <StartForm
              templates={templates}
              onStarted={() => { onStarted(); onClose(); }}
              prefill={prefill}
              onPrefillConsumed={onPrefillConsumed}
            />
          )}
        </div>
      </aside>
    </>
  );
}
