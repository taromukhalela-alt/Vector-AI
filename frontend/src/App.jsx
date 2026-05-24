import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Chat from './pages/Chat';
import Voice from './pages/Voice';
import Lab from './pages/Lab';
import Notes from './pages/Notes';
import History from './pages/History';
import Topics from './pages/Topics';

function App() {
  const { isAuthenticated, loading, csrfToken } = useAuth();
  const [currentTab, setCurrentTab] = useState('chat');
  const [unauthPage, setUnauthPage] = useState('landing'); // 'landing' or 'auth'
  
  // Cross-page shared states
  const [activeAnim, setActiveAnim] = useState('idle');
  const [sharedTriggerPrompt, setSharedTriggerPrompt] = useState('');
  const [resumeChatId, setResumeChatId] = useState('');

  // Handle page loading spinner
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

  // Handle unauthenticated views
  if (!isAuthenticated) {
    if (unauthPage === 'landing') {
      return <Landing onNavigate={setUnauthPage} />;
    }
    return <Auth onNavigate={(page) => {
      if (page === 'chat') {
        setUnauthPage('landing');
      } else {
        setUnauthPage(page);
      }
    }} />;
  }

  // Sync animation matches from Chat/Voice tabs
  const handleMatchAnimation = (animId) => {
    setActiveAnim(animId);
  };

  // Sync topic selections from Syllabus Tab to Chat
  const handleSelectTopic = (promptText) => {
    setSharedTriggerPrompt(promptText);
    setCurrentTab('chat');
  };

  // Resume archived sessions
  const handleResumeSession = (chatId) => {
    setResumeChatId(chatId);
    setCurrentTab('chat');
  };

  return (
    <Layout currentTab={currentTab} onTabChange={setCurrentTab}>
      {currentTab === 'chat' && (
        <Chat 
          onMatchAnimation={handleMatchAnimation} 
          currentAnimation={activeAnim}
          initialPrompt={sharedTriggerPrompt}
          resumeChatId={resumeChatId}
          onNavigate={(page) => {
            if (page === 'auth') setUnauthPage('auth');
          }}
        />
      )}
      {currentTab === 'voice' && (
        <Voice 
          onMatchAnimation={handleMatchAnimation}
          csrfToken={csrfToken}
        />
      )}
      {currentTab === 'lab' && (
        <Lab 
          activeAnim={activeAnim} 
          onAnimChange={setActiveAnim} 
        />
      )}
      {currentTab === 'notes' && (
        <Notes />
      )}
      {currentTab === 'history' && (
        <History onResumeSession={handleResumeSession} />
      )}
      {currentTab === 'topics' && (
        <Topics onSelectTopic={handleSelectTopic} />
      )}
    </Layout>
  );
}

export default App;
