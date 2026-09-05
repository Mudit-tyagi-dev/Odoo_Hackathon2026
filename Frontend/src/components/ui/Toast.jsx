import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ type = "info", title, message, duration = 4500 }) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    const newToast = { id, type, title, message };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (message, title = "Success") =>
      addToast({ type: "success", title, message }),
    error: (message, title = "Action Failed") =>
      addToast({ type: "error", title, message, duration: 6000 }),
    warning: (message, title = "Attention Needed") =>
      addToast({ type: "warning", title, message }),
    info: (message, title = "Information") =>
      addToast({ type: "info", title, message }),
  };

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-500 shrink-0" />,
  };

  const borderStyles = {
    success: "border-emerald-200 bg-emerald-50/95 text-emerald-950 dark:border-emerald-800/80 dark:bg-emerald-950/95 dark:text-emerald-100",
    error: "border-red-200 bg-red-50/95 text-red-950 dark:border-red-800/80 dark:bg-red-950/95 dark:text-red-100",
    warning: "border-amber-200 bg-amber-50/95 text-amber-950 dark:border-amber-800/80 dark:bg-amber-950/95 dark:text-amber-100",
    info: "border-blue-200 bg-blue-50/95 text-blue-950 dark:border-blue-800/80 dark:bg-blue-950/95 dark:text-blue-100",
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast container */}
      <div
        aria-live="assertive"
        className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-md w-[calc(100vw-32px)] sm:w-96 pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`
              pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-sm
              transition-all duration-300 animate-in slide-in-from-top-3
              ${borderStyles[t.type] || borderStyles.info}
            `}
          >
            <div className="mt-0.5">{icons[t.type]}</div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold tracking-tight">{t.title}</h4>
              <p className="text-xs mt-0.5 opacity-90 leading-relaxed break-words">
                {t.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="opacity-70 hover:opacity-100 p-0.5 rounded transition shrink-0 cursor-pointer"
              aria-label="Dismiss toast"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export default ToastProvider;
