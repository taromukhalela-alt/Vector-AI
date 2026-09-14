import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { useAuth } from './context/AuthContext';
import useAnalytics from './useAnalytics';
import Layout from './components/Layout';
import ToastProvider from './components/ToastProvider';
import Onboarding from './components/Onboarding';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Chat from './pages/Chat';
import Voice from './pages/Voice';
import Lab from './pages/Lab';
import Notes from './pages/Notes';
import History from './pages/History';
import Topics from './pages/Topics';
import Dashboard from './pages/Dashboard';

const ScreenReaderTitle = ({ children }) => (
  <h1 className="sr-only">{children}</h1>
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
        <div className="flex w-full max-w-xs flex-col items-center gap-4 rounded-xl border border-[var(--clr-border)] bg-[var(--clr-surface)] p-8 text-center shadow-[var(--shadow-sm)]">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--clr-primary)] text-lg font-bold text-white">V</div>
          <div><p className="text-sm font-semibold">Loading your workspace</p><p className="mt-1 text-xs text-[var(--clr-text-3)]">Preparing Vector AI</p></div>
          <div className="h-1 w-24 overflow-hidden rounded-full bg-[var(--clr-surface-3)]"><div className="h-full w-1/2 animate-pulse rounded-full bg-[var(--clr-primary)]" /></div>
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
        <Routes>
          <Route path="/auth" element={<Auth onNavigate={handleAuthNavigation} />} />
          <Route path="*" element={<Landing onNavigate={handleAuthNavigation} />} />
        </Routes>
        <Analytics />
        <SpeedInsights />
      </ToastProvider>
    );
  }

  if (location.pathname === '/') {
    return (
      <ToastProvider>
        <Landing onNavigate={handleAuthNavigation} />
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
      </Layout>
      <Analytics />
      <SpeedInsights />
    </ToastProvider>
  );
}

export default App;
