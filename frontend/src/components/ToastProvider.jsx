import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { ToastContext } from '../context/ToastContext';

const DEFAULT_ERROR = 'Something went wrong. Please try again.';

const toastIcons = {
  error: AlertCircle,
  warning: AlertTriangle,
  success: CheckCircle,
  info: Info,
};

const toastStyles = {
  error: {
    border: 'rgba(239,68,68,0.35)',
    background: 'rgba(127,29,29,0.92)',
    icon: '#fca5a5',
  },
  warning: {
    border: 'rgba(245,158,11,0.35)',
    background: 'rgba(69,26,3,0.92)',
    icon: '#fbbf24',
  },
  success: {
    border: 'rgba(16,185,129,0.35)',
    background: 'rgba(6,78,59,0.92)',
    icon: '#34d399',
  },
  info: {
    border: 'rgba(59,130,246,0.35)',
    background: 'rgba(30,58,138,0.92)',
    icon: '#93c5fd',
  },
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
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((toastInput = {}) => {
    const toast = normalizeToast(toastInput);
    const id = `toast-${nextIdRef.current}`;
    nextIdRef.current += 1;

    setToasts((current) => [...current.slice(-3), { ...toast, id }]);

    const durationMs = toast.durationMs ?? (toast.actionLabel ? 0 : 5000);
    if (durationMs > 0) {
      const timer = setTimeout(() => dismissToast(id), durationMs);
      timersRef.current.set(id, timer);
    }

    return id;
  }, [dismissToast]);

  useEffect(() => (
    () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
    }
  ), []);

  const value = useMemo(() => ({ showToast, dismissToast }), [dismissToast, showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-3 top-3 z-[300] flex flex-col items-stretch gap-2 sm:inset-x-auto sm:right-4 sm:top-4 sm:w-[min(360px,calc(100vw-2rem))]"
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
              className="pointer-events-auto anim-toast-in rounded-xl border p-3 text-zinc-100 shadow-2xl"
              style={{
                background: style.background,
                borderColor: style.border,
                backdropFilter: 'blur(18px)',
                boxShadow: '0 18px 50px rgba(0,0,0,0.35)',
              }}
              role={isError ? 'alert' : 'status'}
            >
              <div className="flex items-start gap-3">
                <Icon className="mt-0.5 h-5 w-5 shrink-0" style={{ color: style.icon }} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-zinc-50">
                    {toast.title}
                  </p>
                  {toast.message && (
                    <p className="mt-1 text-sm font-medium leading-relaxed text-zinc-200">
                      {toast.message}
                    </p>
                  )}
                  {toast.actionLabel && toast.onAction && (
                    <button
                      type="button"
                      onClick={() => {
                        toast.onAction();
                        dismissToast(toast.id);
                      }}
                      className="mt-3 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-zinc-50 transition hover:bg-white/10"
                    >
                      {toast.actionLabel}
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  className="rounded-lg p-1 text-zinc-300 transition hover:bg-white/10 hover:text-white"
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
