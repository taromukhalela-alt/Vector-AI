import { AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';
import Loader from './Loader';
export const VectorLoader = ({ label = 'Loading' }) => (
  <Loader label={label} />
);
export const PageHeader = ({ kicker, title, intro }) => (
  <header className="border-b-[3px] border-[var(--border)] pb-6">
    {kicker && <p className="section-label mb-3">{kicker}</p>}
    <h1 className="text-4xl font-black uppercase leading-none tracking-tight md:text-6xl">{title}</h1>
    {intro && <p className="mt-4 max-w-2xl text-[15px] font-medium text-[var(--ink-muted)]">{intro}</p>}
  </header>
);
export const EmptyState = ({ title, body, actionLabel, onAction, icon: Icon }) => (
  <div className="neo-card p-8 text-center md:p-10">
    {Icon && (<div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center border-2 border-[var(--border)] bg-[var(--surface-muted)]"><Icon className="h-7 w-7 text-[var(--ink)]" aria-hidden="true" /></div>)}
    <h3 className="text-xl font-black uppercase text-[var(--ink)]">{title}</h3>
    {body && <p className="mx-auto mt-3 max-w-md text-[15px] font-medium text-[var(--ink-muted)]">{body}</p>}
    {actionLabel && (<button type="button" onClick={onAction} className="neo-btn neo-btn-primary mt-6 px-6 py-3 text-sm">{actionLabel} <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></button>)}
  </div>
);
export const ErrorState = ({ title, body, onRetry }) => (
  <div className="neo-card p-8 text-center md:p-10" role="alert">
    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center border-2 border-[var(--border)] bg-[var(--danger)] text-white"><AlertTriangle className="h-7 w-7" aria-hidden="true" /></div>
    <h3 className="text-xl font-black uppercase text-[var(--danger)]">{title || 'Something went wrong'}</h3>
    {body && <p className="mx-auto mt-3 max-w-md text-[15px] font-medium text-[var(--ink-muted)]">{body}</p>}
    {onRetry && (<button type="button" onClick={onRetry} className="neo-btn mt-6 px-6 py-3 text-sm"><RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />Try again</button>)}
  </div>
);

