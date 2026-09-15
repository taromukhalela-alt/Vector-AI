import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  FileText,
  FlaskConical,
  Gauge,
  Loader2,
  MessageSquare,
  RefreshCw,
  Sparkles,
  Target,
  Timer,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const metricIcons = {
  questions_asked: MessageSquare,
  notes_saved: FileText,
  sessions_count: Activity,
  avg_confidence: Target,
  inference_latency_ms: Timer,
};

// Renders whatever relationship shape the API returns as readable rows instead
// of dumping raw JSON into a <pre> block.
const KnowledgeMapView = ({ value }) => {
  const entries = Array.isArray(value)
    ? value.map((item, index) => {
        if (item && typeof item === 'object') {
          const label = item.title || item.name || item.topic || item.source || `Connection ${index + 1}`;
          const related = item.related || item.target || item.to || item.topics || item.connections;
          const detail = Array.isArray(related) ? related.join(' · ') : related;
          return {
            label: String(label),
            detail: typeof detail === 'string' && detail ? detail : (item.description || item.relation || ''),
          };
        }
        return { label: String(item), detail: '' };
      })
    : Object.entries(value || {}).map(([key, item]) => ({
        label: key.replace(/_/g, ' '),
        detail: Array.isArray(item) ? item.join(' · ') : String(item ?? ''),
      }));

  if (!entries.length) return null;

  return (
    <ul className="space-y-2">
      {entries.map((entry, index) => (
        <li
          key={`${entry.label}-${index}`}
          className="flex flex-col gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <span className="text-sm font-semibold capitalize text-zinc-100">{entry.label}</span>
          {entry.detail ? <span className="text-xs text-zinc-400">{entry.detail}</span> : null}
        </li>
      ))}
    </ul>
  );
};


const formatMetric = (metric) => {
  if (metric.value === null || metric.value === undefined) return 'No data';
  return `${metric.value}${metric.unit || ''}`;
};

const MetricCard = ({ metric }) => {
  const Icon = metricIcons[metric.key] || Activity;
  const hasValue = metric.value !== null && metric.value !== undefined;

  return (
    <article className="card-flat group flex min-h-36 flex-col justify-between p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/15 bg-emerald-400/10 text-emerald-300">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        {hasValue && metric.key === 'avg_confidence' && metric.max ? (
          <span className="text-xs font-semibold tabular-nums text-emerald-300">
            {Math.round((metric.value / metric.max) * 100)}%
          </span>
        ) : null}
      </div>
      <div>
        <p className="mt-5 text-2xl font-bold tracking-tight text-zinc-50">
          {formatMetric(metric)}
        </p>
        <h2 className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-zinc-400">
          {metric.label}
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-zinc-500">{metric.desc}</p>
      </div>
    </article>
  );
};

const EmptyState = ({ title, description, action, onAction, icon: Icon = Sparkles }) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-10 text-center">
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/15 bg-emerald-400/10 text-emerald-300">
      <Icon className="h-6 w-6" aria-hidden="true" />
    </div>
    <h3 className="mt-4 text-sm font-bold text-zinc-100">{title}</h3>
    <p className="mt-2 max-w-md text-xs leading-relaxed text-zinc-500">{description}</p>
    {action ? (
      <button type="button" onClick={onAction} className="btn-primary mt-5">
        {action}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </button>
    ) : null}
  </div>
);

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
    // The loader owns async state updates; the effect only manages its lifecycle.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDashboard(controller.signal);
    return () => controller.abort();
  }, [loadDashboard, retryCount]);

  const stats = data?.stats;
  const metrics = data?.metrics || [];
  const questions = data?.recent_questions || [];
  const sessions = data?.sessions || [];
  const subjects = data?.subjects || [];
  const topics = data?.topics || data?.syllabus || [];
  const continueLearning = data?.continue_learning;
  const dailyMission = data?.daily_mission;
  const knowledgeMap = data?.knowledge_map;
  const hasKnowledgeMap = Array.isArray(knowledgeMap)
    ? knowledgeMap.length > 0
    : Boolean(knowledgeMap && typeof knowledgeMap === 'object' && Object.keys(knowledgeMap).length > 0);
  const hasActivity = (stats?.questions_asked || 0) > 0 || (stats?.notes_saved || 0) > 0;
  // Only learner-meaningful numbers are surfaced. The raw model-internals
  // ("average confidence", inference latency in ms) mean nothing to a learner,
  // so the API keeps returning them but the UI no longer leads with them.
  const learnerMetrics = [
    metrics.find((metric) => metric.key === 'questions_asked'),
    metrics.find((metric) => metric.key === 'notes_saved'),
    stats?.sessions_count !== undefined
      ? {
          key: 'sessions_count',
          label: 'Study sessions',
          value: stats.sessions_count,
          unit: '',
          desc: 'Tutor conversations saved to your account',
        }
      : null,
  ].filter(Boolean);
  const firstName = user?.name?.trim().split(/\s+/)[0];

  if (loading && !data) {
    // Skeleton rather than a spinner: the layout is known, so the page can show
    // its shape immediately instead of a blank screen.
    return (
      <div className="min-h-full bg-zinc-950 px-5 py-7 sm:px-8 sm:py-10">
        <div className="mx-auto max-w-7xl animate-pulse space-y-8" role="status" aria-live="polite">
          <span className="sr-only">Loading your progress</span>
          <div className="space-y-3 border-b border-white/[0.06] pb-7">
            <div className="h-5 w-40 rounded-full bg-white/[0.06]" />
            <div className="h-9 w-72 max-w-full rounded-lg bg-white/[0.06]" />
            <div className="h-4 w-96 max-w-full rounded bg-white/[0.04]" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((key) => (
              <div key={key} className="h-36 rounded-2xl border border-white/[0.06] bg-white/[0.02]" />
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="h-48 rounded-2xl border border-white/[0.06] bg-white/[0.02]" />
            <div className="h-48 rounded-2xl border border-white/[0.06] bg-white/[0.02]" />
          </div>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex min-h-full items-center justify-center bg-zinc-950 px-6">
        <div className="max-w-md text-center" role="alert">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-red-400/20 bg-red-400/10 text-red-300">
            <Activity className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-lg font-bold text-zinc-100">Dashboard unavailable</h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-500">{error}</p>
          <button
            type="button"
            onClick={() => setRetryCount((count) => count + 1)}
            className="btn-primary mt-5"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="workspace-page min-h-full">
      <div className="mx-auto max-w-7xl space-y-8 px-5 py-7 sm:px-8 sm:py-10">
        <header className="flex flex-col justify-between gap-5 border-b border-white/[0.06] pb-7 lg:flex-row lg:items-end">
          <div>
            <div className="tag mb-3">
              <Gauge className="h-3 w-3" aria-hidden="true" />
              Learner dashboard
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
              {firstName ? `Welcome back, ${firstName}.` : 'Your learning dashboard.'}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
              A private view of the questions, notes, and study activity saved to your account.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => navigate('/chat')} className="btn-primary">
              <MessageSquare className="h-4 w-4" aria-hidden="true" />
              Ask the tutor
            </button>
            <button type="button" onClick={() => navigate('/lab')} className="btn-ghost border-white/10">
              <FlaskConical className="h-4 w-4" aria-hidden="true" />
              Open physics lab
            </button>
          </div>
        </header>

        {error ? (
          <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3 text-xs text-amber-200" role="status">
            <span>{error} Showing your last available data.</span>
            <button type="button" onClick={() => setRetryCount((count) => count + 1)} className="font-bold underline">
              Retry
            </button>
          </div>
        ) : null}

        {learnerMetrics.length > 0 ? (
          <section aria-labelledby="account-metrics">
            <div className="mb-3 flex items-center justify-between">
              <h2 id="account-metrics" className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
                Your study activity
              </h2>
              {loading ? <Loader2 className="h-4 w-4 animate-spin text-emerald-400" aria-label="Refreshing" /> : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {learnerMetrics.map((metric) => <MetricCard key={metric.key || metric.label} metric={metric} />)}
            </div>
          </section>
        ) : null}

        <section aria-labelledby="quick-actions">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="quick-actions" className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
              Quick actions
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              {
                label: 'Explain',
                description: 'Break down a concept',
                icon: MessageSquare,
                prompt: 'Explain a key STEM concept clearly, with an intuitive example and a quick check for understanding.'
              },
              {
                label: 'Solve With Me',
                description: 'Work it out step by step',
                icon: Target,
                prompt: 'Solve a STEM problem with me step by step and explain each formula and decision along the way.'
              },
              {
                label: 'Quiz Me',
                description: 'Test your understanding',
                icon: CheckCircle2,
                prompt: 'Quiz me on a STEM topic one question at a time and give me feedback after each answer.'
              },
              {
                label: 'Give Me a Hint',
                description: 'Get unstuck without spoilers',
                icon: Sparkles,
                prompt: 'Give me a small hint for a difficult STEM question without solving it outright.'
              },
              {
                label: 'Summarize',
                description: 'Make revision notes',
                icon: FileText,
                prompt: 'Summarize the most important ideas from my recent topic into a concise revision checklist.'
              },
            ].map(({ label, description, icon: Icon, prompt }) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    sessionStorage.setItem('vector_dashboard_prompt', prompt);
                  }
                  navigate('/chat');
                }}
                className="card-flat flex items-center gap-3 p-4 text-left transition hover:border-emerald-400/30 hover:bg-emerald-400/[0.04]"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-400/15 bg-emerald-400/10 text-emerald-300">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-zinc-100">{label}</span>
                  <span className="mt-0.5 block text-xs text-zinc-500">{description}</span>
                </span>
                <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-zinc-600" aria-hidden="true" />
              </button>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="card-flat overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-base font-bold text-zinc-100">Continue learning</h2>
                <p className="mt-1 text-xs text-zinc-500">Resume a saved tutor conversation</p>
              </div>
              <BookOpen className="h-5 w-5 text-emerald-400" aria-hidden="true" />
            </div>
            <div className="p-5 sm:p-6">
              {continueLearning?.chat_id ? (
                <button
                  type="button"
                  onClick={() => navigate(`/history?session=${encodeURIComponent(continueLearning.chat_id)}`)}
                  className="group w-full rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-left transition hover:border-emerald-400/30 hover:bg-emerald-400/[0.04]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/80">
                        {continueLearning.title}
                      </p>
                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-zinc-200">
                        {continueLearning.question || 'Saved tutor conversation'}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-zinc-600 transition group-hover:text-emerald-400" aria-hidden="true" />
                  </div>
                </button>
              ) : (
                <EmptyState
                  icon={BookOpen}
                  title="Nothing to continue yet"
                  description="Start a tutor conversation and it will appear here for your next study session."
                  action="Open AI Tutor"
                  onAction={() => navigate('/chat')}
                />
              )}
            </div>
          </article>

          <article className="card-flat overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-base font-bold text-zinc-100">Daily mission</h2>
                <p className="mt-1 text-xs text-zinc-500">A saved goal for today</p>
              </div>
              <Target className="h-5 w-5 text-emerald-400" aria-hidden="true" />
            </div>
            <div className="p-5 sm:p-6">
              {dailyMission ? (
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-sm text-zinc-200">
                  {dailyMission.title || dailyMission.description || dailyMission}
                </div>
              ) : (
                <EmptyState
                  icon={Target}
                  title="No daily mission configured"
                  description="Daily missions will appear here when a saved goal is available for your account."
                />
              )}
            </div>
          </article>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="card-flat overflow-hidden">
            <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-base font-bold text-zinc-100">Subjects &amp; topics</h2>
                <p className="mt-1 text-xs text-zinc-500">Only topics found in your saved tutor activity and notes.</p>
              </div>
              <BookOpen className="h-5 w-5 text-emerald-400" aria-hidden="true" />
            </div>
            <div className="p-5 sm:p-6">
              {topics.length > 0 ? (
                <div className="space-y-4">
                  {subjects.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {subjects.map((subject) => (
                        <span key={subject.name} className="rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-3 py-1.5 text-xs font-semibold text-emerald-300">
                          {subject.name} · {subject.topic_count} {subject.topic_count === 1 ? 'topic' : 'topics'}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <div className="grid gap-4 sm:grid-cols-2">
                  {topics.map((item) => (
                    <div key={item.title} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-semibold text-zinc-100">{item.title}</h3>
                          <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400/80">{item.subject}</p>
                        </div>
                        <span className="text-sm font-bold tabular-nums text-zinc-200">{item.activity_count}</span>
                      </div>
                      <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                        {item.activity_count === 1 ? '1 saved activity' : `${item.activity_count} saved activities`}
                      </p>
                    </div>
                  ))}
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={BrainCircuit}
                  title="No subjects or topics yet"
                  description="Ask a question in AI Tutor or save a note to see your actual study topics appear here."
                  action="Start with AI Tutor"
                  onAction={() => navigate('/chat')}
                />
              )}
            </div>
          </div>

          <div className="card-flat overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-base font-bold text-zinc-100">Recent questions</h2>
                <p className="mt-1 text-xs text-zinc-500">Your latest tutor activity</p>
              </div>
              <Activity className="h-5 w-5 text-emerald-400" aria-hidden="true" />
            </div>
            <div className="p-5 sm:p-6">
              {questions.length > 0 ? (
                <ul className="space-y-3">
                  {questions.map((question, index) => (
                    <li key={`${question.time}-${index}`} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                      <p className="text-sm leading-relaxed text-zinc-200">{question.question}</p>
                      <div className="mt-2 flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                        <span>{question.time || 'Date unavailable'}</span>
                        <span className="text-emerald-400/80">
                          {question.confidence !== null && question.confidence !== undefined ? `${question.confidence}% confidence` : 'Confidence unavailable'}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  icon={MessageSquare}
                  title="No questions yet"
                  description="Your saved tutor questions will appear here after your first conversation."
                  action="Open AI Tutor"
                  onAction={() => navigate('/chat')}
                />
              )}
            </div>
          </div>
        </section>

        <section className="card-flat overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-base font-bold text-zinc-100">Study sessions</h2>
              <p className="mt-1 text-xs text-zinc-500">Saved conversation sessions on this account</p>
            </div>
            <CheckCircle2 className="h-5 w-5 text-emerald-400" aria-hidden="true" />
          </div>
          <div className="p-5 sm:p-6">
            {sessions.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {sessions.map((session) => (
                  <button key={session.chat_id} type="button" onClick={() => navigate(`/history?session=${encodeURIComponent(session.chat_id)}`)} className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-left hover:border-emerald-400/30 hover:bg-emerald-400/[0.04]">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="line-clamp-2 text-sm font-semibold text-zinc-100">{session.title}</h3>
                      <ArrowRight className="h-4 w-4 shrink-0 text-zinc-600 transition group-hover:text-emerald-400" aria-hidden="true" />
                    </div>
                    <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      {session.count} {session.count === 1 ? 'question' : 'questions'} · {session.last_time}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Sparkles}
                title={hasActivity ? 'No sessions to show' : 'Build your first study session'}
                description="Your study sessions are created automatically when you chat with the tutor."
                action="Ask a question"
                onAction={() => navigate('/chat')}
              />
            )}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <button
            type="button"
            onClick={() => navigate('/lab')}
            className="card-flat group flex items-center justify-between gap-4 p-5 text-left transition hover:border-emerald-400/30 hover:bg-emerald-400/[0.04] sm:p-6"
          >
            <span>
              <span className="flex items-center gap-2 text-base font-bold text-zinc-100">
                <FlaskConical className="h-5 w-5 text-emerald-400" aria-hidden="true" />
                Physics Lab
              </span>
              <span className="mt-2 block text-xs leading-relaxed text-zinc-500">
                Explore interactive simulations when you are ready to visualise a concept.
              </span>
            </span>
            <ArrowRight className="h-5 w-5 shrink-0 text-zinc-600 transition group-hover:text-emerald-400" aria-hidden="true" />
          </button>

          <article className="card-flat overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-base font-bold text-zinc-100">Knowledge map</h2>
                <p className="mt-1 text-xs text-zinc-500">Connections from saved learning data</p>
              </div>
              <BrainCircuit className="h-5 w-5 text-emerald-400" aria-hidden="true" />
            </div>
            <div className="p-5 sm:p-6">
              {hasKnowledgeMap ? (
                <KnowledgeMapView value={knowledgeMap} />
              ) : (
                <EmptyState
                  icon={BrainCircuit}
                  title="Knowledge map unavailable"
                  description={data?.knowledge_map_message || 'No topic relationships are stored for this account yet.'}
                />
              )}
            </div>
          </article>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
