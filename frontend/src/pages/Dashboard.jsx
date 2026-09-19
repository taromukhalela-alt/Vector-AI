import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { ArrowRight } from '@phosphor-icons/react';
import { EmptyState, ErrorState, VectorLoader } from '../components/ui';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  const loadDashboard = useCallback(async (signal) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/dashboard', { signal });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || payload.message || 'Unable to load your dashboard');
      }
      setData(payload);
    } catch (loadError) {
      if (loadError.name !== 'AbortError') {
        setError(loadError.message || 'Unable to load your dashboard');
      }
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadDashboard(controller.signal);
    return () => controller.abort();
  }, [loadDashboard, retryCount]);

  if (loading && !data) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <VectorLoader label="Loading your dashboard" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="mx-auto flex min-h-full max-w-md items-center justify-center p-6">
        <ErrorState title="Dashboard unavailable" body={error} onRetry={() => setRetryCount(c => c + 1)} />
      </div>
    );
  }

  const continueLearning = data?.continue_learning;
  const questions = data?.recent_questions || [];
  const stats = data?.stats || {};
  const firstName = user?.name?.trim().split(/\s+/)[0];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="app-page-padded pb-28 md:pb-12">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: 'easeOut' }} className="flex flex-col gap-0">
      {/* HEADER SECTION */}
      <div className="border-b-[3px] border-[var(--border)] pb-8 pt-2 md:pb-10 md:pt-4">
        <p className="section-label mb-2 md:mb-4">
          {greeting}{firstName ? `, ${firstName}` : ''}.
        </p>
        <h1 className="font-display text-5xl font-bold uppercase leading-[0.9] tracking-tight text-[var(--ink)] md:text-7xl">
          What are we<br/>learning today?
        </h1>
      </div>

      {/* CONTINUE LEARNING — green progress block */}
      <div className="border-b-[3px] border-[var(--border)] py-8">
        <h2 className="section-label mb-6">Continue Learning</h2>
        
        {continueLearning ? (
          <div className="neo-panel flex flex-col gap-6 bg-[var(--emerald)] p-6 text-[#0B1410] md:flex-row md:items-end md:justify-between md:p-8">
            <div className="flex min-w-0 flex-col gap-2">
              <span className="neo-tag neo-tag-ink w-fit">
                {continueLearning.subject || 'Saved Session'}
              </span>
              <h3 className="mt-2 line-clamp-2 font-display text-3xl font-bold uppercase tracking-tight md:text-4xl">
                {continueLearning.title || 'Untitled Session'}
              </h3>
            </div>

            <button
              onClick={() => navigate(`/history?session=${encodeURIComponent(continueLearning.chat_id)}`)}
              className="neo-btn neo-btn-ink w-full flex-shrink-0 px-8 py-4 text-xl md:w-auto"
            >
              Continue <ArrowRight className="ml-2 inline h-6 w-6" weight="bold" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col gap-2">
              <h3 className="font-display text-3xl font-bold uppercase tracking-tight text-[var(--ink-muted)] md:text-4xl">
                No active sessions.
              </h3>
            </div>

            <button
              onClick={() => navigate('/chat')}
              className="neo-btn neo-btn-primary w-full flex-shrink-0 px-8 py-4 text-xl md:w-auto"
            >
              Start Session <ArrowRight className="ml-2 inline h-6 w-6" weight="bold" />
            </button>
          </div>
        )}
      </div>

      {/* MIDDLE SPLIT SECTION */}
      <div className="grid divide-[var(--border)] border-b-[3px] divide-y-[3px] border-[var(--border)] md:grid-cols-[1.5fr_1fr] md:divide-x-[3px] md:divide-y-0">

        {/* Stats Column */}
        <div className="flex flex-col py-8 md:pr-8">
          <h2 className="section-label mb-6">This Week</h2>
          <div className="flex flex-col gap-4">
            <div className="flex items-baseline justify-between border-b-2 border-[var(--border)] pb-2">
              <span className="font-mono text-3xl font-bold">{stats.questions_asked || 0}</span>
              <span className="text-sm font-bold uppercase text-[var(--ink-muted)]">Questions asked</span>
            </div>
            <div className="flex items-baseline justify-between border-b-2 border-[var(--border)] pb-2">
              <span className="font-mono text-3xl font-bold">{stats.notes_saved || 0}</span>
              <span className="text-sm font-bold uppercase text-[var(--ink-muted)]">Notes saved</span>
            </div>
            <div className="flex items-baseline justify-between border-b-2 border-[var(--border)] pb-2">
              <span className="font-mono text-3xl font-bold">{stats.sessions_count || 0}</span>
              <span className="text-sm font-bold uppercase text-[var(--ink-muted)]">Total sessions</span>
            </div>
          </div>
        </div>

        {/* Vector Tutor Column — magenta feature block */}
        <div className="neo-panel flex h-full flex-col justify-between bg-[var(--magenta)] p-6 text-white md:m-8 md:ml-8 md:mt-8">
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] opacity-90">Vector AI</p>
            <p className="mt-3 font-display text-2xl font-bold uppercase leading-tight">
              Stuck on a<br/>problem?<br/>Ask Vector.
            </p>
          </div>
          <button
            onClick={() => navigate('/chat')}
            className="neo-btn neo-btn-ink mt-6 w-full px-6 py-4 text-lg"
          >
            Open Tutor <ArrowRight className="ml-2 inline h-5 w-5" weight="bold" />
          </button>
        </div>

      </div>

      {/* RECENT ACTIVITY SECTION */}
      <div className="py-8">
        <h2 className="section-label mb-6">Recent Activity</h2>

        {questions.length > 0 ? (
          <div className="neo-panel flex flex-col">
            {questions.slice(0, 5).map((q, i) => (
              <div key={i} className="flex flex-col justify-between gap-4 border-b-2 border-[var(--border)] p-4 transition-colors last:border-b-0 hover:bg-[var(--surface-muted)] sm:flex-row sm:items-center">
                <div className="flex min-w-0 items-center gap-4">
                  <span className="w-8 flex-shrink-0 font-mono text-xl font-bold text-[var(--ink-muted)]">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <p className="truncate text-lg font-bold">
                    {q.question}
                  </p>
                </div>
                <div className="flex items-center gap-4 sm:flex-shrink-0">
                  <span className="neo-tag neo-tag-soft">
                    {q.time || 'RECENT'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No recent activity"
            body="Your latest questions and study sessions will appear here once you get started."
            actionLabel="Ask Vector a question"
            onAction={() => navigate('/chat')}
          />
        )}
      </div>

      </motion.div>
    </div>
  );
};

export default Dashboard;
