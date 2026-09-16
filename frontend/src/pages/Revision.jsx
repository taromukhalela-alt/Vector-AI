import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, GraduationCap, RefreshCw, Send, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PageHeader, EmptyState, ErrorState, VectorLoader } from '../components/ui';
import MarkdownRenderer from '../components/MarkdownRenderer';

// ─── Active recall workspace: the question owns the screen ───────────────────
const Revision = () => {
  const { csrfToken } = useAuth();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [focusAreas, setFocusAreas] = useState([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [assessment, setAssessment] = useState(null);
  const [checking, setChecking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [scored, setScored] = useState([]);
  const answerRef = useRef(null);

  const loadSession = useCallback(async (signal) => {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/practice/adaptive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify({}),
        signal,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || 'Unable to build a revision session');
      setQuestions(Array.isArray(data.questions) ? data.questions : []);
      setFocusAreas(Array.isArray(data.focus_areas) ? data.focus_areas : []);
      setIndex(0); setAnswer(''); setAssessment(null); setScored([]);
    } catch (e) {
      if (e.name !== 'AbortError') setError(e.message || 'Unable to build a revision session');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [csrfToken]);

  useEffect(() => {
    const controller = new AbortController();
    loadSession(controller.signal);
    return () => controller.abort();
  }, [loadSession, retry]);

  const current = questions[index];

  const handleCheck = async () => {
    if (!answer.trim() || !current) return;
    setChecking(true); setAssessment(null);
    try {
      const res = await fetch('/api/answer/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify({ question: current.question, working: answer, rubric: '' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || 'Unable to check this answer');
      const a = data.assessment || {};
      setAssessment(a);
      setScored((prev) => [...prev, { topic: current.topic, correct: typeof a.score === 'number' && a.max_score ? a.score / a.max_score >= 0.6 : null }]);
    } catch (e) {
      setAssessment({ score: null, max_score: null, strengths: [], corrections: [e.message || 'Could not check this answer.'], next_step: 'Review your working and try again.' });
    } finally {
      setChecking(false);
    }
  };

  const handleNext = () => {
    setAnswer(''); setAssessment(null);
    setIndex((i) => Math.min(i + 1, questions.length));
    setTimeout(() => answerRef.current?.focus(), 60);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader kicker="PRACTICE / ACTIVE RECALL" title="Revision" />
        <VectorLoader label="Building your session from weak areas" />
      </div>
    );
  }


  if (error) {
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader kicker="PRACTICE / ACTIVE RECALL" title="Revision" />
        <ErrorState title="Session failed to load" body={error} onRetry={() => setRetry((r) => r + 1)} />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader kicker="PRACTICE / ACTIVE RECALL" title="Revision" />
        <EmptyState icon={GraduationCap} title="No revision sessions yet" body="Vector builds questions from the areas you struggled with. Ask the tutor a few questions first." actionLabel="Ask Vector something" onAction={() => navigate('/chat')} />
      </div>
    );
  }

  const finished = index >= questions.length;
  const correctCount = scored.filter((s) => s.correct === true).length;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader kicker="PRACTICE / ACTIVE RECALL" title="Revision" />

      {/* Session strip */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-b-[3px] border-[var(--border)] pb-4">
        <div className="flex flex-wrap items-center gap-2">
          {focusAreas.slice(0, 3).map((area) => (<span key={area} className="neo-tag neo-tag-soft">{area}</span>))}
        </div>
        <p className="font-mono text-xs font-bold uppercase tracking-widest text-[var(--ink-muted)]">
          {correctCount}/{scored.length} checked correct
        </p>
      </div>

      {finished ? (
        <div className="neo-card mt-8 p-8 text-center md:p-12">
          <p className="section-label">Session complete</p>
          <h2 className="mt-3 text-5xl font-black uppercase tracking-tight md:text-6xl">{correctCount}<span className="text-[var(--ink-muted)]">/{scored.length}</span></h2>
          <p className="mx-auto mt-4 max-w-md text-[15px] font-medium text-[var(--ink-muted)]">
            {correctCount === scored.length ? 'Flawless. Vector will bring harder questions next time.' : 'Review the corrections above, then run another set to lock the concepts in.'}
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button type="button" onClick={() => loadSession()} className="neo-btn neo-btn-primary px-6 py-3 text-sm"><RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />New session</button>
            <button type="button" onClick={() => navigate('/dashboard')} className="neo-btn px-6 py-3 text-sm">Back to dashboard</button>
          </div>
        </div>
      ) : (
        <>
          {/* Question block - the question owns the screen */}
          <section aria-live="polite">
            <div className="flex items-center justify-between border-b-2 border-[var(--border)] pb-3">
              <p className="section-label">{current.topic || 'Physical Sciences'}</p>
              <p className="font-mono text-sm font-bold tracking-widest text-[var(--ink)]">
                QUESTION {String(index + 1).padStart(2, '0')}<span className="text-[var(--ink-muted)]">/{String(questions.length).padStart(2, '0')}</span>
              </p>
            </div>
            <div className="py-6 md:py-8">
              <p className="text-[15px] font-bold uppercase tracking-widest text-[var(--emerald)]">{current.skill || 'Practice'} · {current.marks || 4} marks</p>
              <div className="mt-4 text-2xl font-extrabold leading-snug tracking-tight md:text-[32px]">
                <MarkdownRenderer content={current.question} />
              </div>
            </div>

            <div className="border-t-[3px] border-[var(--border)] pt-6">
              <label htmlFor="revision-answer" className="section-label mb-3 block">Your answer</label>
              <textarea
                id="revision-answer"
                ref={answerRef}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                disabled={!!assessment || checking}
                rows={5}
                placeholder="Show your working - formulas, substitutions, units..."
                className="neo-input resize-y p-4 text-[15px] font-medium leading-relaxed"
              />
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {!assessment && (
                  <button type="button" onClick={handleCheck} disabled={!answer.trim() || checking} className="neo-btn neo-btn-primary px-6 py-3 text-sm">
                    {checking ? 'Checking...' : (<><Send className="mr-2 h-4 w-4" aria-hidden="true" />Check answer</>)}
                  </button>
                )}
                {assessment && (
                  <button type="button" onClick={handleNext} className="neo-btn neo-btn-primary px-6 py-3 text-sm">
                    {index + 1 >= questions.length ? 'Finish session' : 'Next question'} <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                  </button>
                )}
                <button type="button" onClick={handleNext} disabled={checking} className="neo-btn px-4 py-3 text-xs">Skip</button>
              </div>
            </div>
          </section>

          {/* Assessment */}
          {assessment && (
            <section className="mt-8 border-[3px] border-[var(--border)] shadow-[6px_6px_0_var(--border)]" aria-live="assertive">
              <div className={`flex items-center justify-between gap-4 border-b-[3px] border-[var(--border)] px-5 py-4 ${(typeof assessment.score === 'number' && assessment.max_score && assessment.score / assessment.max_score >= 0.6) ? 'bg-[var(--emerald)] text-white' : 'bg-[var(--danger)] text-white'}`}>
                <h3 className="text-2xl font-black uppercase tracking-tight">
                  {typeof assessment.score === 'number' && assessment.max_score ? `${assessment.score}/${assessment.max_score} marks` : 'Reviewed'}
                </h3>
                {typeof assessment.score === 'number' && assessment.max_score && (assessment.score / assessment.max_score >= 0.6
                  ? <CheckCircle2 className="h-7 w-7 shrink-0" aria-hidden="true" />
                  : <XCircle className="h-7 w-7 shrink-0" aria-hidden="true" />)}
              </div>
              <div className="grid gap-0 bg-[var(--surface)] md:grid-cols-2">
                <div className="border-b-2 border-[var(--border)] p-5 md:border-b-0 md:border-r-2">
                  <p className="section-label mb-3">Strengths</p>
                  {assessment.strengths?.length ? (
                    <ul className="space-y-2">{assessment.strengths.map((s, i) => (<li key={i} className="flex gap-2 text-[14px] font-medium"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--emerald)]" aria-hidden="true" />{s}</li>))}</ul>
                  ) : <p className="text-[14px] font-medium text-[var(--ink-muted)]">No strengths recorded for this attempt.</p>}
                </div>
                <div className="p-5">
                  <p className="section-label mb-3">Corrections</p>
                  {assessment.corrections?.length ? (
                    <ul className="space-y-2">{assessment.corrections.map((c, i) => (<li key={i} className="flex gap-2 text-[14px] font-medium"><XCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--danger)]" aria-hidden="true" />{c}</li>))}</ul>
                  ) : <p className="text-[14px] font-medium text-[var(--ink-muted)]">No corrections - solid working.</p>}
                </div>
              </div>
              {assessment.next_step && (
                <div className="border-t-2 border-[var(--border)] bg-[var(--emerald-soft)] p-5">
                  <p className="section-label mb-2">Next step</p>
                  <p className="text-[15px] font-bold">{assessment.next_step}</p>
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default Revision;
