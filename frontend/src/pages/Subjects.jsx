import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRightIcon, AtomIcon, BooksIcon, FlaskIcon, StackIcon, SigmaIcon } from '@phosphor-icons/react';
import { PageHeader, ErrorState, VectorLoader } from '../components/ui';

const SUBJECT_ICONS = {
  'Physical Sciences': FlaskIcon,
  Physics: AtomIcon,
  Chemistry: FlaskIcon,
  Mathematics: SigmaIcon,
  Maths: SigmaIcon,
  'Mathematical Literacy': SigmaIcon,
  'Life Sciences': BooksIcon,
  Biology: BooksIcon,
};
// ─── Subjects: catalogue derived from the learner's saved material ───────────
const Subjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [notesCount, setNotesCount] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true); setError('');
      try {
        const res = await fetch('/api/notes');
        const data = await res.json().catch(() => ({}));
        const bySubject = {};
        if (data.success && Array.isArray(data.notes)) {
          data.notes.forEach((n) => {
            const key = n.topic || 'General';
            bySubject[key] = (bySubject[key] || 0) + 1;
          });
        }
        if (!cancelled) {
          setNotesCount(bySubject);
          let list = Object.keys(bySubject).map((name) => ({ name }));
          if (!list.length) list = [{ name: 'Physical Sciences' }, { name: 'Mathematics' }, { name: 'Life Sciences' }];
          setSubjects(list);
        }
      } catch {
        if (!cancelled) setError('Unable to load your subjects right now.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [retry]);

  const rows = useMemo(() => subjects.map((s) => ({
    ...s,
    noteCount: notesCount[s.name] || 0,
    Icon: SUBJECT_ICONS[s.name] || StackIcon,
  })), [subjects, notesCount]);


  if (loading) {
    return (
      <div className="mx-auto max-w-5xl">
        <PageHeader kicker="LEARN / CURRICULUM" title="Subjects" />
        <VectorLoader label="Loading the curriculum" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl">
        <PageHeader kicker="LEARN / CURRICULUM" title="Subjects" />
        <ErrorState title="Unable to load subjects" body={error} onRetry={() => setRetry((r) => r + 1)} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader kicker="LEARN / CURRICULUM" title="Subjects" intro="Every topic Vector can teach, organised by subject. Pick one to see its full CAPS topic breakdown." />

      {rows.length === 0 ? (
        <div className="neo-card mt-8 p-8 text-center md:p-10">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center border-2 border-[var(--border)] bg-[var(--surface-muted)]">
            <StackIcon className="h-7 w-7 text-[var(--ink)]" aria-hidden="true" />
          </div>
          <h3 className="text-xl font-black uppercase">No subjects available</h3>
          <p className="mx-auto mt-3 max-w-md text-[15px] font-medium text-[var(--ink-muted)]">The curriculum is still being set up. Check back soon.</p>
        </div>
      ) : (
        <div className="mt-8 border-[3px] border-[var(--border)] shadow-[6px_6px_0_var(--border)]">
          {rows.map((subject, i) => (
            <Link
              key={subject.name}
              to={`/topics?subject=${encodeURIComponent(subject.name)}`}
              className={`group flex items-center justify-between gap-4 bg-[var(--surface)] px-5 py-6 transition-colors hover:bg-[var(--emerald-soft)] md:px-8 ${i > 0 ? 'border-t-[3px] border-[var(--border)]' : ''}`}
            >
              <div className="flex min-w-0 items-center gap-5">
                <span className="shrink-0 font-mono text-xl font-black text-[var(--ink-muted)]" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                <span className="hidden shrink-0 border-2 border-[var(--border)] bg-[var(--paper)] p-3 sm:block" aria-hidden="true">
                  <subject.Icon className="h-6 w-6 text-[var(--ink)]" />
                </span>
                <div className="min-w-0">
                  <h2 className="truncate text-xl font-black uppercase tracking-tight md:text-2xl">{subject.name}</h2>
                  <p className="mt-1 text-[12px] font-bold uppercase tracking-widest text-[var(--ink-muted)]">
                    {subject.noteCount} {subject.noteCount === 1 ? 'note' : 'notes'} saved
                  </p>
                </div>
              </div>
              <ArrowUpRightIcon className="h-6 w-6 shrink-0 text-[var(--ink)] transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" aria-hidden="true" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Subjects;
