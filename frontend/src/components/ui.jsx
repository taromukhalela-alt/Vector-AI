import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, ArrowCounterClockwise, Warning, WarningCircle,
} from '@phosphor-icons/react';
import Loader from './Loader';

export { motion, AnimatePresence };
export const VectorLoader = ({ label = 'Loading' }) => (
  <Loader label={label} />
);

export const PageHeader = ({ kicker, title, intro, action }) => (
  <header className="border-b-[3px] border-[var(--border)] pb-6">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {kicker && <p className="section-label mb-3">{kicker}</p>}
        <h1 className="font-display text-4xl font-bold uppercase leading-none tracking-tight md:text-6xl">{title}</h1>
        {intro && <p className="mt-4 max-w-2xl text-[15px] font-medium leading-relaxed text-[var(--ink-muted)]">{intro}</p>}
      </div>
      {action}
    </div>
  </header>
);

export const EmptyState = ({
  title, body, actionLabel, onAction, icon: Icon, tone = 'default',
}) => {
  const tones = {
    default: 'bg-[var(--surface-muted)]',
    emerald: 'bg-[var(--emerald)]',
    magenta: 'bg-[var(--magenta)]',
    ink: 'bg-[var(--ink)] text-[var(--paper)]',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="neo-card p-8 text-center md:p-10"
    >
      {Icon && (
        <div className={`mx-auto mb-5 flex h-14 w-14 items-center justify-center border-2 border-[var(--border)] ${tones[tone] || tones.default}`}>
          <Icon className="h-7 w-7" weight="bold" aria-hidden="true" />
        </div>
      )}
      <h3 className="text-xl font-black uppercase text-[var(--ink)]">{title}</h3>
      {body && <p className="mx-auto mt-3 max-w-md text-[15px] font-medium leading-relaxed text-[var(--ink-muted)]">{body}</p>}
      {actionLabel && (
        <button type="button" onClick={onAction} className="neo-btn neo-btn-primary mt-6 px-6 py-3 text-sm">
          {actionLabel}
          <ArrowRight className="ml-2 h-4 w-4" weight="bold" aria-hidden="true" />
        </button>
      )}
    </motion.div>
  );
};

export const ErrorState = ({ title, body, onRetry }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.25, ease: 'easeOut' }}
    className="neo-card p-8 text-center md:p-10"
    role="alert"
  >
    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center border-2 border-[var(--border)] bg-[var(--danger)] text-white">
      <Warning className="h-7 w-7" weight="bold" aria-hidden="true" />
    </div>
    <p className="section-label mb-2">Error · your data is safe</p>
    <h3 className="text-xl font-black uppercase text-[var(--ink)]">{title || 'Something went wrong'}</h3>
    {body && <p className="mx-auto mt-3 max-w-md text-[15px] font-medium leading-relaxed text-[var(--ink-muted)]">{body}</p>}
    <p className="mx-auto mt-3 max-w-md text-[13px] font-bold text-[var(--ink-muted)]">
      Nothing was deleted. Check your connection, then try again.
    </p>
    {onRetry && (
      <button type="button" onClick={onRetry} className="neo-btn mt-6 px-6 py-3 text-sm">
        <ArrowCounterClockwise className="mr-2 h-4 w-4" weight="bold" aria-hidden="true" />
        Try again
      </button>
    )}
  </motion.div>
);

export const InfoBanner = ({ icon: Icon = WarningCircle, title, body, tone = 'default' }) => {
  const rail = tone === 'magenta' ? 'bg-[var(--magenta)]'
    : tone === 'emerald' ? 'bg-[var(--emerald)]'
    : tone === 'danger' ? 'bg-[var(--danger)]' : 'bg-[var(--ink)]';
  return (
    <div className="neo-card flex items-start gap-3 p-4">
      <span aria-hidden="true" className={`mt-0.5 h-9 w-2 shrink-0 border-2 border-[var(--border)] ${rail}`} />
      <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-[var(--border)] bg-[var(--surface-muted)]">
        <Icon className="h-5 w-5" weight="bold" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        {title && <p className="text-[12px] font-black uppercase tracking-[0.14em]">{title}</p>}
        {body && <p className="mt-1 text-sm font-medium leading-relaxed text-[var(--ink-muted)]">{body}</p>}
      </div>
    </div>
  );
};


