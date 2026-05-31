import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import useAnalytics from './useAnalytics';
import Layout from './components/Layout';
import ToastProvider from './components/ToastProvider';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Chat from './pages/Chat';
import Voice from './pages/Voice';
import Lab from './pages/Lab';
import Notes from './pages/Notes';
import History from './pages/History';
import Topics from './pages/Topics';

const ScreenReaderTitle = ({ children }) => (
  <h1 className="sr-only">{children}</h1>
);

function App() {
  const { isAuthenticated, loading, csrfToken } = useAuth();
  const navigate = useNavigate();

  useAnalytics();

  const [activeAnim, setActiveAnim] = useState('idle');
  const [sharedTriggerPrompt, setSharedTriggerPrompt] = useState('');
  const [resumeChatId, setResumeChatId] = useState('');

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Loading STEM OS...</span>
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
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/chat" replace />} />
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
          <Route path="/auth" element={<Navigate to="/chat" replace />} />
          <Route path="*" element={<Navigate to="/chat" replace />} />
        </Routes>
      </Layout>
    </ToastProvider>
  );
}

export default App;
