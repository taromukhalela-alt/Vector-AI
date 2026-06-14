// ─────────────────────────────────────────────────────────────────────────────
// ToastProvider.jsx — Emerald Nexus
// Glassmorphic toast stack. Emerald success accents, refined typography,
// accent rail on the left for instant type recognition.
// ─────────────────────────────────────────────────────────────────────────────
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { ToastContext } from '../context/ToastContext';

const DEFAULT_ERROR = 'Something went wrong. Please try again.';

const toastIcons = {
  error:   AlertCircle,
  warning: AlertTriangle,
  success: CheckCircle,
  info:    Info,
};

const toastStyles = {
  error:   { rail: '#ef4444', icon: '#fca5a5', tint: 'rgba(127,29,29,0.55)' },
  warning: { rail: '#f59e0b', icon: '#fbbf24', tint: 'rgba(120,53,15,0.55)' },
  success: { rail: '#10b981', icon: '#34d399', tint: 'rgba(6,78,59,0.55)'  },
  info:    { rail: '#60a5fa', icon: '#93c5fd', tint: 'rgba(30,58,138,0.45)' },
};

const normalizeToast = (toast) => {
  const type = ['error', 'warning', 'success', 'info'].includes(toast?.type) ? toast.type : 'info';
  return {
    type,
    title: toast?.title || (type === 'error' ? 'Something went wrong' : 'Heads up'),
    message: toast?.message || (type === 'error' ? DEFAULT_ERROR : ''),
    actionLabel: toast?.actionLabel,
    onAction: toast?.onAction,
    durationMs: toast?.durationMs,
  };
};

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const nextIdRef = useRef(1);
  const timersRef = useRef(new Map());

  const dismissToast = useCallback((id) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((toastInput = {}) => {
    const toast = normalizeToast(toastInput);
    const id = `toast-${nextIdRef.current++}`;
    setToasts((current) => [...current.slice(-3), { ...toast, id }]);
    const durationMs = toast.durationMs ?? (toast.actionLabel ? 0 : 5000);
    if (durationMs > 0) {
      const timer = setTimeout(() => dismissToast(id), durationMs);
      timersRef.current.set(id, timer);
    }
    return id;
  }, [dismissToast]);

  useEffect(() => () => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current.clear();
  }, []);

  const value = useMemo(() => ({ showToast, dismissToast }), [dismissToast, showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-3 top-3 z-[300] flex flex-col items-stretch gap-2 sm:inset-x-auto sm:right-4 sm:top-4 sm:w-[min(380px,calc(100vw-2rem))]"
        aria-live="polite"
        aria-relevant="additions"
      >
        {toasts.map((toast) => {
          const Icon = toastIcons[toast.type] || Info;
          const style = toastStyles[toast.type] || toastStyles.info;
          const isError = toast.type === 'error';

          return (
            <div
              key={toast.id}
              role={isError ? 'alert' : 'status'}
              className="pointer-events-auto anim-toast-in relative overflow-hidden rounded-2xl border border-white/[0.08] text-zinc-100 shadow-2xl"
              style={{
                background:
                  `linear-gradient(180deg, ${style.tint}, rgba(9,9,11,0.92))`,
                backdropFilter: 'blur(22px) saturate(1.4)',
                WebkitBackdropFilter: 'blur(22px) saturate(1.4)',
                boxShadow:
                  `0 24px 60px -16px rgba(0,0,0,0.55), 0 0 0 1px ${style.rail}33 inset`,
              }}
            >
              {/* Accent rail */}
              <span
                aria-hidden
                className="absolute inset-y-2 left-0 w-[3px] rounded-r-full"
                style={{
                  background: style.rail,
                  boxShadow: `0 0 14px ${style.rail}99`,
                }}
              />
              <div className="flex items-start gap-3 p-3.5 pl-4">
                <div
                  className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    background: `${style.rail}1f`,
                    border: `1px solid ${style.rail}44`,
                  }}
                >
                  <Icon className="h-4 w-4" style={{ color: style.icon }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-50">
                    {toast.title}
                  </p>
                  {toast.message && (
                    <p className="mt-1 text-sm font-medium leading-relaxed text-zinc-200/95">
                      {toast.message}
                    </p>
                  )}
                  {toast.actionLabel && toast.onAction && (
                    <button
                      type="button"
                      onClick={() => { toast.onAction(); dismissToast(toast.id); }}
                      className="mt-3 rounded-lg border border-white/15 bg-white/[0.04] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-50 transition hover:bg-white/10"
                    >
                      {toast.actionLabel}
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  className="rounded-lg p-1 text-zinc-400 transition hover:bg-white/10 hover:text-white"
                  aria-label="Dismiss notification"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
