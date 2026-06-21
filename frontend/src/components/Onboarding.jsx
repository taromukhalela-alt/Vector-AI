import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  X, ChevronRight, Sparkles, Zap, Brain, 
  FlaskConical, MessageSquare, LayoutDashboard,
  Target, Info, ArrowLeft
} from 'lucide-react';

const Onboarding = ({ onComplete }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [spotlightRect, setSpotlightRect] = useState(null);

  const tourSteps = useMemo(() => [
    {
      title: "Welcome to Vector AI",
      content: "I'm Taro Mukhalela, and I built this to help you master Physical Science. Ready for a quick tour of your new STEM Operating System?",
      icon: Sparkles,
      page: "/dashboard",
      target: null // Center of screen
    },
    {
      title: "Your Command Center",
      content: "The Dashboard shows your real-time performance telemetry. It tracks your model accuracy and CAPS syllabus progress as you study.",
      icon: LayoutDashboard,
      page: "/dashboard",
      target: "main" // Highlight main content
    },
    {
      title: "The AI Tutor",
      content: "This is where the magic happens. You can ask anything, search the web, or even run Python code to solve physics problems.",
      icon: MessageSquare,
      page: "/chat",
      target: "textarea" 
    },
    {
      title: "Interactive Simulations",
      content: "The Visual Lab lets you see concepts in motion. Projectiles, waves, and more — simulated in real-time.",
      icon: FlaskConical,
      page: "/lab",
      target: ".lab-canvas-container" // Assuming this class exists or I'll add it
    },
    {
      title: "Study Notes Vault",
      content: "Save your AI conversations and generate full CAPS study guides here. You can even export them as professional PDFs.",
      icon: Target,
      page: "/notes",
      target: "button[title='New note']"
    },
    {
      title: "Ready to Master STEM?",
      content: "That's the basics! Remember to use the Search and Code tools in the chat for deeper analysis. Good luck with your studies!",
      icon: Zap,
      page: "/chat",
      target: null
    }
  ], []);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // Update spotlight when step or location changes
  useEffect(() => {
    const step = tourSteps[currentStep];
    
    // Navigate if needed
    if (step.page && location.pathname !== step.page) {
      navigate(step.page);
      // Wait for navigation and render
      setTimeout(updateSpotlight, 500);
    } else {
      updateSpotlight();
    }

    function updateSpotlight() {
      if (!step.target) {
        setSpotlightRect(null);
        return;
      }

      let el = null;
      try {
        el = document.querySelector(step.target);
      } catch (err) {
        console.warn("Onboarding: querySelector failed for", step.target, err);
      }
      
      // Fallback searches
      if (!el) {
        if (step.target === "textarea") el = document.querySelector('textarea');
        if (step.target === "main") el = document.querySelector('main');
        if (typeof step.target === 'string' && step.target.includes('button')) {
          el = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Note'));
        }
      }

      if (el) {
        const rect = el.getBoundingClientRect();
        setSpotlightRect({
          top: rect.top - 8,
          left: rect.left - 8,
          width: rect.width + 16,
          height: rect.height + 16
        });
        
        // Scroll into view if needed
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        setSpotlightRect(null);
      }
    }

    // Re-run update on resize
    window.addEventListener('resize', updateSpotlight);
    return () => window.removeEventListener('resize', updateSpotlight);
  }, [currentStep, location.pathname, navigate, tourSteps]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  const handleComplete = () => {
    localStorage.setItem('vector_onboarding_done', 'true');
    setIsVisible(false);
    setTimeout(onComplete, 400);
  };

  const step = tourSteps[currentStep];
  const Icon = step.icon;

  return (
    <div className={`fixed inset-0 z-[600] transition-all duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      {/* Dim Overlay with Spotlight Hole */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]">
        {spotlightRect && (
          <div 
            className="absolute bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] transition-all duration-500 ease-spring rounded-xl border-2 border-emerald-500/50"
            style={{
              top: spotlightRect.top,
              left: spotlightRect.left,
              width: spotlightRect.width,
              height: spotlightRect.height,
            }}
          >
            <div className="absolute inset-0 anim-glow rounded-xl" />
          </div>
        )}
      </div>

      {/* Content Card */}
      <div 
        className={`absolute transition-all duration-500 ease-spring flex flex-col items-center justify-center p-6 text-center ${
          spotlightRect 
            ? 'bottom-10 left-1/2 -translate-x-1/2 w-full max-w-md' 
            : 'inset-0 m-auto w-full max-w-lg h-fit'
        }`}
      >
        <div className="relative w-full overflow-hidden rounded-[32px] border border-white/[0.1] bg-zinc-900/90 backdrop-blur-xl shadow-2xl p-8 sm:p-10">
          <button 
            onClick={handleComplete}
            className="absolute top-6 right-6 p-2 text-zinc-500 hover:text-zinc-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="mb-6 flex justify-center">
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 anim-breathe">
              <Icon className="h-8 w-8 text-emerald-400" />
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-4">
            {step.title}
          </h2>
          <p className="text-zinc-400 leading-relaxed text-[14px] sm:text-[15px]">
            {step.content}
          </p>

          <div className="mt-10 flex items-center justify-between gap-4">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors ${
                currentStep === 0 ? 'text-zinc-700 pointer-events-none' : 'text-zinc-400 hover:text-zinc-100'
              }`}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>

            <div className="flex gap-1.5">
              {tourSteps.map((_, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentStep ? 'bg-emerald-500 w-4' : 'bg-white/10'}`} />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="group flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-zinc-950 shadow-xl transition-all hover:bg-emerald-400 hover:scale-105 active:scale-95"
            >
              {currentStep === tourSteps.length - 1 ? "Finish" : "Next"}
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
