import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, lazy, Suspense } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { useAuth } from './context/AuthContext';
import useAnalytics from './useAnalytics';
import Layout from './components/Layout';
import ToastProvider from './components/ToastProvider';
import Onboarding from './components/Onboarding';

// ── Route-level code splitting ────────────────────────────────────────────────
// Each screen is fetched on demand so a learner only downloads the surface they
// actually open (the Landing hero and the Voice avatar pull three.js, and the
// Lab/Notes screens are substantial — none of that belongs in the entry chunk).
const Landing = lazy(() => import('./pages/Landing'));
const Auth = lazy(() => import('./pages/Auth'));
const Chat = lazy(() => import('./pages/Chat'));
const Voice = lazy(() => import('./pages/Voice'));
const Lab = lazy(() => import('./pages/Lab'));
const Notes = lazy(() => import('./pages/Notes'));
const History = lazy(() => import('./pages/History'));
const Topics = lazy(() => import('./pages/Topics'));
const Dashboard = lazy(() => import('./pages/Dashboard'));

const ScreenReaderTitle = ({ children }) => (
  <h1 className="sr-only">{children}</h1>
);

// Skeleton shown while a route chunk is in flight. It intentionally mirrors the
// page padding rhythm so the transition feels instant rather than blank.
const VectorLoader = ({ label = 'Loading Vector AI' }) => (
  <div className="flex flex-col items-center gap-5" role="status" aria-live="polite">
    <span className="sr-only">{label}</span>
    <div className="vector-loader" aria-hidden="true">
      {[0, 1, 2, 3].map((key) => (
        <span className="loader-circle" key={key}><span className="loader-dot" /><span className="loader-outline" /></span>
      ))}
    </div>
    <span className="font-mono text-[10px] font-medium uppercase tracking-[.18em] text-[var(--clr-text-3)]">{label}</span>
  </div>
);

const RouteSkeleton = () => (
  <div className="flex min-h-dvh items-center justify-center bg-[var(--clr-bg)] px-5" role="status" aria-live="polite">
    <VectorLoader label="Loading workspace" />
  </div>
);

function App() {
  const { isAuthenticated, loading, csrfToken } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useAnalytics();

  const [activeAnim, setActiveAnim] = useState('idle');
  const [sharedTriggerPrompt, setSharedTriggerPrompt] = useState('');
  const [resumeChatId, setResumeChatId] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !localStorage.getItem('vector_onboarding_done')) {
      setShowOnboarding(true);
    }
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--clr-bg)] text-[var(--clr-text-1)]">
        <VectorLoader label="Preparing workspace" />
      </div>
    );
  }

  const handleAuthNavigation = (page) => {
    if (page === 'auth') {
      navigate('/auth');
      return;
    }

    navigate('/chat');
  };

  if (!isAuthenticated) {
    return (
      <ToastProvider>
        <Suspense fallback={<RouteSkeleton />}>
          <Routes>
            <Route path="/auth" element={<Auth onNavigate={handleAuthNavigation} />} />
            <Route path="*" element={<Landing onNavigate={handleAuthNavigation} />} />
          </Routes>
        </Suspense>
        <Analytics />
        <SpeedInsights />
      </ToastProvider>
    );
  }

  if (location.pathname === '/') {
    return (
      <ToastProvider>
        <Suspense fallback={<RouteSkeleton />}>
          <Landing onNavigate={handleAuthNavigation} />
        </Suspense>
        <Analytics />
        <SpeedInsights />
      </ToastProvider>
    );
  }

  const handleSelectTopic = (promptText) => {
    setSharedTriggerPrompt(promptText);
    navigate('/chat');
  };

  const handleResumeSession = (chatId) => {
    setResumeChatId(chatId);
    navigate('/chat');
  };

  return (
    <ToastProvider>
      {showOnboarding && <Onboarding onComplete={() => setShowOnboarding(false)} />}
      <Layout>
        <Suspense fallback={<RouteSkeleton />}>
          <Routes>
            <Route
              path="/chat"
            element={(
              <>
                <ScreenReaderTitle>Vector AI Tutor</ScreenReaderTitle>
                <Chat
                  onMatchAnimation={setActiveAnim}
                  currentAnimation={activeAnim}
                  initialPrompt={sharedTriggerPrompt}
                  resumeChatId={resumeChatId}
                />
              </>
            )}
          />
          <Route
            path="/voice"
            element={(
              <>
                <ScreenReaderTitle>Vector AI Voice Tutor</ScreenReaderTitle>
                <Voice onMatchAnimation={setActiveAnim} csrfToken={csrfToken} />
              </>
            )}
          />
          <Route
            path="/lab"
            element={(
              <>
                <ScreenReaderTitle>Vector AI Visual Physics Lab</ScreenReaderTitle>
                <Lab activeAnim={activeAnim} onAnimChange={setActiveAnim} />
              </>
            )}
          />
          <Route
            path="/notes"
            element={(
              <>
                <ScreenReaderTitle>Vector AI Study Notes</ScreenReaderTitle>
                <Notes />
              </>
            )}
          />
          <Route
            path="/history"
            element={(
              <>
                <ScreenReaderTitle>Vector AI Chat History</ScreenReaderTitle>
                <History onResumeSession={handleResumeSession} />
              </>
            )}
          />
          <Route
            path="/topics"
            element={(
              <>
                <ScreenReaderTitle>Vector AI CAPS Syllabus Topics</ScreenReaderTitle>
                <Topics onSelectTopic={handleSelectTopic} />
              </>
            )}
          />
          <Route
            path="/dashboard"
            element={(
              <>
                <ScreenReaderTitle>Vector AI Dashboard</ScreenReaderTitle>
                <Dashboard />
              </>
            )}
          />
          <Route path="/auth" element={<Navigate to="/chat" replace />} />
          <Route path="*" element={<Navigate to="/chat" replace />} />
          </Routes>
        </Suspense>
      </Layout>
      <Analytics />
      <SpeedInsights />
    </ToastProvider>
  );
}

export default App;
