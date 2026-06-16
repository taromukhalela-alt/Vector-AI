import { useState, useEffect } from 'react';
import { 
  X, MessageSquare, Mic, FlaskConical, BookOpen, 
  ChevronRight, Sparkles, Zap, Brain, Rocket
} from 'lucide-react';

const steps = [
  {
    title: "Welcome to Vector AI",
    tagline: "Your Personal STEM Operating System",
    description: "Experience a new way to master Physical Sciences and Chemistry. Tailored for CAPS students, powered by advanced AI.",
    icon: Rocket,
    color: "emerald"
  },
  {
    title: "AI Tutor & Real-time Tools",
    tagline: "Smart, Grounded, and Analytical",
    description: "Chat with an AI that can search the web for latest science news and execute Python code to solve complex equations.",
    icon: Brain,
    color: "emerald"
  },
  {
    title: "Interactive Visual Lab",
    tagline: "Physics in Motion",
    description: "Visualise formulas with real-time simulations. Watch concepts come to life as you chat with your tutor.",
    icon: FlaskConical,
    color: "emerald"
  },
  {
    title: "Voice & Note Vault",
    tagline: "Study anywhere, anytime",
    description: "Talk to your tutor hands-free and save important insights directly to your personal Study Notes vault.",
    icon: Mic,
    color: "emerald"
  }
];

const Onboarding = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Small delay to trigger entry animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    localStorage.setItem('vector_onboarding_done', 'true');
    setIsVisible(false);
    setTimeout(onComplete, 400); // Wait for exit animation
  };

  const step = steps[currentStep];
  const Icon = step.icon;

  return (
    <div className={`fixed inset-0 z-[500] flex items-center justify-center p-4 transition-all duration-500 ${
      isVisible ? 'opacity-100' : 'opacity-0'
    }`}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-xl" onClick={handleComplete} />
      
      {/* Content Card */}
      <div className={`relative w-full max-w-lg overflow-hidden rounded-[32px] border border-white/[0.08] bg-zinc-900 shadow-2xl transition-all duration-500 transform ${
        isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'
      }`}>
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 right-0 flex h-1.5 gap-1 p-0.5">
          {steps.map((_, i) => (
            <div 
              key={i} 
              className={`h-full flex-1 rounded-full transition-all duration-500 ${
                i <= currentStep ? 'bg-emerald-500' : 'bg-white/10'
              }`} 
            />
          ))}
        </div>

        <button 
          onClick={handleComplete}
          className="absolute top-6 right-6 p-2 text-zinc-500 hover:text-zinc-100 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-8 sm:p-12">
          {/* Animated Icon */}
          <div className="mb-8 flex justify-center">
            <div className={`relative flex h-20 w-20 items-center justify-center rounded-2xl bg-${step.color}-500/10 border border-${step.color}-500/20 anim-breathe`}>
              <Icon className={`h-10 w-10 text-${step.color}-400`} />
              <div className={`absolute -inset-4 -z-10 rounded-full bg-${step.color}-500/20 blur-2xl`} />
            </div>
          </div>

          <div className="text-center">
            <h2 className="anim-fade-up d-100 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {step.title}
            </h2>
            <p className={`anim-fade-up d-200 mt-2 text-sm font-bold uppercase tracking-widest text-${step.color}-400`}>
              {step.tagline}
            </p>
            <p className="anim-fade-up d-300 mt-6 text-zinc-400 leading-relaxed">
              {step.description}
            </p>
          </div>

          <div className="mt-12 flex flex-col items-center gap-4">
            <button
              onClick={handleNext}
              className={`anim-fade-up d-400 group flex items-center gap-2 rounded-2xl bg-emerald-500 px-8 py-4 text-sm font-bold text-zinc-950 shadow-xl transition-all hover:bg-emerald-400 hover:scale-105 active:scale-95`}
            >
              {currentStep === steps.length - 1 ? "Let's Blast Off!" : "Continue"}
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <button 
              onClick={handleComplete}
              className="anim-fade-up d-500 text-xs font-semibold uppercase tracking-widest text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              Skip Introduction
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
