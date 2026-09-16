// ToastProvider — flat neo-brutalist toast stack.
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
  error: { rail: '#C9362B', ink: '#C9362B', soft: '#F9DDDA' },
  warning: { rail: '#D9A522', ink: '#7A5A00', soft: '#F8ECC9' },
  success: { rail: '#087F5B', ink: '#065A41', soft: '#D2EDDF' },
  info: { rail: '#111311', ink: '#111311', soft: '#E5E4DE' },
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
            <div key={toast.id} role={isError ? 'alert' : 'status'} className="neo-card pointer-events-auto flex items-start gap-3 p-3.5">
              <span aria-hidden="true" className="mt-1 h-8 w-2 shrink-0 border-2 border-[var(--border)]" style={{ background: style.rail }} />
              <div className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-[var(--border)]" style={{ background: style.soft }}>
                <Icon className="h-5 w-5" style={{ color: style.ink }} aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--ink)]">{toast.title}</p>
                {toast.message && (<p className="mt-1 text-sm font-medium leading-relaxed text-[var(--ink-muted)]">{toast.message}</p>)}
                {toast.actionLabel && toast.onAction && (
                  <button type="button" onClick={() => { toast.onAction(); dismissToast(toast.id); }} className="neo-btn mt-3 px-3 py-1.5 text-[11px]">{toast.actionLabel}</button>
                )}
              </div>
              <button type="button" onClick={() => dismissToast(toast.id)} className="border-2 border-[var(--border)] p-1 hover:bg-[var(--surface-muted)]" aria-label="Dismiss notification">
                <X className="h-4 w-4 text-[var(--ink)]" aria-hidden="true" />
              </button>
            </div>
            );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
