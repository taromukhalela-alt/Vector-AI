import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ArrowRight, Mic, FlaskConical, BookOpen, FileText,
  ChevronDown, Cpu, Sparkles, Award, ShieldCheck, Zap, Play
} from 'lucide-react';

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
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity .7s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform .7s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};

const FaqItem = ({ q, a, delay }) => {
  const [open, setOpen] = useState(false);
  return (
    <Reveal delay={delay}>
      <div
        className="rounded-xl border border-white/[0.06] bg-zinc-900/30 hover:bg-zinc-900/50 hover:border-white/[0.09] overflow-hidden cursor-pointer transition-colors"
        onClick={() => setOpen(o => !o)}
        role="button"
        aria-expanded={open}
      >
        <div className="flex items-center justify-between px-5 py-4">
          <p className="text-[14px] font-medium text-zinc-100 pr-4 leading-snug">{q}</p>
          <ChevronDown
            className="w-4 h-4 text-zinc-500 shrink-0 transition-transform duration-300"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </div>
        {open && (
          <div className="px-5 pb-5 pt-0 border-t border-white/[0.05]">
            <p className="text-zinc-400 text-[13.5px] leading-relaxed pt-4">{a}</p>
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
      title: "Real-time AI voice tutor",
      desc: "Speak naturally; get instant vocal explanations powered by CAMB AI & ElevenLabs synthesis.",
      tags: ["Voice synthesis", "Low latency"],
    },
    {
      icon: FlaskConical,
      title: "2D physics visual lab",
      desc: "Run kinetic simulations — projectiles, waves, orbits — side-by-side with your study chat.",
      tags: ["Canvas 2D", "Interactive HUD"],
    },
    {
      icon: BookOpen,
      title: "100% CAPS aligned",
      desc: "Engineered for South African Grade 10–12 Physical Sciences and Chemistry curricula.",
      tags: ["CAPS curriculum", "SA focused"],
    },
    {
      icon: FileText,
      title: "Semantic notes vault",
      desc: "AI-generated study guides with LaTeX math, worked examples, and branded PDF exports.",
      tags: ["LaTeX", "PDF export"],
    },
  ];

  const stats = [
    { value: 90,  suffix: ' ms', label: "Inference latency",       icon: Cpu },
    { value: 98,  suffix: '%',   label: "Trajectory fidelity",     icon: Award },
    { value: 100, suffix: '%',   label: "CAPS match",              icon: ShieldCheck },
    { value: 5,   suffix: '+',   label: "Live simulations",        icon: FlaskConical },
  ];

  const faqs = [
    { q: "Is Vector AI aligned with the South African CAPS curriculum?", a: "Yes, 100%. All content is calibrated against CAPS guidelines for Grade 10–12 Physical Sciences and Chemistry." },
    { q: "How does the AI voice tutor work?", a: "Press mic, speak your question. The system transcribes, processes intent, matches a physics simulation, then synthesises a spoken response in real time." },
    { q: "Can I use Vector AI offline?", a: "Your saved notes and flashcards are cached locally and sync back to the cloud when you reconnect." },
    { q: "How do I generate comprehensive study guides?", a: "Navigate to Study Notes, type any CAPS topic (e.g. 'Projectile Motion'), and hit Generate. The AI writes a full guide with formulas and worked examples." },
  ];

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-zinc-950 text-zinc-100 font-sans antialiased">
      {/* Ambient */}
      <div
        className="absolute inset-0 pointer-events-none z-0 opacity-[0.35]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 50% at 50% 10%, black 30%, transparent 80%)',
          maskImage: 'radial-gradient(ellipse 80% 50% at 50% 10%, black 30%, transparent 80%)',
        }}
      />
      <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-emerald-500/[0.10] blur-[140px] pointer-events-none z-0" />
      <div className="absolute top-[55%] right-[10%] w-[340px] h-[340px] rounded-full bg-teal-500/[0.06] blur-[100px] pointer-events-none z-0" />

      {/* Navbar */}
      <header className="sticky top-0 z-50 px-4 pt-4">
        <nav className="mx-auto max-w-6xl flex items-center justify-between rounded-xl border border-white/[0.07] bg-zinc-950/70 backdrop-blur-xl px-4 py-2.5 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.6)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-[0_4px_12px_-2px_rgba(16,185,129,0.5)]">
              <Zap className="w-4 h-4 text-zinc-950" strokeWidth={2.75} />
            </div>
            <div className="leading-none">
              <span className="font-semibold text-[14px] tracking-tight block text-zinc-50">Vector AI</span>
              <span className="text-[9.5px] tracking-[0.18em] text-emerald-400/90 font-medium uppercase block mt-0.5">STEM OS</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="landing-signin-btn"
              onClick={go}
              className="hidden sm:inline-flex items-center px-3 py-1.5 text-[13px] font-medium text-zinc-300 hover:text-zinc-50 transition-colors cursor-pointer"
            >
              Sign in
            </button>
            <button
              id="landing-cta-btn"
              onClick={go}
              className="group inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-50 text-zinc-950 text-[13px] font-semibold hover:bg-white transition-all shadow-sm cursor-pointer"
            >
              Get started
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" strokeWidth={2.5} />
            </button>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative z-10 px-6 pt-24 pb-28 text-center max-w-4xl mx-auto flex flex-col items-center">
        <Reveal>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-7 rounded-full bg-emerald-500/[0.08] border border-emerald-500/15">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-300 font-medium text-[11.5px] tracking-wide">AI-accelerated Physical Science</span>
          </div>
        </Reveal>

        <h1
          className="font-semibold tracking-[-0.025em] leading-[1.02] mb-6 text-zinc-50"
          style={{ fontSize: 'clamp(2.4rem, 7vw, 4.75rem)' }}
        >
          <Reveal delay={80}>Master physical science,</Reveal>
          <Reveal delay={180}>
            <span className="block bg-gradient-to-r from-emerald-300 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
              intelligently.
            </span>
          </Reveal>
        </h1>

        <Reveal delay={280}>
          <p className="text-zinc-400 text-[15px] sm:text-[16px] leading-relaxed max-w-xl mb-10">
            South Africa's CAPS-aligned tutoring platform. Interactive 2D simulations, real-time voice tutoring, and semantic study notes — engineered for matric mastery.
          </p>
        </Reveal>

        <Reveal delay={380}>
          <div className="flex flex-col sm:flex-row items-center gap-3 mb-16">
            <button
              id="hero-launch-btn"
              onClick={go}
              className="group flex items-center gap-2 px-6 py-3 font-semibold rounded-lg text-[14px] cursor-pointer bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-all shadow-[0_12px_32px_-12px_rgba(16,185,129,0.6)] hover:shadow-[0_16px_40px_-12px_rgba(16,185,129,0.7)] hover:-translate-y-0.5"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Launch Vector AI
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" strokeWidth={2.5} />
            </button>
            <p className="text-zinc-500 text-[12.5px]">Free · No credit card required</p>
          </div>
        </Reveal>

        {/* Stats strip */}
        <Reveal delay={500} className="w-full">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.05] rounded-xl overflow-hidden border border-white/[0.06] max-w-3xl mx-auto">
            {stats.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="bg-zinc-950/80 px-5 py-5 text-center">
                  <Icon className="w-3.5 h-3.5 text-emerald-400/80 mx-auto mb-2.5" strokeWidth={1.8} />
                  <div className="text-[22px] font-semibold tracking-tight text-zinc-50 tabular-nums">
                    <Counter end={s.value} suffix={s.suffix} />
                  </div>
                  <div className="text-[11px] text-zinc-500 font-medium mt-1">{s.label}</div>
                </div>
              );
            })}
          </div>
        </Reveal>
      </section>

      {/* Features */}
      <section className="relative z-10 py-24 px-6 border-t border-white/[0.05]">
        <div className="max-w-6xl mx-auto">
          <Reveal className="text-center mb-14">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 mb-4 rounded-full bg-white/[0.04] border border-white/[0.06] text-zinc-400 text-[11px] font-medium">
              <Sparkles className="w-3 h-3 text-emerald-400" strokeWidth={2.25} />
              What's inside
            </div>
            <h2 className="text-[32px] sm:text-[40px] font-semibold tracking-tight text-zinc-50">
              Built for <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">STEM mastery</span>
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <Reveal key={i} delay={i * 80}>
                  <div className="group relative p-7 rounded-2xl border border-white/[0.06] bg-zinc-900/30 hover:bg-zinc-900/60 hover:border-emerald-500/20 transition-all duration-300 overflow-hidden h-full">
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/[0.08] border border-emerald-500/15 flex items-center justify-center text-emerald-400 mb-5 transition-all group-hover:scale-105">
                      <Icon className="w-[18px] h-[18px]" strokeWidth={1.8} />
                    </div>
                    <h3 className="text-[17px] font-semibold tracking-tight text-zinc-50 mb-2">{f.title}</h3>
                    <p className="text-zinc-400 text-[13.5px] leading-relaxed mb-5">{f.desc}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {f.tags.map((tag, j) => (
                        <span key={j} className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.05] text-zinc-400">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Highlight */}
      <section className="relative z-10 py-20 px-6 border-t border-white/[0.05]">
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <Reveal>
            <div className="rounded-2xl px-8 py-12 border border-white/[0.06] bg-gradient-to-br from-emerald-500/[0.06] via-zinc-900/40 to-teal-500/[0.04]">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 mb-5 rounded-full bg-emerald-500/[0.08] border border-emerald-500/15 text-emerald-300 text-[11px] font-medium">
                <ShieldCheck className="w-3 h-3" strokeWidth={2.25} />
                CAPS certified
              </div>
              <h2 className="text-[26px] sm:text-[32px] font-semibold tracking-tight leading-tight mb-4 text-zinc-50">
                The only AI platform <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">purpose-built</span> for SA matric physics.
              </h2>
              <p className="text-zinc-400 text-[14px] leading-relaxed max-w-xl mx-auto">
                Every formula, every concept, every simulation is verified against the official CAPS curriculum for Grade 10, 11, and 12 — no guesswork, no off-syllabus content.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative z-10 py-24 px-6 border-t border-white/[0.05]">
        <div className="max-w-3xl mx-auto">
          <Reveal className="text-center mb-12">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 mb-4 rounded-full bg-white/[0.04] border border-white/[0.06] text-zinc-400 text-[11px] font-medium">
              <Sparkles className="w-3 h-3 text-emerald-400" strokeWidth={2.25} />
              Questions
            </div>
            <h2 className="text-[30px] font-semibold tracking-tight text-zinc-50">
              Got questions? <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">Answered.</span>
            </h2>
          </Reveal>
          <div className="space-y-2.5">
            {faqs.map((faq, i) => (
              <FaqItem key={i} q={faq.q} a={faq.a} delay={i * 60} />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-12 text-center border-t border-white/[0.05]">
        <Reveal>
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
              <Zap className="w-3 h-3 text-zinc-950" strokeWidth={2.75} />
            </div>
            <span className="font-semibold text-[13px] tracking-tight text-zinc-200">Vector AI</span>
            <span className="text-[9.5px] tracking-[0.18em] text-emerald-400/80 uppercase border border-emerald-500/15 rounded-full px-2 py-0.5">STEM OS</span>
          </div>
          <p className="text-zinc-500 text-[12px] mb-1">AI-accelerated learning — built by Taro Mukhalela</p>
          <p className="text-zinc-700 text-[10.5px] tracking-wider">© {new Date().getFullYear()} Vector AI. All rights reserved.</p>
        </Reveal>
      </footer>
    </div>
  );
};

export default Landing;
