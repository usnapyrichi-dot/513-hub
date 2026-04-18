"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const dismiss = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast stack */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ─── Toast Item ───────────────────────────────────────────────────────────────

const TOAST_CONFIG: Record<ToastType, { icon: React.ElementType; accent: string; bg: string }> = {
  success: { icon: CheckCircle2, accent: "#34C759", bg: "#F0FDF4" },
  error:   { icon: AlertCircle,  accent: "#FF3B30", bg: "#FFF0F0" },
  info:    { icon: Info,         accent: "#007AFF", bg: "#EFF6FF" },
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);
  const cfg = TOAST_CONFIG[toast.type];
  const Icon = cfg.icon;

  useEffect(() => {
    // Animate in
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-[12px] shadow-lg border transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
      style={{ backgroundColor: cfg.bg, borderColor: cfg.accent + "30", minWidth: "280px", maxWidth: "380px" }}
    >
      <Icon className="w-4 h-4 flex-shrink-0" style={{ color: cfg.accent }} />
      <p className="flex-1 text-[12px] font-medium text-[#1C1C1C] leading-snug">{toast.message}</p>
      <button onClick={onDismiss} className="text-[#949494] hover:text-[#1C1C1C] transition-colors flex-shrink-0">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
