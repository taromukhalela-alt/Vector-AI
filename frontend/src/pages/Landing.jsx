import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ArrowRight, Atom, BookOpen, FlaskConical, GraduationCap,
  MessageSquare, Repeat, Sigma, Download,
} from 'lucide-react';

// ─── Vector AI landing — editorial, flat, unapologetic ───────────────────────
const Landing = () => {
  const { isAuthenticated } = useAuth();
  const primaryHref = isAuthenticated ? '/dashboard' : '/auth';

  const features = [
    {
      no: '01', icon: MessageSquare, title: 'AI Tutor',
      body: 'Ask anything from the CAPS syllabus. Vector explains with equations, worked steps and follow-up questions — not walls of text.',
      points: ['Step-by-step derivations', 'Follow-up learning actions', 'Session memory across topics'],
    },
    {
      no: '02', icon: FlaskConical, title: 'Physics Lab',
      body: 'A real laboratory workspace. Adjust velocity, angle and mass, run the simulation, and read the measurements like an instrument panel.',
      points: ['Projectile motion & more', 'Live parameter control', 'Measurement readouts'],
    },
    {
      no: '03', icon: BookOpen, title: 'Study Notes',
      body: 'Generate full CAPS study guides in seconds. Chapter headings, definitions, worked examples and common mistakes — exportable to PDF.',
      points: ['AI study guides', 'Digital textbook reader', 'One-click PDF export'],
    },
    {
      no: '04', icon: Repeat, title: 'Adaptive Revision',
      body: 'Vector finds your weak areas and drills them. Write your working, get marked against the rubric, and see exactly what to fix next.',
      points: ['Weak-area targeting', 'Rubric-based marking', 'Focus areas per session'],
    },
  ];

  return (
    <div className="min-h-dvh bg-[var(--paper)] text-[var(--ink)]">

      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b-[3px] border-[var(--border)] bg-[var(--paper)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 sm:px-8">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center bg-[var(--ink)] text-[var(--paper)]"><Atom className="h-5 w-5" aria-hidden="true" /></span>
            <span className="text-lg font-black uppercase tracking-tight">Vector<span className="text-[var(--emerald)]">AI</span></span>
            <span className="neo-tag hidden sm:inline-flex">STEM learning system</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/lab" className="hidden text-xs font-black uppercase tracking-widest text-[var(--ink)] hover:text-[var(--emerald)] md:inline">Physics Lab</Link>
            <Link to={primaryHref} className="neo-btn neo-btn-primary px-4 py-2 text-xs">{isAuthenticated ? 'Open app' : 'Sign in'} <ArrowRight className="ml-1.5 h-3.5 w-3.5" aria-hidden="true" /></Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b-[3px] border-[var(--border)]">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 md:py-24 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
          <div>
            <p className="section-label mb-6">Physical Sciences · Mathematics · Life Sciences</p>
            <h1 className="text-5xl font-black uppercase leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
              Learn<br />louder.<br />
              <span className="text-[var(--emerald)]">Remember</span><br />longer.
            </h1>
            <p className="mt-8 max-w-xl text-[17px] font-medium leading-relaxed text-[var(--ink-muted)]">
              Vector AI is a full learning system built around the CAPS curriculum — a personal tutor, a physics laboratory,
              a textbook generator and an adaptive drill sergeant in one place.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link to={primaryHref} className="neo-btn neo-btn-primary px-8 py-4 text-base">
                {isAuthenticated ? 'Continue learning' : 'Start learning free'} <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
              </Link>
              <Link to="/lab" className="neo-btn px-8 py-4 text-base"><FlaskConical className="mr-2 h-5 w-5" aria-hidden="true" />Try the Physics Lab</Link>
            </div>
          </div>

          {/* Spec panel */}
          <div className="self-center border-[3px] border-[var(--border)] bg-[var(--surface)] shadow-[8px_8px_0_var(--border)]">
            <div className="border-b-[3px] border-[var(--border)] bg-[var(--ink)] px-5 py-3">
              <p className="section-label" style={{ color: 'var(--paper)' }}>System index</p>
            </div>
            {[
              ['LEARN', 'Dashboard · Subjects · Topics'],
              ['PRACTICE', 'Revision · Mock Exams'],
              ['CREATE', 'Study Notes'],
              ['EXPLORE', 'Physics Lab'],
              ['VECTOR', 'AI Tutor · History'],
            ].map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-4 border-b-2 border-[var(--border)] px-5 py-4 last:border-b-0">
                <span className="font-mono text-sm font-black tracking-widest text-[var(--emerald)]">{k}</span>
                <span className="text-right text-[13px] font-bold text-[var(--ink-muted)]">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-b-[3px] border-[var(--border)] bg-[var(--ink)] text-[var(--paper)]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x-2 divide-[var(--paper)]/20 lg:grid-cols-4">
          {[
            ['CAPS', 'Aligned curriculum'],
            ['24/7', 'Tutor availability'],
            ['1-Click', 'PDF study guides'],
            ['100%', 'Free to start'],
          ].map(([big, small]) => (
            <div key={big} className="px-5 py-8 text-center sm:px-8">
              <p className="text-3xl font-black uppercase tracking-tight sm:text-4xl">{big}</p>
              <p className="mt-2 text-[11px] font-bold uppercase tracking-widest text-[var(--paper)]/60">{small}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 md:py-24">
        <div className="flex items-end justify-between border-b-[3px] border-[var(--border)] pb-6">
          <h2 className="text-4xl font-black uppercase tracking-tight md:text-5xl">What Vector does</h2>
          <p className="section-label hidden md:block">Five tools. One system.</p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {features.map(({ no, icon: Icon, title, body, points }) => (
            <article key={no} className="flex flex-col border-[3px] border-[var(--border)] bg-[var(--surface)] p-7 shadow-[6px_6px_0_var(--border)] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_var(--border)]">
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center border-2 border-[var(--border)] bg-[var(--emerald-soft)]"><Icon className="h-6 w-6 text-[var(--ink)]" aria-hidden="true" /></span>
                <span className="font-mono text-3xl font-black text-[var(--surface-muted)]">{no}</span>
              </div>
              <h3 className="mt-5 text-2xl font-black uppercase tracking-tight">{title}</h3>
              <p className="mt-3 text-[15px] font-medium leading-relaxed text-[var(--ink-muted)]">{body}</p>
              <ul className="mt-5 space-y-2 border-t-2 border-[var(--border)] pt-4">
                {points.map((p) => (
                  <li key={p} className="flex items-center gap-2 text-[13px] font-bold"><Sigma className="h-3.5 w-3.5 shrink-0 text-[var(--emerald)]" aria-hidden="true" />{p}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <section className="border-y-[3px] border-[var(--border)] bg-[var(--emerald)]">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-5 py-14 sm:px-8 md:flex-row md:items-center md:py-16">
          <div>
            <p className="section-label" style={{ color: 'var(--emerald-dark)' }}>No credit card. No catch.</p>
            <h2 className="mt-3 text-4xl font-black uppercase leading-none tracking-tight text-white md:text-5xl">
              Your next test<br />starts here.
            </h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to={primaryHref} className="neo-btn border-[var(--border)] bg-[var(--ink)] px-8 py-4 text-base text-[var(--paper)] shadow-[5px_5px_0_var(--border)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0_var(--border)]">
              <GraduationCap className="mr-2 h-5 w-5" aria-hidden="true" />{isAuthenticated ? 'Go to dashboard' : 'Create free account'}
            </Link>
            <Link to="/notes" className="neo-btn border-[var(--border)] bg-[var(--surface)] px-8 py-4 text-base shadow-[5px_5px_0_var(--border)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0_var(--border)]">
              <Download className="mr-2 h-5 w-5" aria-hidden="true" />See study notes
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-5 py-10 sm:px-8 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center bg-[var(--ink)] text-[var(--paper)]"><Atom className="h-4 w-4" aria-hidden="true" /></span>
          <div>
            <span className="block text-sm font-black uppercase">Vector AI</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">STEM learning system</span>
          </div>
        </div>
        <nav className="flex flex-wrap gap-5 text-[11px] font-black uppercase tracking-widest">
          <Link to="/chat" className="hover:text-[var(--emerald)]">AI Tutor</Link>
          <Link to="/lab" className="hover:text-[var(--emerald)]">Physics Lab</Link>
          <Link to="/notes" className="hover:text-[var(--emerald)]">Notes</Link>
          <Link to="/revision" className="hover:text-[var(--emerald)]">Revision</Link>
          <Link to={primaryHref} className="hover:text-[var(--emerald)]">Sign in</Link>
        </nav>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--ink-muted)]">AI-accelerated learning · {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};

export default Landing;
