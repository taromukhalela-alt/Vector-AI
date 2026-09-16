import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, MessageSquare, Loader2, RefreshCw } from 'lucide-react';

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
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[var(--ink)]" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex min-h-full items-center justify-center p-6">
        <div className="max-w-md text-center border-4 border-[var(--border)] bg-[var(--surface)] shadow-[6px_6px_0_var(--border)] p-8">
          <h1 className="text-2xl font-black uppercase text-[var(--danger)]">Dashboard Error</h1>
          <p className="mt-4 text-sm font-bold text-[var(--ink-muted)]">{error}</p>
          <button type="button" onClick={() => setRetryCount(c => c + 1)} className="neo-btn mt-6 px-6 py-3 w-full">
            <RefreshCw className="mr-2 h-5 w-5 inline" /> Try Again
          </button>
        </div>
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
    <div className="max-w-5xl mx-auto flex flex-col gap-0 pb-12">
      {/* HEADER SECTION */}
      <div className="pt-4 pb-8 md:pt-8 md:pb-12 border-b-4 border-[var(--border)]">
        <p className="text-sm font-black uppercase tracking-widest text-[var(--ink-muted)] mb-2 md:mb-4">
          {greeting}{firstName ? `, ${firstName}` : ''}.
        </p>
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase leading-[0.9] tracking-tighter text-[var(--ink)]">
          What are we<br/>learning today?
        </h1>
      </div>

      {/* CONTINUE LEARNING SECTION */}
      <div className="py-8 border-b-4 border-[var(--border)]">
        <h2 className="text-sm font-black uppercase tracking-widest text-[var(--ink-muted)] mb-6">Continue Learning</h2>
        
        {continueLearning ? (
          <div className="flex flex-col md:flex-row gap-6 md:items-end justify-between">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-black uppercase text-[var(--emerald)] border-2 border-[var(--border)] px-2 py-1 inline-block w-fit shadow-[2px_2px_0_var(--border)]">
                {continueLearning.subject || 'Saved Session'}
              </span>
              <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tight mt-2 line-clamp-2">
                {continueLearning.title || 'Untitled Session'}
              </h3>
            </div>
            
            <button 
              onClick={() => navigate(`/history?session=${encodeURIComponent(continueLearning.chat_id)}`)}
              className="neo-btn neo-btn-primary px-8 py-4 text-xl w-full md:w-auto flex-shrink-0"
            >
              Continue <ArrowRight className="ml-2 h-6 w-6 inline" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-6 md:items-end justify-between">
            <div className="flex flex-col gap-2">
              <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-[var(--ink-muted)]">
                No active sessions.
              </h3>
            </div>
            
            <button 
              onClick={() => navigate('/chat')}
              className="neo-btn neo-btn-primary px-8 py-4 text-xl w-full md:w-auto flex-shrink-0"
            >
              Start Session <ArrowRight className="ml-2 h-6 w-6 inline" />
            </button>
          </div>
        )}
      </div>

      {/* MIDDLE SPLIT SECTION */}
      <div className="grid md:grid-cols-[1.5fr_1fr] border-b-4 border-[var(--border)] divide-y-4 md:divide-y-0 md:divide-x-4 divide-[var(--border)]">
        
        {/* Stats Column */}
        <div className="py-8 md:pr-8 flex flex-col">
          <h2 className="text-sm font-black uppercase tracking-widest text-[var(--ink-muted)] mb-6">This Week</h2>
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-baseline border-b-2 border-[var(--border)] pb-2">
              <span className="text-3xl font-black">{stats.questions_asked || 0}</span>
              <span className="text-sm font-bold uppercase text-[var(--ink-muted)]">Questions asked</span>
            </div>
            <div className="flex justify-between items-baseline border-b-2 border-[var(--border)] pb-2">
              <span className="text-3xl font-black">{stats.notes_saved || 0}</span>
              <span className="text-sm font-bold uppercase text-[var(--ink-muted)]">Notes saved</span>
            </div>
            <div className="flex justify-between items-baseline border-b-2 border-[var(--border)] pb-2">
              <span className="text-3xl font-black">{stats.sessions_count || 0}</span>
              <span className="text-sm font-bold uppercase text-[var(--ink-muted)]">Total sessions</span>
            </div>
          </div>
        </div>

        {/* Vector Tutor Column */}
        <div className="py-8 md:pl-8 flex flex-col justify-between h-full bg-[var(--surface-muted)] px-4 md:bg-transparent md:px-0">
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-[var(--ink)] mb-4">Vector AI</h2>
            <p className="text-2xl font-black uppercase leading-tight">
              Stuck on a<br/>problem?<br/>Ask Vector.
            </p>
          </div>
          <button 
            onClick={() => navigate('/chat')}
            className="neo-btn bg-[var(--ink)] text-white w-full px-6 py-4 text-lg mt-6 hover:bg-[var(--ink-muted)]"
          >
            Open Tutor <ArrowRight className="ml-2 h-5 w-5 inline" />
          </button>
        </div>

      </div>

      {/* RECENT ACTIVITY SECTION */}
      <div className="py-8">
        <h2 className="text-sm font-black uppercase tracking-widest text-[var(--ink-muted)] mb-6">Recent Activity</h2>
        
        {questions.length > 0 ? (
          <div className="flex flex-col border-4 border-[var(--border)] bg-[var(--surface)] shadow-[6px_6px_0_var(--border)]">
            {questions.slice(0, 5).map((q, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-b-4 border-[var(--border)] last:border-b-0 hover:bg-[var(--surface-muted)] transition-colors">
                <div className="flex items-center gap-4 min-w-0">
                  <span className="text-xl font-black text-[var(--ink-muted)] w-8 flex-shrink-0">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <p className="text-lg font-bold truncate">
                    {q.question}
                  </p>
                </div>
                <div className="flex items-center gap-4 sm:flex-shrink-0">
                  <span className="text-xs font-black uppercase tracking-widest text-[var(--ink)] border-2 border-[var(--border)] px-2 py-1 shadow-[2px_2px_0_var(--border)] bg-[var(--emerald-soft)]">
                    {q.time || 'RECENT'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border-4 border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-[6px_6px_0_var(--border)]">
            <h3 className="text-xl font-black uppercase text-[var(--ink-muted)]">No recent activity</h3>
          </div>
        )}
      </div>

    </div>
  );
};

export default Dashboard;
