import { createContext, useContext, useState, useCallback, useMemo } from "react";
import { X } from "lucide-react";
import "./Toast.css";

const ToastContext = createContext(null);

let _id = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useMemo(() => {
    const fn = (message, type = "error", opts = {}) => {
      const id = ++_id;
      setToasts((prev) => [...prev.slice(-2), { id, message, type, action: opts.action }]);
      const delay = opts.persistent ? null : (type === "success" ? 4000 : type === "warning" ? 5000 : 6000);
      if (delay) setTimeout(() => dismiss(id), delay);
    };
    fn.error   = (msg, opts) => fn(msg, "error",   opts);
    fn.success = (msg, opts) => fn(msg, "success",  opts);
    fn.warning = (msg, opts) => fn(msg, "warning",  opts);
    fn.info    = (msg, opts) => fn(msg, "info",     opts);
    return fn;
  }, [dismiss]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast toast-${t.type}`}
          >
            <span className={`toast-strip toast-strip-${t.type}`} />
            <div className="toast-body">
              <span className="toast-msg">{t.message}</span>
              {t.action && (
                <button className="toast-action" onClick={() => { t.action.fn(); dismiss(t.id); }}>
                  {t.action.label}
                </button>
              )}
            </div>
            <button className="toast-close" onClick={() => dismiss(t.id)} aria-label="Toast schließen">
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  return useContext(ToastContext);
}
