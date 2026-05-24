import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ArrowRight, Mic, FlaskConical, BookOpen, FileText,
  ChevronDown, Cpu, Sparkles, Award, ShieldCheck, Zap, Play
} from 'lucide-react';

/* ── Floating particles (CSS-driven) ── */
const Particles = () => {
  const dots = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    size: 1.5 + Math.random() * 2.5,
    duration: 12 + Math.random() * 20,
    delay: Math.random() * 15,
    opacity: 0.25 + Math.random() * 0.35,
  }));
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {dots.map(d => (
        <span
          key={d.id}
          className="particle"
          style={{
            left: d.left,
            bottom: '-10px',
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
const Counter = ({ end, suffix = '', duration = 2000 }) => {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        const start = performance.now();
        const tick = (now) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
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

/* ── Reveal-on-scroll wrapper ── */
const Reveal = ({ children, className = '', delay = 0 }) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.15 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity .7s cubic-bezier(.4,0,.2,1) ${delay}ms, transform .7s cubic-bezier(.4,0,.2,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};

const Landing = ({ onNavigate }) => {
  const { isAuthenticated } = useAuth();
  const go = () => onNavigate(isAuthenticated ? 'chat' : 'auth');

  const features = [
    { icon: Mic,          title: "Real-Time AI Voice Tutor",  desc: "Speak naturally and get instant vocal explanations with CAMB AI & ElevenLabs synthesis.", tags: ["Voice Synthesis", "Low Latency"] },
    { icon: FlaskConical, title: "2D Physics Visual Lab",     desc: "Run kinetic simulations — projectiles, waves, orbits — side-by-side with your study chat.", tags: ["Canvas 2D", "Interactive HUD"] },
    { icon: BookOpen,     title: "100% CAPS Aligned",         desc: "Built for South African Grade 10-12 Physical Sciences and Chemistry curricula.",             tags: ["CAPS Curriculum", "SA Focused"] },
    { icon: FileText,     title: "Semantic Notes Vault",      desc: "AI-generated study guides with LaTeX math, worked examples, and branded PDF exports.",       tags: ["LaTeX", "PDF Export"] },
  ];

  const stats = [
    { value: 14,  suffix: ' ms', label: "Inference Latency",      icon: Cpu },
    { value: 98,  suffix: '%',   label: "Lab Trajectory Fidelity", icon: Award },
    { value: 100, suffix: '%',   label: "CAPS Curriculum Match",   icon: ShieldCheck },
    { value: 12,  suffix: '+',   label: "Interactive Simulations", icon: FlaskConical },
  ];

  const faqs = [
    { q: "Is Vector AI aligned with the South African curriculum?", a: "Yes, 100%. All content follows CAPS guidelines for Grade 10-12 Physical Sciences." },
    { q: "How does the AI voice tutor work?", a: "Press the mic, speak naturally. The system transcribes, processes, matches physics simulations, and speaks back." },
    { q: "Can I use Vector AI offline?", a: "Yes! Your notes and flashcards sync back to the cloud when you reconnect." },
    { q: "How do I generate study guides?", a: "In Study Notes, type a topic and click Generate. The AI writes a full guide with formulas and examples." },
  ];

  return (
    <div className="relative min-h-[100vh] h-auto overflow-x-hidden overflow-y-auto bg-zinc-950 text-zinc-100 font-sans select-none">

      {/* ─── Ambient Background ─── */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_60%,transparent_100%)] pointer-events-none z-0" />
      <Particles />

      {/* Orbs */}
      <div className="absolute top-[15%] right-[5%] w-[500px] h-[500px] rounded-full bg-emerald-500/[.07] blur-[120px] pointer-events-none anim-float-slow" />
      <div className="absolute bottom-[20%] left-[5%] w-[400px] h-[400px] rounded-full bg-teal-500/[.05] blur-[140px] pointer-events-none anim-float" />
      <div className="absolute top-[60%] right-[30%] w-[250px] h-[250px] rounded-full bg-cyan-500/[.04] blur-[100px] pointer-events-none anim-float-slow" style={{ animationDelay: '3s' }} />

      {/* ─── Navbar ─── */}
      <header className="sticky top-0 z-50 mx-3 mt-3 rounded-2xl backdrop-blur-xl bg-zinc-950/60 border border-zinc-800/40 px-6 py-3 flex items-center justify-between anim-fade-down shadow-xl shadow-black/20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-emerald-500/30 anim-glow">V</div>
          <div>
            <span className="font-extrabold text-sm tracking-tight block leading-none">Vector AI</span>
            <span className="text-[9px] tracking-[.2em] text-emerald-500 font-bold uppercase block mt-0.5">STEM OS</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={go} className="px-4 py-2 text-sm font-semibold text-zinc-400 hover:text-white transition-all cursor-pointer">Sign In</button>
          <button onClick={go} className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs tracking-wider uppercase shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all cursor-pointer">
            Get Started
          </button>
        </div>
      </header>

      {/* ─── HERO ─── */}
      <section className="relative z-10 px-6 pt-24 pb-28 text-center max-w-5xl mx-auto flex flex-col items-center">
        {/* Badge */}
        <div className="anim-fade-up d-100 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/25 bg-emerald-500/[.08] text-emerald-400 font-semibold text-[11px] tracking-widest uppercase mb-8 anim-border-glow">
          <Sparkles className="w-3.5 h-3.5" />
          AI-Accelerated Physics
        </div>

        {/* Title */}
        <h1 className="anim-fade-up d-200 font-black text-4xl sm:text-6xl md:text-7xl tracking-tight leading-[1.08] uppercase mb-8">
          Master Physical Science,<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 anim-gradient drop-shadow-[0_0_40px_rgba(16,185,129,0.25)]">
            Conveniently
          </span>
        </h1>

        {/* Subtitle */}
        <p className="anim-fade-up d-400 text-zinc-400 text-base sm:text-lg leading-relaxed max-w-2xl mb-14">
          South Africa's premium CAPS-aligned platform made by a teenager. Interactive 2D simulations, real-time speech tutoring, and semantic notes — fused to unlock physical science mastery.
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-4xl mb-14">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <Reveal key={i} delay={i * 100} className="p-5 rounded-2xl border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-sm text-center hover-lift group">
                <div className="w-9 h-9 rounded-xl bg-zinc-800/70 flex items-center justify-center mx-auto mb-3 text-emerald-400 group-hover:bg-emerald-500/15 transition-colors">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="font-black text-xl text-emerald-400">
                  <Counter end={s.value} suffix={s.suffix} />
                </div>
                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1.5">{s.label}</div>
              </Reveal>
            );
          })}
        </div>

        {/* CTA */}
        <Reveal delay={500}>
          <button onClick={go} className="group flex items-center gap-2.5 px-10 py-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl tracking-wider uppercase text-sm shadow-xl shadow-emerald-500/15 hover:shadow-emerald-500/30 hover:-translate-y-1 transition-all cursor-pointer">
            <Play className="w-4 h-4 fill-current" />
            Launch Vector AI
            <ArrowRight className="w-4 h-4 stroke-[3px] group-hover:translate-x-1 transition-transform" />
          </button>
        </Reveal>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="relative z-10 py-24 px-6 border-t border-zinc-800/40">
        <div className="max-w-6xl mx-auto">
          <Reveal className="text-center mb-16">
            <h2 className="text-[11px] font-bold text-emerald-400 uppercase tracking-[.2em] mb-3 flex items-center justify-center gap-2">
              <Zap className="w-3.5 h-3.5" /> App Features
            </h2>
            <h3 className="text-3xl sm:text-4xl font-black uppercase tracking-wide">Features</h3>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <Reveal key={i} delay={i * 120}>
                  <div className="p-8 rounded-2xl border border-zinc-800/50 bg-zinc-900/30 backdrop-blur-sm hover:border-emerald-500/30 hover:bg-zinc-900/60 transition-all group duration-300 hover-lift">
                    <div className="w-12 h-12 rounded-xl border border-zinc-800 bg-zinc-800/50 flex items-center justify-center text-emerald-400 group-hover:border-emerald-500/40 group-hover:shadow-lg group-hover:shadow-emerald-500/15 transition-all mb-6">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h4 className="font-extrabold text-base sm:text-lg uppercase tracking-wider mb-2">{f.title}</h4>
                    <p className="text-zinc-400 text-sm leading-relaxed mb-5">{f.desc}</p>
                    <div className="flex gap-2">
                      {f.tags.map((tag, j) => (
                        <span key={j} className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-emerald-500/15 bg-emerald-500/[.06] text-emerald-400">{tag}</span>
                      ))}
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="relative z-10 py-24 px-6 border-t border-zinc-800/40">
        <div className="max-w-4xl mx-auto">
          <Reveal className="text-center mb-16">
            <h2 className="text-[11px] font-bold text-emerald-400 uppercase tracking-[.2em] mb-3">FAQ</h2>
            <h3 className="text-3xl font-black uppercase tracking-wide">Common Inquiries</h3>
          </Reveal>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <Reveal key={i} delay={i * 80}>
                <details className="group border border-zinc-800/50 rounded-2xl bg-zinc-900/20 overflow-hidden [&_summary::-webkit-details-marker]:hidden hover-lift">
                  <summary className="flex items-center justify-between p-5 text-left font-bold text-sm uppercase tracking-wider cursor-pointer hover:bg-zinc-900/40 select-none transition-colors">
                    {faq.q}
                    <ChevronDown className="w-4 h-4 text-zinc-500 group-open:rotate-180 transition-transform duration-300 shrink-0 ml-4" />
                  </summary>
                  <div className="px-5 pb-5 pt-1 text-zinc-400 text-sm leading-relaxed border-t border-zinc-800/30">{faq.a}</div>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="relative z-10 border-t border-zinc-800/40 px-6 py-14 text-center">
        <Reveal>
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-black text-xs">V</div>
            <span className="font-extrabold text-sm tracking-tight">Vector AI</span>
          </div>
          <p className="text-zinc-500 text-xs tracking-wider mb-1">AI-Accelerated Learning — Developed by Taro Mukhalela</p>
          <p className="text-zinc-600 text-[10px] tracking-wider">© {new Date().getFullYear()} Vector AI. All Rights Reserved.</p>
        </Reveal>
      </footer>
    </div>
  );
};

export default Landing;
