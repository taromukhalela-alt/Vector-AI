import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Timer, XCircle, CheckCircle } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { PageHeader, ErrorState, VectorLoader } from '../components/ui';
import MarkdownRenderer from '../components/MarkdownRenderer';

// ─── Mock Exams: a timed paper over the adaptive CAPS question engine ────────
const DURATIONS = [
  { key: 'sprint', label: 'Sprint', minutes: 15 },
  { key: 'standard', label: 'Standard', minutes: 30 },
  { key: 'full', label: 'Full paper', minutes: 60 },
];

const MockExams = () => {
  const { csrfToken } = useAuth();
  const [phase, setPhase] = useState('setup'); // setup | running | results
  const [duration, setDuration] = useState(30);
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [assessment, setAssessment] = useState(null);
  const [checking, setChecking] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const answerRef = useRef(null);

  const startExam = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/practice/adaptive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || 'Unable to assemble a paper');
      const qs = Array.isArray(data.questions) ? data.questions : [];
      if (qs.length === 0) throw new Error('No questions were returned. Ask Vector a few questions first.');
      setQuestions(qs); setAnswers([]); setIndex(0); setAssessment(null);
      setSecondsLeft(duration * 60); setPhase('running');
    } catch (e) {
      setError(e.message || 'Unable to assemble a paper');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (phase !== 'running') return undefined;
    const id = setInterval(() => setSecondsLeft((s) => {
      if (s <= 1) { clearInterval(id); return 0; }
      return s - 1;
    }), 1000);
    return () => clearInterval(id);
  }, [phase]);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');
  const current = questions[index];
  const answer = answers[index] || '';

  const handleCheck = async () => {
    if (!answer.trim() || !current || checking) return;
    setChecking(true); setAssessment(null);
    try {
      const res = await fetch('/api/answer/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify({ question: current.question, working: answer, rubric: '' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || 'Unable to mark this answer');
      setAssessment(data.assessment || {});
    } catch (e) {
      setAssessment({ score: null, max_score: null, strengths: [], corrections: [e.message || 'Marking unavailable.'], next_step: 'Move on and review at the end.' });
    } finally {
      setChecking(false);
    }
  };

  const isLast = index + 1 >= questions.length;
  const handleNext = () => {
    setAssessment(null);
    if (isLast) { setPhase('results'); return; }
    setIndex((i) => i + 1);
    setTimeout(() => answerRef.current?.focus(), 60);
  };

  if (phase === 'setup') {
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader kicker="PRACTICE / MOCK EXAMS" title="Mock Exams" intro="A timed paper drawn from your weak areas. Answers are marked against CAPS rubrics - show your working." />
        {error ? (
          <div className="mt-8"><ErrorState title="Unable to assemble a paper" body={error} onRetry={startExam} /></div>
        ) : (
          <div className="neo-card mt-8 p-8 md:p-12">
            <p className="section-label">1 · Choose your duration</p>
            <div className="mt-4 flex flex-wrap gap-3" role="group" aria-label="Exam duration">
              {DURATIONS.map((d) => (
                <button key={d.key} type="button" onClick={() => setDuration(d.minutes)}
                  aria-pressed={duration === d.minutes}
                  className={`neo-btn px-6 py-3 text-sm ${duration === d.minutes ? 'neo-btn-primary' : ''}`}>
                  <Timer className="mr-2 h-4 w-4" aria-hidden="true" />{d.label} · {d.minutes} min
                </button>
              ))}
            </div>
            <div className="mt-8 border-t-2 border-[var(--border)] pt-6">
              <button type="button" onClick={startExam} disabled={loading} className="neo-btn neo-btn-primary px-8 py-3.5 text-sm">
                {loading ? 'Assembling paper...' : 'Begin exam'} <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </button>
              <p className="mt-4 text-[13px] font-medium text-[var(--ink-muted)]">The clock starts the moment you begin and expires automatically.</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (phase === 'running' && current) {
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader kicker="PRACTICE / MOCK EXAMS" title="Mock Exams" />
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-[3px] border-[var(--border)] bg-[var(--ink)] px-5 py-3 text-[var(--paper)]">
          <p className="font-mono text-sm font-bold uppercase tracking-widest">Question {index + 1} of {questions.length}</p>
          <p className={`flex items-center gap-2 font-mono text-lg font-black tabular-nums ${secondsLeft < 60 ? 'text-[var(--warning)]' : ''}`} aria-live="off">
            <Timer className="h-5 w-5" aria-hidden="true" />{mm}:{ss}
          </p>
        </div>
        <div className="border-[3px] border-t-0 border-[var(--border)] bg-[var(--surface)] p-6 shadow-[6px_6px_0_var(--border)] md:p-10">
          <p className="text-[15px] font-bold uppercase tracking-widest text-[var(--emerald)]">{current.topic || 'Physical Sciences'} · {current.marks || 4} marks</p>
          <div className="mt-4 text-xl font-extrabold leading-snug tracking-tight md:text-2xl">
            <MarkdownRenderer content={current.question} />
          </div>
          <label htmlFor="exam-answer" className="section-label mt-8 mb-3 block">Your answer</label>
          <textarea
            id="exam-answer"
            ref={answerRef}
            value={answer}
            onChange={(e) => setAnswers((a) => { const next = [...a]; next[index] = e.target.value; return next; })}
            disabled={!!assessment || checking}
            rows={6}
            placeholder="Write your full working..."
            className="neo-input resize-y p-4 text-[15px] font-medium leading-relaxed"
          />
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {!assessment && (
              <button type="button" onClick={handleCheck} disabled={!answer.trim() || checking} className="neo-btn neo-btn-primary px-6 py-3 text-sm">
                {checking ? 'Marking...' : 'Submit for marking'}
              </button>
            )}
            {assessment && (
              <button type="button" onClick={handleNext} className="neo-btn neo-btn-primary px-6 py-3 text-sm">
                {isLast ? 'Finish paper' : 'Next question'} <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </button>
            )}
            {!assessment && (
              <button type="button" onClick={handleNext} className="neo-btn px-4 py-3 text-xs">Skip</button>
            )}
          </div>

          {assessment && (
            <div className={`mt-6 border-2 border-[var(--border)] p-4 ${typeof assessment.score === 'number' && assessment.max_score && assessment.score / assessment.max_score >= 0.6 ? 'bg-[var(--emerald-soft)]' : 'bg-[var(--surface-muted)]'}`} aria-live="polite">
              <p className="flex items-center gap-2 text-sm font-black uppercase tracking-wide">
                {typeof assessment.score === 'number' && assessment.max_score && assessment.score / assessment.max_score >= 0.6
                  ? <CheckCircle className="h-5 w-5 text-[var(--emerald)]" aria-hidden="true" />
                  : <XCircle className="h-5 w-5 text-[var(--danger)]" aria-hidden="true" />}
                {typeof assessment.score === 'number' && assessment.max_score ? `${assessment.score}/${assessment.max_score} marks` : 'Reviewed'}
              </p>
              {assessment.corrections?.length ? (
                <p className="mt-2 text-[14px] font-medium">{assessment.corrections[0]}</p>
              ) : null}
              {assessment.next_step && <p className="mt-2 text-[13px] font-bold text-[var(--ink-muted)]">Next step: {assessment.next_step}</p>}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (phase === 'results') {
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader kicker="PRACTICE / MOCK EXAMS" title="Mock Exams" />
        <div className="neo-card mt-8 p-8 text-center md:p-12">
          <p className="section-label">Paper complete</p>
          <h2 className="mt-3 text-4xl font-black uppercase tracking-tight md:text-5xl">Paper finished</h2>
          <p className="mx-auto mt-4 max-w-md text-[15px] font-medium text-[var(--ink-muted)]">
            You worked through {questions.length} questions, each marked against the CAPS rubric as you submitted it. Drill the misses in Revision to close the gaps.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button type="button" onClick={() => setPhase('setup')} className="neo-btn neo-btn-primary px-6 py-3 text-sm">New paper</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader kicker="PRACTICE / MOCK EXAMS" title="Mock Exams" />
      <VectorLoader label="Preparing the exam hall" />
    </div>
  );
};

export default MockExams;


