import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ArrowRight, Mic, FlaskConical, BookOpen, FileText,
  ChevronDown, Cpu, Sparkles, Award, ShieldCheck, Zap, Play, Atom
} from 'lucide-react';

/* ── Floating particles ── */
const Particles = () => {
  const dots = Array.from({ length: 22 }, (_, i) => ({
    id: i,
    left: `${(i * 4.7 + Math.sin(i) * 12 + 50) % 100}%`,
    size: 1.5 + (i % 3) * 1.2,
    duration: 14 + (i % 8) * 3,
    delay: (i * 0.7) % 14,
    opacity: 0.2 + (i % 4) * 0.12,
  }));
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {dots.map(d => (
        <span
          key={d.id}
          className="particle"
          style={{
            left: d.left,
            bottom: '-8px',
            width: d.size,
            height: d.size,
            opacity: d.opacity,
            animationDuration: `${d.duration}s`,
            animationDelay: `${d.delay}s`,
          }}
        />
      ))}
    </div>
  );
};

/* ── Animated counter ── */
const Counter = ({ end, suffix = '', duration = 1800 }) => {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        const start = performance.now();
        const tick = (now) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 4);
          setVal(Math.round(eased * parseFloat(end)));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        observer.disconnect();
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);
  return <span ref={ref}>{val}{suffix}</span>;
};

/* ── Reveal-on-scroll ── */
const Reveal = ({ children, className = '', delay = 0 }) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.12 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(28px)',
        transition: `opacity .65s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform .65s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};

/* ── FAQ Accordion ── */
const FaqItem = ({ q, a, delay }) => {
  const [open, setOpen] = useState(false);
  return (
    <Reveal delay={delay}>
      <div
        className="card overflow-hidden cursor-pointer group"
        onClick={() => setOpen(o => !o)}
        role="button"
        aria-expanded={open}
      >
        <div className="flex items-center justify-between p-5 sm:p-6">
          <p className="font-semibold text-sm text-zinc-100 pr-4 leading-snug">{q}</p>
          <ChevronDown
            className="w-4 h-4 text-emerald-400 shrink-0 transition-transform duration-300"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </div>
        {open && (
          <div className="px-5 pb-5 pt-0 sm:px-6 border-t border-white/[0.06]">
            <p className="text-zinc-400 text-sm leading-relaxed pt-4">{a}</p>
          </div>
        )}
      </div>
    </Reveal>
  );
};

const Landing = ({ onNavigate }) => {
  const { isAuthenticated } = useAuth();
  const go = () => onNavigate(isAuthenticated ? 'chat' : 'auth');

  const features = [
    {
      icon: Mic,
      title: "Real-Time AI Voice Tutor",
      desc: "Speak naturally and get instant vocal explanations powered by CAMB AI & ElevenLabs synthesis.",
      tags: ["Voice Synthesis", "Low Latency"],
      color: "from-emerald-500/20 to-teal-500/10",
      iconBg: "bg-emerald-500/15 border-emerald-500/25",
    },
    {
      icon: FlaskConical,
      title: "2D Physics Visual Lab",
      desc: "Run kinetic simulations — projectiles, waves, orbits — side-by-side with your study chat.",
      tags: ["Canvas 2D", "Interactive HUD"],
      color: "from-teal-500/20 to-emerald-500/10",
      iconBg: "bg-teal-500/15 border-teal-500/25",
    },
    {
      icon: BookOpen,
      title: "100% CAPS Aligned",
      desc: "Built for South African Grade 10–12 Physical Sciences and Chemistry curricula.",
      tags: ["CAPS Curriculum", "SA Focused"],
      color: "from-emerald-600/20 to-green-500/10",
      iconBg: "bg-emerald-600/15 border-emerald-600/25",
    },
    {
      icon: FileText,
      title: "Semantic Notes Vault",
      desc: "AI-generated study guides with LaTeX math, worked examples, and branded PDF exports.",
      tags: ["LaTeX", "PDF Export"],
      color: "from-cyan-500/15 to-teal-500/10",
      iconBg: "bg-cyan-500/15 border-cyan-500/25",
    },
  ];

  const stats = [
    { value: 90,  suffix: ' ms', label: "Inference Latency",       icon: Cpu },
    { value: 98,  suffix: '%',   label: "Lab Trajectory Fidelity", icon: Award },
    { value: 100, suffix: '%',   label: "CAPS Match",              icon: ShieldCheck },
    { value: 5,   suffix: '+',   label: "Live Simulations",        icon: FlaskConical },
  ];

  const faqs = [
    { q: "Is Vector AI aligned with the South African CAPS curriculum?", a: "Yes, 100%. All content is calibrated against CAPS guidelines for Grade 10–12 Physical Sciences and Chemistry." },
    { q: "How does the AI voice tutor work?", a: "Press mic, speak your question. The system transcribes, processes intent, matches a physics simulation, then synthesises a spoken response in real time." },
    { q: "Can I use Vector AI offline?", a: "Your saved notes and flashcards are cached locally and sync back to the cloud when you reconnect." },
    { q: "How do I generate comprehensive study guides?", a: "Navigate to Study Notes, type any CAPS topic (e.g. 'Projectile Motion'), and hit Generate. The AI writes a full guide with formulas and worked examples." },
  ];

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-zinc-950 text-zinc-100 font-sans select-none">

      {/* ── Ambient Background ── */}
      <div className="absolute inset-0 pointer-events-none z-0 sci-grid opacity-60"
        style={{
          WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 20%, black 40%, transparent 100%)',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 20%, black 40%, transparent 100%)',
        }}
      />

      {/* Orbs */}
      <div className="orb anim-float-slow" style={{ top: '8%', right: '-2%', width: 560, height: 560, background: 'radial-gradient(circle, rgba(16,185,129,0.10) 0%, transparent 70%)' }} />
      <div className="orb anim-float" style={{ bottom: '15%', left: '-4%', width: 440, height: 440, background: 'radial-gradient(circle, rgba(45,212,191,0.07) 0%, transparent 70%)', animationDelay: '2s' }} />
      <div className="orb anim-float-slow" style={{ top: '55%', right: '25%', width: 280, height: 280, background: 'radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)', animationDelay: '4s' }} />

      <Particles />

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 mx-3 mt-3">
        <nav className="glass rounded-[18px] px-5 py-3 flex items-center justify-between shadow-lg shadow-black/30 anim-fade-down">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 anim-glow">
              <Atom className="w-5 h-5 text-zinc-950" strokeWidth={2.5} />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight block leading-none text-zinc-50">Vector AI</span>
              <span className="text-[9px] tracking-[.18em] text-emerald-400 font-bold uppercase block mt-0.5">STEM OS</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="landing-signin-btn"
              onClick={go}
              className="btn-ghost text-zinc-400 hover:text-zinc-100"
            >
              Sign In
            </button>
            <button
              id="landing-cta-btn"
              onClick={go}
              className="btn-primary flex items-center gap-2"
            >
              Get Started
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
            </button>
          </div>
        </nav>
      </header>

      {/* ── HERO ── */}
      <section className="relative z-10 px-6 pt-20 pb-24 text-center max-w-5xl mx-auto flex flex-col items-center">
        {/* Badge */}
        <div className="anim-fade-up d-100 inline-flex items-center gap-2 px-4 py-2 mb-8 anim-border-pulse rounded-full"
          style={{
            background: 'rgba(16,185,129,0.07)',
            border: '1px solid rgba(16,185,129,0.22)',
          }}
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-emerald-400 font-bold text-[11px] tracking-widest uppercase">
            AI-Accelerated Physical Science
          </span>
        </div>

        {/* Headline */}
        <h1 className="anim-fade-up d-200 font-black tracking-tight leading-[1.05] mb-6"
          style={{ fontSize: 'clamp(2.4rem, 7vw, 5rem)' }}
        >
          Master Physical Science,
          <br />
          <span className="text-gradient anim-gradient">
            Intelligently
          </span>
        </h1>

        {/* Sub */}
        <p className="anim-fade-up d-350 text-zinc-400 text-base sm:text-lg leading-relaxed max-w-2xl mb-12">
          South Africa's premium CAPS-aligned platform built by a teenager.
          Interactive 2D simulations, real-time voice tutoring, and semantic
          study notes — engineered to unlock physical science mastery.
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-4xl mb-12">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <Reveal key={i} delay={i * 80} className="card p-5 text-center group">
                <div className="w-9 h-9 rounded-xl border flex items-center justify-center mx-auto mb-3 text-emerald-400 transition-all duration-300 group-hover:border-emerald-500/40 group-hover:shadow-md group-hover:shadow-emerald-500/15"
                  style={{ background: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.15)' }}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="font-black text-xl text-emerald-400 tabular-nums">
                  <Counter end={s.value} suffix={s.suffix} />
                </div>
                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1.5">{s.label}</div>
              </Reveal>
            );
          })}
        </div>

        {/* Primary CTA */}
        <Reveal delay={480}>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              id="hero-launch-btn"
              onClick={go}
              className="group flex items-center gap-2.5 px-10 py-4 font-black rounded-xl tracking-wider uppercase text-sm cursor-pointer transition-all"
              style={{
                background: 'linear-gradient(135deg, #10b981, #2dd4bf)',
                color: '#09090b',
                boxShadow: '0 6px 28px rgba(16,185,129,0.30)',
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 10px 40px rgba(16,185,129,0.45)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 6px 28px rgba(16,185,129,0.30)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <Play className="w-4 h-4 fill-current" />
              Launch Vector AI
              <ArrowRight className="w-4 h-4 stroke-[2.5px] group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-zinc-600 text-xs font-semibold">Free · No credit card required</p>
          </div>
        </Reveal>
      </section>

      {/* ── FEATURES ── */}
      <section className="relative z-10 py-24 px-6 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto">
          <Reveal className="text-center mb-14">
            <div className="inline-flex items-center gap-2 mb-4 tag">
              <Zap className="w-3 h-3" /> What's Inside
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Built for <span className="text-gradient">STEM Mastery</span>
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <Reveal key={i} delay={i * 100}>
                  <div className={`card p-7 group cursor-default bg-gradient-to-br ${f.color}`}>
                    <div className={`w-11 h-11 rounded-xl border flex items-center justify-center text-emerald-400 mb-5 transition-all duration-300 group-hover:scale-110 ${f.iconBg}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-extrabold text-base sm:text-lg tracking-tight mb-2 text-zinc-100">{f.title}</h3>
                    <p className="text-zinc-400 text-sm leading-relaxed mb-5">{f.desc}</p>
                    <div className="flex flex-wrap gap-2">
                      {f.tags.map((tag, j) => (
                        <span key={j} className="tag">{tag}</span>
                      ))}
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── SCIENCE HIGHLIGHT STRIP ── */}
      <section className="relative z-10 py-16 px-6 overflow-hidden" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="absolute inset-0 sci-grid-sm opacity-40 pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Reveal>
            <div className="glass rounded-2xl px-8 py-10 inline-block w-full" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(45,212,191,0.05))' }}>
              <div className="inline-flex items-center gap-2 mb-5 tag">
                <ShieldCheck className="w-3 h-3" /> CAPS Certified
              </div>
              <h2 className="font-black text-2xl sm:text-3xl tracking-tight mb-4">
                The Only AI Platform <span className="text-gradient">Purpose-Built</span>
                <br />for South African Matric Physics
              </h2>
              <p className="text-zinc-400 text-sm leading-relaxed max-w-xl mx-auto">
                Every formula, every concept, every simulation is verified against the official
                CAPS curriculum for Grade 10, 11, and 12 — no guesswork, no off-syllabus content.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="relative z-10 py-24 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-3xl mx-auto">
          <Reveal className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4 tag">
              <Sparkles className="w-3 h-3" /> Questions
            </div>
            <h2 className="text-3xl font-black tracking-tight">
              Got Questions? <span className="text-gradient">Answered.</span>
            </h2>
          </Reveal>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <FaqItem key={i} q={faq.q} a={faq.a} delay={i * 70} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 px-6 py-14 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <Reveal>
          <div className="flex items-center justify-center gap-2.5 mb-4">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Atom className="w-4 h-4 text-zinc-950" strokeWidth={2.5} />
            </div>
            <span className="font-extrabold text-sm tracking-tight text-zinc-100">Vector AI</span>
            <span className="text-[9px] font-bold tracking-[.18em] text-emerald-400 uppercase border border-emerald-500/20 rounded-full px-2 py-0.5">STEM OS</span>
          </div>
          <p className="text-zinc-500 text-xs tracking-wide mb-1">
            AI-Accelerated Learning — Developed by Taro Mukhalela
          </p>
          <p className="text-zinc-700 text-[10px] tracking-wider">
            © {new Date().getFullYear()} Vector AI. All Rights Reserved.
          </p>
        </Reveal>
      </footer>
    </div>
  );
};

export default Landing;
