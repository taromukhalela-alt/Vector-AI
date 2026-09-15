import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ArrowRight,
  Mic,
  FlaskConical,
  BookOpen,
  FileText,
  ChevronDown,
  Cpu,
  ShieldCheck,
  Play,
  Brain,
  Atom,
  Zap,
  GraduationCap,
  Check,
  CircleDot,
} from 'lucide-react';

// The hero backdrop is the only consumer of three.js on this page, so it is
// split out and fetched after the first paint instead of blocking it.
const GridDistortion = lazy(() => import('../components/GridDistortion'));

// Placeholder for the deferred backdrop. Same depth and hue family as the
// shader so the swap is not visible as a "pop in".
const HeroBackdropFallback = () => (
  <div
    className="absolute inset-0"
    aria-hidden="true"
    style={{
      background:
        'radial-gradient(ellipse 80% 60% at 50% 30%, rgba(16,185,129,0.10) 0%, rgba(7,9,8,0.90) 55%, rgba(7,9,8,1) 100%)',
    }}
  />
);

/* ─────────────────────────────────────────────────────────────
  Ambient background
───────────────────────────────────────────────────────────── */

const ScientificBackground = () => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden">
    {/* Subtle radial glow — kept very dim so it doesn't dominate */}
    <div className="absolute left-1/2 top-[-18rem] h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-emerald-500/[0.05] blur-[140px]" />

    {/* Single faint grid — masked to top half only */}
    <div
      className="absolute inset-0 opacity-[0.09]"
      style={{
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
        backgroundSize: '64px 64px',
        maskImage:
          'radial-gradient(ellipse 75% 48% at 50% 0%, black 5%, transparent 78%)',
        WebkitMaskImage:
          'radial-gradient(ellipse 75% 48% at 50% 0%, black 5%, transparent 78%)',
      }}
    />
  </div>
);

/* ─────────────────────────────────────────────────────────────
   Small UI primitives
───────────────────────────────────────────────────────────── */

const Reveal = ({ children, className = '', delay = 0, variant = 'from-bottom' }) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const transform = visible
    ? 'translate3d(0,0,0)'
    : variant === 'from-left'
      ? 'translate3d(-24px,0,0)'
      : variant === 'from-right'
        ? 'translate3d(24px,0,0)'
        : 'translate3d(0,18px,0)';

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform,
        transition: `opacity .7s cubic-bezier(.16,1,.3,1) ${delay}ms, transform .7s cubic-bezier(.16,1,.3,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};

const Eyebrow = ({ children }) => (
  <div className="mb-5 inline-flex items-center rounded-full border border-emerald-400/20 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-emerald-400/70">
    {children}
  </div>
);

const ArrowButton = ({ children, onClick, secondary = false }) => (
  <button
    onClick={onClick}
    className={
      secondary
        ? 'group inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-[13px] font-medium text-zinc-300 transition-all duration-200 hover:border-white/[0.14] hover:bg-white/[0.06] hover:text-white'
        : 'group inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 text-[13px] font-semibold text-zinc-950 shadow-[0_4px_20px_rgba(52,211,153,.25)] transition-all duration-200 hover:-translate-y-px hover:bg-emerald-300 hover:shadow-[0_6px_24px_rgba(52,211,153,.35)]'
    }
  >
    {children}
    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
  </button>
);

/* ─────────────────────────────────────────────────────────────
   Product preview
───────────────────────────────────────────────────────────── */

const PhysicsPreview = () => (
  <div className="relative mx-auto mt-14 w-full max-w-5xl">
    <div className="absolute -inset-8 rounded-[3rem] bg-emerald-500/[0.06] blur-3xl" />

    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0b0d0c] shadow-[0_35px_100px_-35px_rgba(0,0,0,.9)]">
      <div className="flex h-11 items-center justify-between border-b border-white/[0.07] px-4">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="h-2 w-2 rounded-full bg-white/15" />
            <span className="h-2 w-2 rounded-full bg-white/15" />
            <span className="h-2 w-2 rounded-full bg-white/15" />
          </div>
          <span className="ml-2 text-[10px] font-medium text-zinc-500">Vector AI / Physics Lab</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Simulation ready
        </div>
      </div>

      <div className="grid min-h-[330px] md:grid-cols-[1fr_280px]">
        <div className="relative border-b border-white/[0.07] p-5 md:border-b-0 md:border-r">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-zinc-200">Projectile Motion</p>
              <p className="mt-1 text-[9px] text-zinc-600">Interactive simulation</p>
            </div>
            <div className="rounded-md border border-white/[0.07] bg-white/[0.025] px-2 py-1 text-[9px] text-zinc-500">
              2D
            </div>
          </div>

          <div
            className="relative h-[235px] overflow-hidden rounded-xl border border-white/[0.06] bg-[#080a09]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px)',
              backgroundSize: '36px 36px',
            }}
          >
            <div className="absolute bottom-8 left-8 right-8 h-px bg-white/10" />
            <div className="absolute bottom-8 left-8 top-8 w-px bg-white/10" />

            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 700 300" preserveAspectRatio="none">
              <path
                d="M55 245 C180 55 390 65 610 235"
                fill="none"
                stroke="rgba(52,211,153,.7)"
                strokeWidth="2"
                strokeDasharray="7 7"
              />
              <circle cx="55" cy="245" r="7" fill="#34d399" />
              <circle cx="610" cy="235" r="6" fill="#34d399" opacity=".8" />
              <line x1="55" y1="245" x2="130" y2="155" stroke="rgba(52,211,153,.5)" strokeWidth="2" />
              <polygon points="130,155 119,159 125,168" fill="rgba(52,211,153,.7)" />
            </svg>

            <div className="absolute bottom-3 left-10 text-[8px] text-zinc-700">x / displacement</div>
            <div className="absolute left-2 top-9 -rotate-90 text-[8px] text-zinc-700">y / height</div>
          </div>

          <div className="mt-3 flex items-center justify-between text-[9px] text-zinc-600">
            <span>t = 1.84 s</span>
            <span>g = 9.81 m/s²</span>
            <span>Scale 1:10</span>
          </div>
        </div>

        <div className="p-5">
          <div className="mb-5 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-400">
              <Brain className="h-3.5 w-3.5" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-zinc-200">AI Tutor</p>
              <p className="text-[8px] text-zinc-600">Guided explanation</p>
            </div>
          </div>

          <p className="text-[11px] leading-relaxed text-zinc-400">
            “The horizontal velocity remains constant because there is no horizontal force acting on the projectile.”
          </p>

          <div className="my-5 h-px bg-white/[0.06]" />

          <div className="space-y-3">
            {[
              ['Initial velocity', '24.5 m/s'],
              ['Launch angle', '42°'],
              ['Maximum height', '13.7 m'],
              ['Range', '58.2 m'],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-[9px] text-zinc-600">{label}</span>
                <span className="font-mono text-[10px] text-zinc-300">{value}</span>
              </div>
            ))}
          </div>

          <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-400/15 bg-emerald-400/[0.06] py-2 text-[9px] font-semibold text-emerald-300">
            <Mic className="h-3 w-3" />
            Ask the tutor
          </button>
        </div>
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────
   Feature cards
───────────────────────────────────────────────────────────── */

const ModuleVisual = ({ type }) => {
  if (type === 'voice') {
    return (
      <div className="mt-6 flex h-24 items-center justify-center rounded-xl border border-white/[0.06] bg-black/20">
        <div className="flex items-center gap-1.5">
          {[18, 30, 44, 26, 52, 34, 20, 40, 25].map((height, i) => (
            <span
              key={i}
              className="w-1 rounded-full bg-emerald-400/60"
              style={{ height }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (type === 'lab') {
    return (
      <div className="relative mt-6 h-24 overflow-hidden rounded-xl border border-white/[0.06] bg-black/20">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 100">
          <path
            d="M20 78 C100 10 205 8 375 72"
            fill="none"
            stroke="rgba(52,211,153,.55)"
            strokeWidth="1.5"
            strokeDasharray="5 5"
          />
          <circle cx="20" cy="78" r="4" fill="#34d399" />
          <circle cx="375" cy="72" r="3" fill="#34d399" opacity=".7" />
        </svg>
        <span className="absolute bottom-2 left-3 text-[8px] text-zinc-700">x</span>
        <span className="absolute left-2 top-2 text-[8px] text-zinc-700">y</span>
      </div>
    );
  }

  if (type === 'notes') {
    return (
      <div className="mt-6 flex h-24 items-center justify-center rounded-xl border border-white/[0.06] bg-black/20">
        <div className="w-44 rounded-lg border border-white/[0.08] bg-zinc-900/80 p-3 shadow-xl">
          <div className="mb-2 h-1.5 w-16 rounded bg-zinc-600" />
          <div className="space-y-1.5">
            <div className="h-1 rounded bg-zinc-700" />
            <div className="h-1 w-4/5 rounded bg-zinc-700" />
            <div className="mt-2 h-1 rounded bg-emerald-400/40" />
            <div className="h-1 w-3/5 rounded bg-zinc-700" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 flex h-24 items-center justify-center rounded-xl border border-white/[0.06] bg-black/20">
      <div className="relative h-16 w-44">
        <div className="absolute left-1/2 top-1/2 h-px w-32 -translate-x-1/2 bg-white/10" />
        <div className="absolute left-1/2 top-1/2 h-32 w-px -translate-y-1/2 bg-white/10" />
        <div className="absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-400/30 bg-emerald-400/[0.06]" />
        <div className="absolute left-[31%] top-[20%] h-2 w-2 rounded-full bg-emerald-400/70" />
        <div className="absolute right-[23%] bottom-[20%] h-1.5 w-1.5 rounded-full bg-zinc-500" />
      </div>
    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, desc, tags, visual, delay }) => (
  <Reveal delay={delay}>
    <article className="group h-full rounded-2xl border border-white/[0.06] bg-white/[0.015] p-6 transition-all duration-300 hover:-translate-y-px hover:border-white/[0.10] hover:bg-white/[0.025]">
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/10 bg-emerald-400/[0.05] text-emerald-400">
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
        </div>
        <span className="font-mono text-[9px] text-zinc-700">0{delay / 100 + 1}</span>
      </div>

      <h3 className="mt-5 text-[16px] font-semibold tracking-tight text-zinc-100">{title}</h3>
      <p className="mt-2 text-[13px] leading-6 text-zinc-500">{desc}</p>

      <ModuleVisual type={visual} />

      <div className="mt-4 flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className="rounded-md border border-white/[0.06] bg-white/[0.025] px-2 py-1 text-[9px] font-semibold text-zinc-500 transition-colors group-hover:text-zinc-400"
          >
            {tag}
          </span>
        ))}
      </div>
    </article>
  </Reveal>
);

/* ─────────────────────────────────────────────────────────────
   FAQ
───────────────────────────────────────────────────────────── */

const FaqItem = ({ q, a, delay }) => {
  const [open, setOpen] = useState(false);

  return (
    <Reveal delay={delay}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="w-full rounded-xl border border-white/[0.07] bg-white/[0.018] text-left transition-colors duration-300 hover:border-white/[0.11] hover:bg-white/[0.03]"
      >
        <div className="flex items-center justify-between gap-5 px-5 py-5">
          <span className="text-[13px] font-medium text-zinc-200">{q}</span>
          <ChevronDown
            className="h-4 w-4 shrink-0 text-zinc-600 transition-transform duration-300"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </div>

        <div
          className="grid transition-[grid-template-rows] duration-300"
          style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
        >
          <div className="overflow-hidden">
            <p className="border-t border-white/[0.06] px-5 pb-5 pt-4 text-[12.5px] leading-6 text-zinc-500">
              {a}
            </p>
          </div>
        </div>
      </button>
    </Reveal>
  );
};

/* ─────────────────────────────────────────────────────────────
   Main landing page
───────────────────────────────────────────────────────────── */

const Landing = ({ onNavigate }) => {
  const { isAuthenticated } = useAuth();
  const go = () => onNavigate(isAuthenticated ? 'chat' : 'auth');

  // ── Hero warp effect ──────────────────────────────────────────
  // Animates feDisplacementMap.scale from 40 → 0 once on mount.
  // After the animation completes the filter is removed entirely
  // so it has zero ongoing performance cost.
  const warpFilterRef = useRef(null);
  useEffect(() => {
    const el = warpFilterRef.current;
    if (!el) return;

    const duration = 750;
    const start = performance.now();
    const from = 40;

    // ease-out cubic
    const ease = (t) => 1 - Math.pow(1 - t, 3);

    let raf;
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const scale = from * (1 - ease(progress));
      el.setAttribute('scale', scale.toString());
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        // Clean up: remove filter from h1 so GPU resources are freed
        const h1 = document.getElementById('hero-heading');
        if (h1) h1.style.filter = 'none';
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // ── Deferred WebGL backdrop ───────────────────────────────────
  // GridDistortion pulls in three.js and decodes a large texture. Neither is
  // needed for the first paint, so the shader only mounts once the browser is
  // idle (or after a short fallback delay) behind a cheap CSS-gradient
  // placeholder. This keeps the hero text as the LCP element.
  const [backdropReady, setBackdropReady] = useState(false);
  useEffect(() => {
    const schedule = typeof window !== 'undefined' && window.requestIdleCallback
      ? window.requestIdleCallback
      : (cb) => window.setTimeout(cb, 300);
    const cancel = typeof window !== 'undefined' && window.cancelIdleCallback
      ? window.cancelIdleCallback
      : window.clearTimeout;
    const handle = schedule(() => setBackdropReady(true), { timeout: 1500 });
    return () => cancel(handle);
  }, []);

  const features = [
    {
      icon: Mic,
      title: 'Learn through conversation',
      desc: 'Ask questions naturally and get explanations that guide you toward understanding instead of simply giving you an answer.',
      tags: ['Voice tutoring', 'Low latency'],
      visual: 'voice',
    },
    {
      icon: FlaskConical,
      title: 'See the physics happen',
      desc: 'Turn equations into intuition with interactive 2D simulations for motion, waves, orbits, and other physical systems.',
      tags: ['2D simulation', 'Interactive'],
      visual: 'lab',
    },
    {
      icon: BookOpen,
      title: 'Built around CAPS',
      desc: 'Study within the South African Physical Sciences curriculum, with concepts and examples organised around what you actually need to learn.',
      tags: ['Grade 10–12', 'CAPS aligned'],
      visual: 'notes',
    },
    {
      icon: FileText,
      title: 'Turn concepts into notes',
      desc: 'Generate structured study material with formulas, worked examples, explanations, and mathematical notation.',
      tags: ['LaTeX', 'Study guides'],
      visual: 'notes',
    },
  ];

  const workflow = [
    {
      number: '01',
      icon: Brain,
      title: 'Ask',
      text: 'Start with the question you are stuck on. Type it or ask it out loud.',
    },
    {
      number: '02',
      icon: FlaskConical,
      title: 'Explore',
      text: 'Use simulations and visual explanations to connect the mathematics to the physical world.',
    },
    {
      number: '03',
      icon: GraduationCap,
      title: 'Understand',
      text: 'Turn the lesson into notes and worked examples you can return to when studying.',
    },
  ];

  const faqs = [
    {
      q: 'Is Vector AI aligned with the South African CAPS curriculum?',
      a: 'Vector AI is designed around the South African CAPS Physical Sciences curriculum for Grade 10–12.',
    },
    {
      q: 'How does the AI voice tutor work?',
      a: 'Ask a question using your voice, let Vector AI process it, and receive a spoken explanation alongside the learning experience.',
    },
    {
      q: 'Can I use Vector AI offline?',
      a: 'Saved learning material can be cached locally and synchronised when connectivity is restored, depending on the feature.',
    },
    {
      q: 'Can Vector AI generate study guides?',
      a: 'Yes. Study Notes can turn a CAPS topic into a structured guide containing explanations, formulas, and worked examples.',
    },
  ];

  return (
    <div className="min-h-dvh overflow-x-hidden bg-[#070908] text-zinc-100 selection:bg-emerald-400/20 selection:text-emerald-200">
      <ScientificBackground />

      {/* Navbar */}
{/* Navbar Wrapper: Handles the floating layout, centering, and size limits */}
<header className="fixed top-0 left-1/2 z-[5000] mt-4 w-[calc(100%-2rem)] max-w-6xl -translate-x-1/2">
  
  {/* Navbar Card: Inherits the constraints and displays the styling */}
  <nav className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-[#070908]/70 px-4 py-2.5 shadow-2xl shadow-black/20 backdrop-blur-xl">
    
    <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-300/20 bg-emerald-400 text-zinc-950 shadow-[0_8px_25px_-10px_rgba(52,211,153,.8)]">
        <Zap className="h-4 w-4" strokeWidth={2.4} />
      </div>
      <div className="text-left leading-none">
        <span className="block text-[14px] font-semibold tracking-tight text-zinc-50">Vector AI</span>
        <span className="mt-1 block text-[8px] font-bold uppercase tracking-[0.2em] text-emerald-400/80">STEM learning system</span>
      </div>
    </button>

    <div className="flex items-center gap-1">
      <button
        onClick={go}
        className="hidden px-3 py-2 text-[12px] font-medium text-zinc-500 transition-colors hover:text-zinc-100 sm:block"
      >
        Sign in
      </button>
      <button
        onClick={go}
        className="group inline-flex items-center gap-1.5 rounded-lg bg-emerald-400 px-3.5 py-2 text-[12px] font-bold text-zinc-950 transition-all hover:bg-emerald-300"
      >
        Start learning
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </button>
    </div>
    
  </nav>
</header>


      {/* Hero */}
      <main className="landing-page relative z-10">
        {/* Full-bleed GridDistortion background for the hero */}
        <div className="relative -mt-[72px] pt-[72px]">
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 0,
              overflow: 'hidden',
            }}
          >
            {backdropReady ? (
              <Suspense fallback={<HeroBackdropFallback />}>
                <GridDistortion
                  imageSrc="/background.webp"
                  grid={17}
                  mouse={0.52}
                  strength={0.19}
                  relaxation={0.92}
                />
              </Suspense>
            ) : (
              <HeroBackdropFallback />
            )}
            {/* Dark overlay to keep text legible */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(7,9,8,0.5) 0%, rgba(7,9,8,0.82) 70%, rgba(7,9,8,0.97) 100%)',
                pointerEvents: 'none',
              }}
            />
          </div>

          {/* SVG filter definition — hidden, zero size */}
          <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
            <defs>
              <filter id="hero-warp" x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGBLinear">
                <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="2" result="noise" />
                <feDisplacementMap
                  ref={warpFilterRef}
                  in="SourceGraphic"
                  in2="noise"
                  scale="40"
                  xChannelSelector="R"
                  yChannelSelector="G"
                />
              </filter>
            </defs>
          </svg>

          <section className="relative z-10 mx-auto flex max-w-6xl flex-col items-center px-5 pb-24 pt-24 text-center sm:px-6 sm:pt-32">
            <Reveal>
              <Eyebrow>AI-powered Physical Sciences</Eyebrow>
            </Reveal>

            <Reveal delay={100}>
              <h1
                id="hero-heading"
                style={{ filter: 'url(#hero-warp)' }}
                className="max-w-4xl text-balance text-[clamp(2.7rem,7vw,5.4rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-zinc-50"
              >
                Understand the science.
                <span className="block bg-gradient-to-r from-emerald-300 to-emerald-400 bg-clip-text text-transparent">
                  Master the physics.
                </span>
              </h1>
            </Reveal>

            <Reveal delay={220}>
              <p className="mt-7 max-w-2xl text-[15px] leading-7 text-zinc-500 sm:text-[16px]">
                Vector AI combines an intelligent tutor, interactive physics simulations,
                and structured study tools into one learning environment built around the
                South African CAPS curriculum.
              </p>
            </Reveal>

            <Reveal delay={340}>
              <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
                <ArrowButton onClick={go}>
                  <Play className="h-3.5 w-3.5 fill-current" />
                  Start learning
                </ArrowButton>
                <ArrowButton secondary onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}>
                  See how it works
                </ArrowButton>
              </div>
            </Reveal>

            <Reveal delay={480} className="w-full">
              <PhysicsPreview />
            </Reveal>

            <Reveal delay={620} className="mt-8 w-full">
              <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-x-7 gap-y-3 text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-600">
                <span className="flex items-center gap-2"><Check className="h-3 w-3 text-emerald-500/70" /> CAPS aligned</span>
                <span className="flex items-center gap-2"><Check className="h-3 w-3 text-emerald-500/70" /> Interactive simulations</span>
                <span className="flex items-center gap-2"><Check className="h-3 w-3 text-emerald-500/70" /> Voice tutoring</span>
                <span className="flex items-center gap-2"><Check className="h-3 w-3 text-emerald-500/70" /> Study notes</span>
              </div>
            </Reveal>
          </section>
        </div>

        {/* How it works */}
        <section id="how-it-works" className="border-y border-white/[0.06] bg-white/[0.012] px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <Reveal className="max-w-2xl">
              <Eyebrow>A better learning loop</Eyebrow>
              <h2 className="text-[clamp(2rem,4vw,3.2rem)] font-semibold tracking-[-0.035em] text-zinc-50">
                From confusion to intuition.
              </h2>
              <p className="mt-4 max-w-xl text-[14px] leading-7 text-zinc-500">
                Vector AI is designed around how difficult concepts are actually learned:
                ask, visualise, then practise the idea until it makes sense.
              </p>
            </Reveal>

            <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.06] md:grid-cols-3">
              {workflow.map((step, i) => {
                const Icon = step.icon;
                return (
                  <Reveal key={step.number} delay={i * 100}>
                    <div className="group h-full bg-[#090b0a] p-7 transition-colors duration-300 hover:bg-[#0c100e]">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-emerald-400/60">{step.number}</span>
                        <Icon className="h-4 w-4 text-zinc-700 transition-colors group-hover:text-emerald-400" strokeWidth={1.7} />
                      </div>
                      <h3 className="mt-14 text-[18px] font-semibold tracking-tight text-zinc-100">{step.title}</h3>
                      <p className="mt-3 text-[13px] leading-6 text-zinc-500">{step.text}</p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="px-6 py-28">
          <div className="mx-auto max-w-6xl">
            <Reveal className="text-center">
              <Eyebrow>Inside Vector AI</Eyebrow>
              <h2 className="text-[clamp(2rem,4vw,3.2rem)] font-semibold tracking-[-0.035em] text-zinc-50">
                One system. <span className="text-zinc-500">Every part of learning.</span>
              </h2>
            </Reveal>

            <div className="mt-14 grid gap-4 md:grid-cols-2">
              {features.map((feature, i) => (
                <FeatureCard key={feature.title} {...feature} delay={i * 100} />
              ))}
            </div>
          </div>
        </section>

        {/* CAPS authority */}
        <section className="border-y border-white/[0.06] px-6 py-28">
          <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[.8fr_1.2fr]">
            <Reveal variant="from-left">
              <div className="relative flex aspect-square max-w-md items-center justify-center overflow-hidden rounded-3xl border border-white/[0.08] bg-[#090b0a]">
                <div className="absolute inset-10 rounded-full border border-emerald-400/10" />
                <div className="absolute inset-20 rounded-full border border-emerald-400/[0.08]" />
                <div className="absolute h-px w-4/5 bg-emerald-400/10" />
                <div className="absolute h-4/5 w-px bg-emerald-400/10" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-400 shadow-[0_0_60px_-20px_rgba(52,211,153,.8)]">
                  <ShieldCheck className="h-9 w-9" strokeWidth={1.5} />
                </div>
                <div className="absolute bottom-7 left-7 font-mono text-[9px] text-zinc-700">CAPS / PHYSICAL SCIENCES</div>
                <div className="absolute right-7 top-7 font-mono text-[9px] text-zinc-700">G10 — G12</div>
              </div>
            </Reveal>

            <Reveal variant="from-right">
              <Eyebrow>Built around CAPS</Eyebrow>
              <h2 className="max-w-2xl text-[clamp(2rem,4vw,3.4rem)] font-semibold leading-[1.05] tracking-[-0.04em] text-zinc-50">
                Learn the concepts that actually matter.
              </h2>
              <p className="mt-6 max-w-xl text-[14px] leading-7 text-zinc-500">
                Generic AI can explain almost anything. Vector AI is designed to make
                those explanations relevant to the South African Physical Sciences
                curriculum, from foundational concepts through matric preparation.
              </p>

              <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-2">
                {[
                  'Grade 10–12 Physical Sciences',
                  'Physics concepts & formulas',
                  'Worked examples',
                  'Interactive visual learning',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2.5 text-[11px] font-medium text-zinc-400">
                    <CircleDot className="h-3.5 w-3.5 text-emerald-400/70" />
                    {item}
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* Founder */}
        <section className="px-6 py-28">
          <div className="mx-auto max-w-5xl">
            <Reveal>
              <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.018]">
                <div className="grid lg:grid-cols-[.8fr_1.2fr]">
                  <div className="relative flex min-h-[360px] items-end overflow-hidden border-b border-white/[0.07] bg-[#090b0a] p-7 lg:border-b-0 lg:border-r">
                    <div className="absolute inset-0 opacity-30">
                      <div
                        className="absolute inset-0"
                        style={{
                          backgroundImage:
                            'linear-gradient(rgba(52,211,153,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(52,211,153,.08) 1px, transparent 1px)',
                          backgroundSize: '42px 42px',
                          maskImage: 'radial-gradient(circle at 50% 45%, black, transparent 72%)',
                          WebkitMaskImage: 'radial-gradient(circle at 50% 45%, black, transparent 72%)',
                        }}
                      />
                    </div>

                    <div className="relative">
                      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.06] text-emerald-400">
                        <Cpu className="h-7 w-7" strokeWidth={1.5} />
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-400/70">
                        Founder & developer
                      </p>
                      <h3 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-100">Taro Mukhalela</h3>
                      <p className="mt-1 text-[11px] text-zinc-600">Mpumalanga, South Africa</p>
                    </div>
                  </div>

                  <div className="p-8 sm:p-10 lg:p-14">
                    <Eyebrow>The idea behind Vector AI</Eyebrow>
                    <h2 className="max-w-xl text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.05] tracking-[-0.04em] text-zinc-50">
                      Built by a student. Designed for students.
                    </h2>
                    <div className="mt-6 space-y-4 text-[13.5px] leading-7 text-zinc-500">
                      <p>
                        Vector AI began with a simple idea: difficult science should not
                        have to stay abstract just because a textbook cannot show you what
                        is happening.
                      </p>
                      <p>
                        The platform combines modern AI with interactive visualisation to
                        make physical science more intuitive, accessible, and connected to
                        the curriculum students are actually studying.
                      </p>
                    </div>
                    <div className="mt-8 flex flex-wrap gap-5 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-600">
                      <span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-400" /> Student built</span>
                      <span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-400" /> STEM focused</span>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 pb-28">
          <Reveal>
            <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-emerald-400/15 bg-emerald-400/[0.045] px-7 py-16 text-center sm:px-12">
              <div className="absolute left-1/2 top-0 h-40 w-72 -translate-x-1/2 rounded-full bg-emerald-400/[0.08] blur-3xl" />
              <div className="relative">
                <Eyebrow>Ready to learn differently?</Eyebrow>
                <h2 className="mx-auto max-w-2xl text-[clamp(2rem,5vw,3.5rem)] font-semibold leading-[1.02] tracking-[-0.04em] text-zinc-50">
                  Stop memorising the physics.
                  <span className="block text-emerald-300">Start understanding it.</span>
                </h2>
                <p className="mx-auto mt-5 max-w-lg text-[13.5px] leading-6 text-zinc-500">
                  Explore Vector AI and build the intuition behind the equations.
                </p>
                <div className="mt-8">
                  <ArrowButton onClick={go}>
                    <Play className="h-3.5 w-3.5 fill-current" />
                    Launch Vector AI
                  </ArrowButton>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* FAQ */}
        <section className="border-t border-white/[0.06] px-6 py-24">
          <div className="mx-auto max-w-3xl">
            <Reveal className="mb-12 text-center">
              <Eyebrow>Questions</Eyebrow>
              <h2 className="text-[clamp(2rem,4vw,2.8rem)] font-semibold tracking-[-0.035em] text-zinc-50">
                Good questions deserve clear answers.
              </h2>
            </Reveal>

            <div className="space-y-2.5">
              {faqs.map((faq, i) => (
                <FaqItem key={faq.q} {...faq} delay={i * 70} />
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] px-6 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 text-center sm:flex-row sm:text-left">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-400 text-zinc-950">
              <Atom className="h-3.5 w-3.5" strokeWidth={2.4} />
            </div>
            <div>
              <span className="block text-[13px] font-semibold text-zinc-200">Vector AI</span>
              <span className="text-[8px] font-bold uppercase tracking-[0.16em] text-zinc-600">STEM learning system</span>
            </div>
          </div>

          <div className="text-[10px] uppercase tracking-[0.12em] text-zinc-700">
            AI-accelerated learning · {new Date().getFullYear()} Vector AI
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
