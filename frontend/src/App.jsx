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
const Revision = lazy(() => import('./pages/Revision'));
const MockExams = lazy(() => import('./pages/MockExams'));
const Subjects = lazy(() => import('./pages/Subjects'));

const ScreenReaderTitle = ({ children }) => (
  <h1 className="sr-only">{children}</h1>
);

// Skeleton shown while a route chunk is in flight. It intentionally mirrors the
// page padding rhythm so the transition feels instant rather than blank.
const RouteSkeleton = () => (
  <div className="min-h-dvh bg-[var(--paper)] px-5 py-8 sm:px-8 sm:py-10" role="status" aria-live="polite">
    <span className="sr-only">Loading screen</span>
    <div className="mx-auto max-w-5xl animate-pulse space-y-6">
      <div className="h-4 w-40 border-2 border-[var(--border)] bg-[var(--surface)]" />
      <div className="h-12 w-2/3 max-w-md border-[3px] border-[var(--border)] bg-[var(--surface)]" />
      <div className="h-4 w-1/2 max-w-sm border-2 border-[var(--border)] bg-[var(--surface-muted)]" />
      <div className="grid gap-4 pt-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((key) => (
          <div key={key} className="h-32 border-2 border-[var(--border)] bg-[var(--surface)] shadow-[4px_4px_0_var(--border)]" />
        ))}
      </div>
    </div>
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
      <div className="flex min-h-dvh items-center justify-center bg-[var(--paper)]">
        <div className="neo-card flex w-full max-w-sm flex-col items-center gap-6 border-4 p-10 text-center">
          <div className="vector-loader" aria-hidden="true">
            <div className="vl-circle"><div className="vl-dot" /></div>
            <div className="vl-circle"><div className="vl-dot" /></div>
            <div className="vl-circle"><div className="vl-dot" /></div>
            <div className="vl-circle"><div className="vl-dot" /></div>
          </div>
          <p className="text-sm font-black uppercase tracking-widest text-[var(--ink-muted)]">Loading your workspace</p>
          <p className="text-xs font-medium text-[var(--ink-muted)]">Preparing Vector AI</p>
        </div>
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
          <Route
            path="/revision"
            element={(
              <>
                <ScreenReaderTitle>Vector AI Revision</ScreenReaderTitle>
                <Revision />
              </>
            )}
          />
          <Route
            path="/exams"
            element={(
              <>
                <ScreenReaderTitle>Vector AI Mock Exams</ScreenReaderTitle>
                <MockExams />
              </>
            )}
          />
          <Route
            path="/subjects"
            element={(
              <>
                <ScreenReaderTitle>Vector AI Subjects</ScreenReaderTitle>
                <Subjects />
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
