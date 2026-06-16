import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ArrowRight, Mic, FlaskConical, BookOpen, FileText,
  ChevronDown, Cpu, Sparkles, Award, ShieldCheck, Zap, Play
} from 'lucide-react';

/* ── Floating Orbs ── */
const FloatingOrbs = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
    <div className="orb absolute top-[10%] left-[10%] w-[400px] h-[400px] bg-emerald-500/10 blur-[120px] anim-float-slow" />
    <div className="orb absolute bottom-[20%] right-[5%] w-[350px] h-[350px] bg-emerald-500/10 blur-[100px] anim-float" style={{ animationDelay: '-3s' }} />
    <div className="orb absolute top-[40%] right-[15%] w-[300px] h-[300px] bg-emerald-600/5 blur-[140px] anim-float-slow" style={{ animationDelay: '-5s' }} />
  </div>
);

/* ── Particle System ── */
const Particles = () => {
  const [particles, setParticles] = useState([]);
  useEffect(() => {
    const count = 25;
    const newParticles = Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      bottom: `-${Math.random() * 20}%`,
      duration: `${10 + Math.random() * 15}s`,
      delay: `${Math.random() * 10}s`,
      opacity: 0.1 + Math.random() * 0.4,
      size: `${1 + Math.random() * 3}px`
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map(p => (
        <div 
          key={p.id}
          className="particle bg-emerald-400"
          style={{
            left: p.left,
            bottom: p.bottom,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            animationDuration: p.duration,
            animationDelay: p.delay
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

const Reveal = ({ children, className = '', delay = 0, variant = 'from-bottom' }) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.12 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const getTransform = () => {
    if (visible) return 'translate(0, 0)';
    switch (variant) {
      case 'from-left': return 'translateX(-40px)';
      case 'from-right': return 'translateX(40px)';
      case 'from-bottom': default: return 'translateY(20px)';
    }
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: getTransform(),
        transition: `opacity .8s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform .8s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
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
        className="rounded-xl border border-white/[0.06] bg-zinc-900/30 hover:bg-zinc-900/50 hover:border-white/[0.09] overflow-hidden cursor-pointer transition-all duration-300"
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
        <div 
          className="transition-all duration-500 ease-in-out overflow-hidden"
          style={{ maxHeight: open ? '200px' : '0' }}
        >
          <div className="px-5 pb-5 pt-0 border-t border-white/[0.05]">
            <p className="text-zinc-400 text-[13.5px] leading-relaxed pt-4">{a}</p>
          </div>
        </div>
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
      <FloatingOrbs />
      <Particles />

      {/* Grid Overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-0 opacity-[0.2]"
        style={{
          backgroundImage: 'linear-gradient(rgba(16,185,129,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.05) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          WebkitMaskImage: 'radial-gradient(ellipse 60% 40% at 50% 10%, black 20%, transparent 80%)',
          maskImage: 'radial-gradient(ellipse 60% 40% at 50% 10%, black 20%, transparent 80%)',
        }}
      />

      {/* Navbar */}
      <header className="sticky top-0 z-50 px-4 pt-4">
        <nav className="mx-auto max-w-6xl flex items-center justify-between rounded-xl border border-white/[0.07] bg-zinc-950/70 backdrop-blur-xl px-4 py-2.5 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.6)] anim-fade-down">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-[0_4px_12px_-2px_rgba(16,185,129,0.5)] anim-glow">
              <Zap className="w-4 h-4 text-zinc-950" strokeWidth={2.75} />
            </div>
            <div className="leading-none">
              <span className="font-semibold text-[14px] tracking-tight block text-zinc-50">Vector AI</span>
              <span className="text-[9.5px] tracking-[0.18em] text-emerald-400/90 font-medium uppercase block mt-0.5">STEM OS</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={go}
              className="hidden sm:inline-flex items-center px-3 py-1.5 text-[13px] font-medium text-zinc-300 hover:text-zinc-50 transition-colors cursor-pointer"
            >
              Sign in
            </button>
            <button
              onClick={go}
              className="group inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 text-zinc-950 text-[13px] font-bold hover:bg-emerald-400 transition-all shadow-lg hover:shadow-emerald-500/20 cursor-pointer"
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
          <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-7 rounded-full bg-emerald-500/[0.08] border border-emerald-500/15 anim-breathe">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-300 font-medium text-[11.5px] tracking-wide">AI-accelerated Physical Science</span>
          </div>
        </Reveal>

        <h1
          className="font-semibold tracking-[-0.025em] leading-[1.02] mb-6 text-zinc-50"
          style={{ fontSize: 'clamp(2.4rem, 7vw, 4.75rem)' }}
        >
          <Reveal delay={100}>Master physical science,</Reveal>
          <Reveal delay={250}>
            <span className="block bg-gradient-to-r from-emerald-300 to-emerald-400 bg-clip-text text-transparent">
              intelligently.
            </span>
          </Reveal>
        </h1>

        <Reveal delay={400}>
          <p className="text-zinc-400 text-[15px] sm:text-[16px] leading-relaxed max-w-xl mb-10">
            South Africa's CAPS-aligned tutoring platform. Interactive 2D simulations, real-time voice tutoring, and semantic study notes — engineered for matric mastery.
          </p>
        </Reveal>

        <Reveal delay={550}>
          <div className="flex flex-col sm:flex-row items-center gap-3 mb-16">
            <button
              onClick={go}
              className="group flex items-center gap-2 px-6 py-3 font-bold rounded-lg text-[14px] cursor-pointer bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-all shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-0.5 anim-glow"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Launch Vector AI
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" strokeWidth={2.5} />
            </button>
            <p className="text-zinc-500 text-[12.5px] font-medium">Free · No credit card required</p>
          </div>
        </Reveal>

        {/* Stats strip */}
        <Reveal delay={700} className="w-full">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.05] rounded-xl overflow-hidden border border-white/[0.06] max-w-3xl mx-auto shadow-2xl">
            {stats.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="bg-zinc-950/80 px-5 py-5 text-center group hover:bg-zinc-900/50 transition-colors">
                  <Icon className="w-3.5 h-3.5 text-emerald-400/80 mx-auto mb-2.5 transition-transform group-hover:scale-110" strokeWidth={1.8} />
                  <div className="text-[22px] font-bold tracking-tight text-zinc-50 tabular-nums">
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
            <h2 className="text-[32px] sm:text-[40px] font-bold tracking-tight text-zinc-50">
              Built for <span className="bg-gradient-to-r from-emerald-300 to-emerald-400 bg-clip-text text-transparent">STEM mastery</span>
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <Reveal key={i} delay={i * 100} variant={i % 2 === 0 ? 'from-left' : 'from-right'}>
                  <div className="group relative p-7 rounded-2xl border border-white/[0.06] bg-zinc-900/30 hover:bg-zinc-900/60 hover:border-emerald-500/20 transition-all duration-300 overflow-hidden h-full shadow-lg hover:shadow-emerald-500/5">
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/[0.08] border border-emerald-500/15 flex items-center justify-center text-emerald-400 mb-5 transition-all group-hover:scale-110 group-hover:bg-emerald-500/20">
                      <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
                    </div>
                    <h3 className="text-[17px] font-bold tracking-tight text-zinc-50 mb-2">{f.title}</h3>
                    <p className="text-zinc-400 text-[13.5px] leading-relaxed mb-5">{f.desc}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {f.tags.map((tag, j) => (
                        <span key={j} className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.05] text-zinc-400 group-hover:text-emerald-400/80 transition-colors">
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
            <div className="rounded-[32px] px-8 py-14 border border-white/[0.06] bg-gradient-to-br from-emerald-500/[0.1] via-zinc-950 to-emerald-500/10 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 mb-5 rounded-full bg-emerald-500/[0.08] border border-emerald-500/15 text-emerald-300 text-[11px] font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" strokeWidth={2.5} />
                CAPS certified
              </div>
              <h2 className="text-[28px] sm:text-[36px] font-bold tracking-tight leading-tight mb-6 text-zinc-50">
                The only AI platform <span className="bg-gradient-to-r from-emerald-300 to-emerald-400 bg-clip-text text-transparent">purpose-built</span> for SA matric physics.
              </h2>
              <p className="text-zinc-400 text-[15px] leading-relaxed max-w-xl mx-auto">
                Every formula, every concept, every simulation is verified against the official CAPS curriculum for Grade 10, 11, and 12 — no guesswork, no off-syllabus content.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Maker's Story */}
      <section className="relative z-10 py-24 px-6 border-t border-white/[0.05] overflow-hidden">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-16">
          <Reveal variant="from-left" className="flex-1">
            <div className="relative">
              <div className="absolute -inset-4 bg-emerald-500/20 blur-2xl rounded-full opacity-50 anim-glow" />
              <div className="relative rounded-3xl border border-white/[0.1] bg-zinc-900/40 p-4 sm:p-6 backdrop-blur-md shadow-2xl">
                <div className="aspect-square w-full rounded-2xl bg-zinc-800 flex items-center justify-center overflow-hidden">
                   {/* Placeholder for Taro's photo or a cool avatar */}
                   <div className="flex flex-col items-center gap-4 text-center px-8">
                     <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <Cpu className="w-10 h-10 text-emerald-400" strokeWidth={1.5} />
                     </div>
                     <div>
                        <h3 className="text-[18px] font-bold text-zinc-50">Taro Mukhalela</h3>
                        <p className="text-emerald-400 text-[12px] font-bold uppercase tracking-[0.2em] mt-1">Founder & Developer</p>
                     </div>
                   </div>
                </div>
                <div className="mt-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-px bg-emerald-500/40" />
                    <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Loding, Mpumalanga</span>
                  </div>
                  <p className="text-zinc-300 text-[14px] italic leading-relaxed">
                    "I believe AI shouldn't just answer questions, it should build intuition. Vector AI is my contribution to making STEM education more visual and accessible for every South African student."
                  </p>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal variant="from-right" className="flex-[1.2]">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-emerald-500/[0.08] border border-emerald-500/15 text-emerald-300 text-[11px] font-bold uppercase tracking-wider">
              Meet the Maker
            </div>
            <h2 className="text-[36px] sm:text-[48px] font-bold tracking-tight text-zinc-50 leading-tight mb-8">
              A 14-year-old developer with a <span className="bg-gradient-to-r from-emerald-300 to-emerald-400 bg-clip-text text-transparent">massive vision.</span>
            </h2>
            <div className="space-y-6 text-zinc-400 text-[16px] leading-relaxed">
              <p>
                Based in <span className="text-zinc-100 font-semibold">Loding, Mpumalanga</span>, Taro Mukhalela is a self-taught web developer on a mission to democratise high-quality STEM education. 
              </p>
              <p>
                Frustrated by the lack of interactive tools for the South African CAPS curriculum, Taro spent his after-school hours engineering Vector AI — a platform that combines state-of-the-art Large Language Models with real-time physics simulations.
              </p>
              <p>
                Vector AI isn't just an app; it's a testament to what's possible when passion meets code. It's built for students, by a student who understands exactly what it takes to master matric physical science.
              </p>
            </div>
            <div className="mt-10 flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-[13px] font-bold text-zinc-300">
                <Zap className="w-4 h-4 text-emerald-400" />
                100% Student Built
              </div>
              <div className="flex items-center gap-2 text-[13px] font-bold text-zinc-300">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Mpumalanga Pride
              </div>
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
            <h2 className="text-[30px] font-bold tracking-tight text-zinc-50">
              Got questions? <span className="bg-gradient-to-r from-emerald-300 to-emerald-400 bg-clip-text text-transparent">Answered.</span>
            </h2>
          </Reveal>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <FaqItem key={i} q={faq.q} a={faq.a} delay={i * 80} />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-16 text-center border-t border-white/[0.05] bg-zinc-950">
        <Reveal>
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <Zap className="w-3 h-3 text-zinc-950" strokeWidth={2.75} />
            </div>
            <span className="font-bold text-[14px] tracking-tight text-zinc-200">Vector AI</span>
            <span className="text-[9.5px] tracking-[0.18em] text-emerald-400/80 font-bold uppercase border border-emerald-500/15 rounded-full px-2 py-0.5">STEM OS</span>
          </div>
          <p className="text-zinc-400 text-[13px] mb-1 font-medium">AI-accelerated learning — built by Taro Mukhalela</p>
          <p className="text-zinc-600 text-[11px] tracking-wider uppercase font-bold opacity-50">© {new Date().getFullYear()} Vector AI. All rights reserved.</p>
        </Reveal>
      </footer>
    </div>
  );
};

export default Landing;
