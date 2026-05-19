import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { 
  Send, Plus, MessageSquare, History, Settings, Volume2, 
  ChevronLeft, ChevronRight, Bookmark, CheckCircle, AlertTriangle 
} from 'lucide-react';

const Chat = ({ onMatchAnimation, currentAnimation, onNavigate }) => {
  const { csrfToken } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState('');
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Voice preferences
  const [ttsProvider, setTtsProvider] = useState(() => localStorage.getItem('preferred_tts_provider') || 'camb');
  const [voiceId, setVoiceId] = useState('');
  const [browserVoices, setBrowserVoices] = useState([]);
  
  // Alerts
  const [saveSuccess, setSaveSuccess] = useState('');
  
  const messagesEndRef = useRef(null);

  const voiceProviders = [
    { id: 'camb', name: 'CAMB AI' },
    { id: 'elevenlabs', name: 'ElevenLabs' },
    { id: 'browser', name: 'Speech Synthesis' },
  ];

  const elevenLabsVoices = [
    { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam (US Tutor)' },
    { id: 'N2lVS1w4EtoT3dr4eOWO', name: 'Callum (Transatlantic)' },
    { id: 'JBFqnCBrubYjTQNpc2kc', name: 'George (UK Tutor)' },
    { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie (AU Tutor)' },
    { id: 'D38z5RcWu1voky8WS1ja', name: 'Fin (Irish Tutor)' }
  ];

  const cambVoices = [
    { id: '147320', name: 'CAMB AI Tutor' },
  ];

  const promptChips = [
    "Explain projectile motion for Grade 11 CAPS Physical Sciences.",
    "Explain Newton's second law with a simple example.",
    "Explain collision theory and reaction rates.",
    "How do electric fields work?"
  ];

  // Fetch session history
  const loadSessions = async () => {
    try {
      const res = await fetch('/api/history');
      const data = await res.json();
      if (data.success && Array.isArray(data.sessions)) {
        setSessions(data.sessions);
      }
    } catch (e) {
      console.error('Failed to load history', e);
    }
  };

  // Fetch browser SpeechSynthesis voices
  const updateBrowserVoices = () => {
    if ('speechSynthesis' in window) {
      const voices = window.speechSynthesis.getVoices();
      const englishVoices = voices
        .filter(v => v.lang.toLowerCase().startsWith('en'))
        .sort((a, b) => {
          const aZa = a.lang.toLowerCase().startsWith('en-za');
          const bZa = b.lang.toLowerCase().startsWith('en-za');
          return (bZa ? 1 : 0) - (aZa ? 1 : 0);
        });
      setBrowserVoices(englishVoices);
      if (englishVoices.length > 0 && !voiceId) {
        setVoiceId(englishVoices[0].voiceURI);
      }
    }
  };

  useEffect(() => {
    loadSessions();
    updateBrowserVoices();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateBrowserVoices;
    }
  }, []);

  // Update default voice id when provider changes
  useEffect(() => {
    localStorage.setItem('preferred_tts_provider', ttsProvider);
    if (ttsProvider === 'camb') {
      const saved = localStorage.getItem('preferred_camb_voice') || '147320';
      setVoiceId(saved);
    } else if (ttsProvider === 'elevenlabs') {
      const saved = localStorage.getItem('preferred_elevenlabs_voice') || 'pNInz6obpgDQGcFmaJgB';
      setVoiceId(saved);
    } else {
      const saved = localStorage.getItem('preferred_browser_voice') || '';
      if (saved) {
        setVoiceId(saved);
      } else if (browserVoices.length > 0) {
        setVoiceId(browserVoices[0].voiceURI);
      }
    }
  }, [ttsProvider, browserVoices]);

  // Save selected voice ID
  useEffect(() => {
    if (voiceId) {
      if (ttsProvider === 'camb') {
        localStorage.setItem('preferred_camb_voice', voiceId);
      } else if (ttsProvider === 'elevenlabs') {
        localStorage.setItem('preferred_elevenlabs_voice', voiceId);
      } else {
        localStorage.setItem('preferred_browser_voice', voiceId);
      }
    }
  }, [voiceId, ttsProvider]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  // Start new session
  const handleNewSession = async () => {
    try {
      const res = await fetch('/api/new_session', {
        method: 'POST',
        headers: {
          'X-CSRF-Token': csrfToken,
        }
      });
      const data = await res.json();
      if (data.success) {
        setCurrentSessionId(data.chat_id);
        setMessages([]);
        loadSessions();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Resume session
  const handleResumeSession = async (chatId) => {
    try {
      const res = await fetch(`/api/session/${chatId}`);
      const data = await res.json();
      if (data.success) {
        setCurrentSessionId(chatId);
        setMessages(data.history || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Send message
  const handleSendMessage = async (text) => {
    const question = (text || inputValue).trim();
    if (!question || isSending) return;

    setInputValue('');
    setIsSending(true);
    
    // Add user message
    const updatedMessages = [...messages, { role: 'user', content: question }];
    setMessages(updatedMessages);

    try {
      const response = await fetch('/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ message: question, history: messages }),
      });
      const data = await response.json();
      
      if (data.reply) {
        setMessages([...updatedMessages, { role: 'assistant', content: data.reply }]);
        
        // Trigger simulation matching
        try {
          const matchRes = await fetch('/match-animation', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-Token': csrfToken,
            },
            body: JSON.stringify({ question }),
          });
          const matchData = await matchRes.json();
          if (matchData && matchData.animation_id && onMatchAnimation) {
            onMatchAnimation(matchData.animation_id, matchData.animation_label);
          }
        } catch (_) {}
      } else {
        setMessages([...updatedMessages, { role: 'assistant', content: "I'm having a bit of trouble responding right now. Please try again." }]);
      }
      
      loadSessions();
    } catch (error) {
      setMessages([...updatedMessages, { role: 'assistant', content: 'Connection issue. Could not reach AI Tutor.' }]);
    } finally {
      setIsSending(false);
    }
  };

  // Save response as a Note
  const handleSaveAsNote = async (text) => {
    const topic = text.split(' ').slice(0, 3).join(' ') || 'General';
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({
          title: `Note: ${topic}`,
          content: text,
          topic: topic,
          ai_generated: true
        })
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess('Saved successfully to your Notes vault!');
        setTimeout(() => setSaveSuccess(''), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex h-[calc(100vh-53px)] md:h-screen overflow-hidden relative">
      {/* Session History Sidebar (left inside tab) */}
      <div className={`shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-100/40 dark:bg-zinc-900/30 flex flex-col transition-all duration-300 ${
        sidebarOpen ? 'w-64' : 'w-0 overflow-hidden border-r-0'
      }`}>
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-emerald-500" />
            Sessions
          </h2>
          <button 
            onClick={handleNewSession}
            className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-emerald-500 transition-colors cursor-pointer"
            title="New Chat Session"
          >
            <Plus className="w-4 h-4 stroke-[2.5px]" />
          </button>
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {sessions.length === 0 ? (
            <p className="text-[10px] text-zinc-400 text-center py-8 font-medium">No previous sessions</p>
          ) : (
            sessions.map((sess) => (
              <button
                key={sess.chat_id}
                onClick={() => handleResumeSession(sess.chat_id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold truncate flex items-center gap-2.5 cursor-pointer transition-colors ${
                  currentSessionId === sess.chat_id
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800/50'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{sess.title || 'Untitled Session'}</span>
              </button>
            ))
          )}
        </div>

        {/* Settings Area */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
          <div>
            <label className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-1.5">Voice Synth</label>
            <select
              value={ttsProvider}
              onChange={(e) => setTtsProvider(e.target.value)}
              className="w-full bg-zinc-200 dark:bg-zinc-800/80 border border-zinc-300 dark:border-zinc-700/50 rounded-lg py-1.5 px-2.5 text-xs text-zinc-700 dark:text-zinc-200 focus:outline-none"
            >
              {voiceProviders.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-1.5">Speaker Profile</label>
            <select
              value={voiceId}
              onChange={(e) => setVoiceId(e.target.value)}
              className="w-full bg-zinc-200 dark:bg-zinc-800/80 border border-zinc-300 dark:border-zinc-700/50 rounded-lg py-1.5 px-2.5 text-xs text-zinc-700 dark:text-zinc-200 focus:outline-none"
            >
              {ttsProvider === 'camb' && cambVoices.map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
              {ttsProvider === 'elevenlabs' && elevenLabsVoices.map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
              {ttsProvider === 'browser' && browserVoices.map(v => (
                <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Toggle Sidebar Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute left-0 bottom-4 z-40 p-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-r-lg border border-l-0 border-zinc-300 dark:border-zinc-700 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 cursor-pointer hidden md:block"
      >
        {sidebarOpen ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
      </button>

      {/* Main Chat Workspace */}
      <div className="flex-1 flex flex-col min-w-0 bg-zinc-50 dark:bg-zinc-950">
        {/* Banner Alert for Note Save */}
        {saveSuccess && (
          <div className="absolute top-4 right-4 z-50 p-3 bg-emerald-500 text-zinc-950 text-xs font-semibold rounded-xl flex items-center gap-2 shadow-lg animate-bounce">
            <CheckCircle className="w-4 h-4" />
            {saveSuccess}
          </div>
        )}

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-6">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-lg uppercase tracking-wider">Vector AI Cognitive Agent</h3>
              <p className="text-zinc-400 text-xs mt-2 mb-8 leading-relaxed">
                South Africa's educational chat workspace. Ask any Physical Sciences or Chemistry questions, equations, or CAPS problems, and observe simulations in the Visual Lab.
              </p>
              
              {/* Prompt chips */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
                {promptChips.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(chip)}
                    className="p-3 bg-zinc-200/50 hover:bg-emerald-500/5 dark:bg-zinc-900/40 dark:hover:bg-emerald-500/5 border border-zinc-300/40 dark:border-zinc-800 rounded-xl text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer transition-all hover:border-emerald-500/20"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-w-4xl mx-auto">
              {messages.map((msg, index) => (
                <div 
                  key={index}
                  className={`flex flex-col max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed border ${
                    msg.role === 'user'
                      ? 'bg-zinc-200 border-zinc-300/50 text-zinc-900 dark:bg-zinc-900 dark:border-zinc-800 text-zinc-100 self-end rounded-tr-none'
                      : 'bg-zinc-100 dark:bg-zinc-900/40 border-zinc-200/60 dark:border-zinc-800/40 text-zinc-800 dark:text-zinc-100 self-start rounded-tl-none'
                  }`}
                >
                  <div className="font-extrabold text-[9px] uppercase tracking-wider text-emerald-500 mb-1">
                    {msg.role === 'user' ? 'Student' : 'AI Tutor'}
                  </div>
                  {msg.role === 'user' ? (
                    <p className="whitespace-pre-line font-medium text-xs sm:text-sm">{msg.content}</p>
                  ) : (
                    <div className="relative group">
                      <MarkdownRenderer content={msg.content} />
                      <button
                        onClick={() => handleSaveAsNote(msg.content)}
                        className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-emerald-400 transition-colors cursor-pointer border border-zinc-300/50 dark:border-zinc-800 rounded-lg px-2 py-1 bg-zinc-200/20 dark:bg-zinc-900/50"
                      >
                        <Bookmark className="w-3 h-3" />
                        Save as Note
                      </button>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Typing skeleton */}
              {isSending && (
                <div className="flex flex-col bg-zinc-100 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/40 rounded-2xl rounded-tl-none p-4 max-w-[150px] self-start">
                  <div className="font-extrabold text-[9px] uppercase tracking-wider text-emerald-500 mb-2">AI Tutor</div>
                  <div className="flex gap-1.5 items-center py-1">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-100/40 dark:bg-zinc-900/10">
          <div className="max-w-4xl mx-auto flex items-center gap-2">
            <textarea
              rows={1}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ask a scientific inquiry..."
              className="flex-1 bg-zinc-200/55 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800/80 focus:border-emerald-500/40 rounded-xl py-3 px-4 text-xs sm:text-sm focus:outline-none resize-none max-h-32 text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-500"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isSending || !inputValue.trim()}
              className="p-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-300 dark:disabled:bg-zinc-900 disabled:text-zinc-500 text-zinc-950 font-bold rounded-xl shadow-lg shadow-emerald-500/10 transition-all cursor-pointer flex items-center justify-center"
            >
              <Send className="w-4 h-4 fill-current" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
