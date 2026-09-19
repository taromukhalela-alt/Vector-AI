import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  X, CaretRight, Sparkle, Lightning, Brain,
  Flask, ChatCircle, Stack,
  Target, Info, ArrowLeft
} from '@phosphor-icons/react';

const Onboarding = ({ onComplete }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [spotlightRect, setSpotlightRect] = useState(null);

  const tourSteps = useMemo(() => [
    {
      title: "Welcome to Vector AI",
      content: "Hiee! I'm Taro Mukhalela, and I built this to help you master Physical Science. Ready for a quick tour of your new Physical Science Assistant?",
      icon: Sparkle,
      page: "/dashboard",
      target: null // Center of screen
    },
    {
      title: "Your Command Center",
      content: "The Dashboard shows your real-time performance telemetry. It tracks your the ML model accuracy for your questions and CAPS syllabus progress as you study.",
      icon: Stack,
      page: "/dashboard",
      target: "main" // Highlight main content
    },
    {
      title: "The AI Tutor",
      content: "This is where the magic happens. You can ask anything to solve physics problems or pursue knowledge.",
      icon: ChatCircle,
      page: "/chat",
      target: "textarea"
    },
    {
      title: "Interactive Simulations",
      content: "The Visual Lab lets you see concepts in motion. Projectiles, waves, and more — simulated in real-time.",
      icon: Flask,
      page: "/lab",
      target: ".lab-canvas-container"
    },
    {
      title: "Study Notes Vault",
      content: "Save your AI conversations and generate full CAPS study guides here. You can even export them as professional PDFs.",
      icon: Target,
      page: "/notes",
      target: "aside"
    },
    {
      title: "Ready to Master STEM?",
      content: "That's the basics! Remember to use the Search and Code tools in the chat for deeper analysis. Good luck with your studies!",
      icon: Lightning,
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
    <div className={`fixed inset-0 z-[600] transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      {/* Dim Overlay with Spotlight Hole */}
      <div className="absolute inset-0 bg-black/70">
        {spotlightRect && (
          <div
            className="absolute bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] transition-all duration-500 border-[3px] border-[var(--emerald)]"
            style={{
              top: spotlightRect.top,
              left: spotlightRect.left,
              width: spotlightRect.width,
              height: spotlightRect.height,
            }}
          />
        )}
      </div>

      {/* Content Card */}
      <div
        className={`absolute transition-all duration-500 flex flex-col items-center justify-center p-6 text-center ${spotlightRect
            ? 'bottom-10 left-1/2 -translate-x-1/2 w-full max-w-md'
            : 'inset-0 m-auto w-full max-w-lg h-fit'
          }`}
      >
        <div className="relative w-full border-[3px] border-[var(--paper)] bg-[var(--ink)] p-8 text-left shadow-[8px_8px_0_var(--emerald)] sm:p-10">
          <button
            onClick={handleComplete}
            aria-label="Skip tour"
            className="absolute top-5 right-5 p-2 text-[var(--paper)]/60 hover:text-[var(--paper)]"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="mb-6 flex">
            <div className="flex h-14 w-14 items-center justify-center border-[3px] border-[var(--paper)] bg-[var(--emerald)] text-white">
              <Icon className="h-7 w-7" aria-hidden="true" />
            </div>
          </div>

          <p className="section-label mb-2" style={{ color: 'var(--ink-muted)' }}>
            Step {currentStep + 1} / {tourSteps.length}
          </p>
          <h2 className="text-xl font-black uppercase tracking-tight text-[var(--paper)] sm:text-2xl">
            {step.title}
          </h2>
          <p className="mt-3 text-[14px] font-medium leading-relaxed text-[var(--paper)]/70 sm:text-[15px]">
            {step.content}
          </p>

          <div className="mt-8 flex items-center justify-between gap-4 border-t-2 border-[var(--paper)]/20 pt-5">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              aria-label="Previous step"
              className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest ${currentStep === 0 ? 'text-[var(--paper)]/30' : 'text-[var(--paper)]/70 hover:text-[var(--paper)]'}`}
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              Back
            </button>

            <div className="flex gap-1.5" aria-hidden="true">
              {tourSteps.map((_, i) => (
                <div key={i} className={`h-1.5 transition-all ${i === currentStep ? 'w-5 bg-[var(--emerald)]' : 'w-1.5 bg-[var(--paper)]/20'}`} />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="group flex items-center gap-2 border-2 border-[var(--paper)] bg-[var(--paper)] px-5 py-2.5 text-xs font-black uppercase tracking-widest text-[var(--ink)] shadow-[3px_3px_0_var(--emerald)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_var(--emerald)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
            >
              {currentStep === tourSteps.length - 1 ? 'Finish' : 'Next'}
              <CaretRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
