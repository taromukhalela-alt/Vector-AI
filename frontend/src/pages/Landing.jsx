import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowRight, Mic, FlaskConical, BookOpen, FileText, 
  ChevronDown, Cpu, Sparkles, Award, ShieldCheck 
} from 'lucide-react';

const Landing = ({ onNavigate }) => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: Mic,
      title: "Real-Time AI Voice Tutor",
      desc: "Interact with our vocal instructor using natural speaking voices. Supported by CAMB AI & ElevenLabs with customizable local fallback synthesizers.",
      tags: ["Voice Synthesis", "Low Latency"]
    },
    {
      icon: FlaskConical,
      title: "2D Physics Visual Lab",
      desc: "Run real-time kinetic simulations (projectiles, waves, orbits, and fields) side-by-side with your study chat to observe physical laws instantly.",
      tags: ["WebGL 2D", "Interactive HUD"]
    },
    {
      icon: BookOpen,
      title: "100% CAPS Aligned",
      desc: "Tailored specifically for South African high school and university students, covering Grade 10-12 Physical Sciences and Chemistry curricula.",
      tags: ["CAPS Curriculum", "South Africa"]
    },
    {
      icon: FileText,
      title: "Semantic Notes Vault",
      desc: "Generate comprehensive, AI-assisted summaries with worked examples, edit formulas in LaTeX, and export beautifully branded PDFs.",
      tags: ["LaTeX", "PDF Export"]
    }
  ];

  const faqs = [
    {
      q: "Is Vector AI aligned with the South African school curriculum?",
      a: "Yes, 100%. All topics, formulas, chemistry reactions, and practice modules are strictly structured around the South African CAPS (Curriculum and Assessment Policy Statement) guidelines for Grade 10, 11, and 12 Physical Sciences."
    },
    {
      q: "How does the AI voice tutor work?",
      a: "By pressing the microphone button, you can speak naturally. The system transcribes your speech, processes the science inquiry, matches the topic to any relevant physics simulation, and speaks the explanation back to you with custom synthesized voices."
    },
    {
      q: "Can I use Vector AI offline?",
      a: "Yes! Vector AI features an integrated database synchronization system. When you reconnect, your local offline revisions, saved notes, and flashcards sync back to the cloud."
    },
    {
      q: "How do I generate study guides or exam practice sheets?",
      a: "Within the Study Notes panel, you can type a topic (e.g., 'Newton\'s Laws') and click 'Generate'. The AI will write a full-length study guide with formulas, worked examples, and custom practice questions."
    }
  ];

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-zinc-950 text-zinc-100 font-sans select-none">
      {/* Animated Grid Background */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.04)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,black_70%,transparent_100%)] pointer-events-none z-0"
      />

      {/* Floating Light Orbs */}
      <div className="absolute top-1/4 right-10 w-96 h-96 rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 left-10 w-80 h-80 rounded-full bg-teal-500/5 blur-[120px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-zinc-950/80 border-b border-zinc-900/50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-500/30">
            V
          </div>
          <div>
            <span className="font-extrabold text-base tracking-wide block leading-none">Vector AI</span>
            <span className="text-[10px] tracking-widest text-emerald-500 font-bold uppercase mt-0.5 block">STEM OS</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onNavigate(isAuthenticated ? 'chat' : 'auth')}
            className="px-4 py-2 text-sm font-semibold text-zinc-400 hover:text-white transition-all cursor-pointer"
          >
            Sign In
          </button>
          <button
            onClick={() => onNavigate(isAuthenticated ? 'chat' : 'auth')}
            className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold text-xs tracking-wider uppercase shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 px-6 pt-20 pb-24 text-center max-w-5xl mx-auto flex flex-col items-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-semibold text-xs tracking-widest uppercase mb-8 shadow-inner animate-pulse">
          <Sparkles className="w-3.5 h-3.5" />
          Neural STEM Interface
        </div>

        {/* Title */}
        <h1 className="font-black text-4xl sm:text-6xl md:text-7xl tracking-tight leading-tight uppercase mb-8">
          Vectors of Mind, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 drop-shadow-[0_0_30px_rgba(16,185,129,0.3)]">
            Syllabus of Power
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-zinc-400 text-base sm:text-xl leading-relaxed max-w-3xl mb-12">
          South Africa's premium CAPS-aligned STEM Operating System. Fusing interactive 2D simulations, real-time speech tutoring, and semantic notes to unlock science mastery.
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl mb-12">
          {[
            { value: "14.2 ms", label: "Inference Latency", icon: Cpu },
            { value: "98.7%", label: "Lab Trajectory Fidelity", icon: Award },
            { value: "100%", label: "CAPS Curriculum Match", icon: ShieldCheck },
            { value: "Unlimited", label: "Interactive Simulations", icon: FlaskConical }
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="p-4 rounded-xl border border-zinc-900 bg-zinc-900/40 backdrop-blur-sm text-center">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center mx-auto mb-2 text-emerald-400">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="font-bold text-lg text-emerald-400">{stat.value}</div>
                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1">{stat.label}</div>
              </div>
            );
          })}
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={() => onNavigate(isAuthenticated ? 'chat' : 'auth')}
            className="flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold rounded-lg tracking-wider uppercase text-sm shadow-xl shadow-emerald-500/10 hover:shadow-emerald-500/30 hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            Launch STEM OS
            <ArrowRight className="w-4 h-4 stroke-[3px]" />
          </button>
        </div>
      </section>

      {/* Features Grid Section */}
      <section className="relative z-10 py-20 px-6 border-t border-zinc-900 bg-zinc-950/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-3">Core Modules</h2>
            <h3 className="text-3xl font-black uppercase tracking-wide">Accelerated Scientific Discovery</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div 
                  key={i}
                  className="p-8 rounded-2xl border border-zinc-900 bg-zinc-900/30 backdrop-blur-sm hover:border-emerald-500/30 hover:bg-zinc-900/60 hover:shadow-2xl hover:shadow-emerald-500/5 transition-all group duration-300"
                >
                  <div className="w-12 h-12 rounded-xl border border-zinc-800 bg-zinc-800/50 flex items-center justify-center text-emerald-400 group-hover:border-emerald-500/30 group-hover:shadow-lg group-hover:shadow-emerald-500/20 transition-all mb-6">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="font-extrabold text-lg uppercase tracking-wider mb-2">{feat.title}</h4>
                  <p className="text-zinc-400 text-sm leading-relaxed mb-6">{feat.desc}</p>
                  <div className="flex gap-2">
                    {feat.tags.map((tag, idx) => (
                      <span key={idx} className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-400">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative z-10 py-20 px-6 border-t border-zinc-900">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-3">FAQ</h2>
            <h3 className="text-3xl font-black uppercase tracking-wide">Common Inquiries</h3>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <details 
                key={i} 
                className="group border border-zinc-900 rounded-xl bg-zinc-900/20 overflow-hidden [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex items-center justify-between p-6 text-left font-bold text-sm sm:text-base uppercase tracking-wider cursor-pointer hover:bg-zinc-900/40 select-none">
                  {faq.q}
                  <ChevronDown className="w-4 h-4 text-zinc-400 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="px-6 pb-6 pt-2 text-zinc-400 text-sm leading-relaxed border-t border-zinc-900/50 bg-zinc-950/20">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-900 px-6 py-12 text-center text-zinc-500 text-xs tracking-wider">
        <p className="mb-2">Vector AI STEM Operating System — Developed by Taro Mukhalela</p>
        <p className="opacity-60">© {new Date().getFullYear()} Vector AI. All Rights Reserved.</p>
      </footer>
    </div>
  );
};

export default Landing;
