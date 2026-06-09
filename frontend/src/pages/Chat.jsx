import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { trackEvent } from '../useAnalytics';
import { useToast } from '../context/ToastContext';
import {
  Send, Plus, MessageSquare, History,
  ChevronLeft, ChevronRight, Bookmark, X, Atom, Sparkles, Mic, MicOff, Loader2, Zap
} from 'lucide-react';

const Chat = ({ onMatchAnimation, initialPrompt, resumeChatId }) => {
  const { csrfToken } = useAuth();
  const { showToast } = useToast();
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState('');
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );
  const [sidebarPinned, setSidebarPinned] = useState(() =>
    typeof window !== 'undefined'
      ? localStorage.getItem('vector_chat_sidebar_pinned') === 'true'
      : false
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 768;
      setIsDesktop(desktop);
      if (desktop) setSidebarOpen(false);
    };
    if (typeof window !== 'undefined') {
      handleResize();
      window.addEventListener('resize', handleResize);
    }
    return () => { if (typeof window !== 'undefined') window.removeEventListener('resize', handleResize); };
  }, []);

  const [ttsProvider, setTtsProvider] = useState(() => localStorage.getItem('preferred_tts_provider') || 'camb');
  const [voiceId, setVoiceId] = useState('');
  const [browserVoices, setBrowserVoices] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);
  const interimTranscriptRef = useRef('');

  const messagesEndRef = useRef(null);
  const consumedPromptRef = useRef('');
  const consumedResumeRef = useRef('');
  const textareaRef = useRef(null);
  const sidebarVisible = isDesktop ? (sidebarPinned || sidebarOpen) : sidebarOpen;

  const toggleSidebar = () => {
    if (isDesktop) {
      setSidebarPinned(current => {
        const next = !current;
        localStorage.setItem('vector_chat_sidebar_pinned', String(next));
        return next;
      });
      setSidebarOpen(false);
      return;
    }
    setSidebarOpen(true);
  };

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
    { id: 'D38z5RcWu1voky8WS1ja', name: 'Fin (Irish Tutor)' },
  ];

  const cambVoices = [{ id: '147320', name: 'Silas Blackwood' }];

  const promptChips = [
    "Explain projectile motion for Grade 11 CAPS.",
    "Explain Newton's second law with a worked example.",
    "Explain collision theory and reaction rates.",
    "How do electric fields and Coulomb's Law work?",
  ];

  const loadSessions = async () => {
    try {
      const res = await fetch('/api/history');
      const data = await res.json();
      if (data.success && Array.isArray(data.sessions)) setSessions(data.sessions);
    } catch (e) { console.error('Failed to load history', e); }
  };

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
      if (englishVoices.length > 0 && !voiceId) setVoiceId(englishVoices[0].voiceURI);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSessions();
    updateBrowserVoices();
    if ('speechSynthesis' in window) window.speechSynthesis.onvoiceschanged = updateBrowserVoices;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    localStorage.setItem('preferred_tts_provider', ttsProvider);
    /* eslint-disable react-hooks/set-state-in-effect */
    if (ttsProvider === 'camb') {
      setVoiceId(localStorage.getItem('preferred_camb_voice') || '147320');
    } else if (ttsProvider === 'elevenlabs') {
      setVoiceId(localStorage.getItem('preferred_elevenlabs_voice') || 'pNInz6obpgDQGcFmaJgB');
    } else {
      const saved = localStorage.getItem('preferred_browser_voice') || '';
      if (saved) setVoiceId(saved);
      else if (browserVoices.length > 0) setVoiceId(browserVoices[0].voiceURI);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [ttsProvider, browserVoices]);

  useEffect(() => {
    if (voiceId) {
      if (ttsProvider === 'camb') localStorage.setItem('preferred_camb_voice', voiceId);
      else if (ttsProvider === 'elevenlabs') localStorage.setItem('preferred_elevenlabs_voice', voiceId);
      else localStorage.setItem('preferred_browser_voice', voiceId);
    }
  }, [voiceId, ttsProvider]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const handleNewSession = async () => {
    try {
      const res = await fetch('/api/new_session', {
        method: 'POST',
        headers: { 'X-CSRF-Token': csrfToken },
      });
      const data = await res.json();
      if (data.success) { setCurrentSessionId(data.chat_id); setMessages([]); loadSessions(); }
    } catch (e) { console.error(e); }
  };

  const handleResumeSession = async (chatId) => {
    try {
      const res = await fetch(`/api/session/${chatId}`);
      const data = await res.json();
      if (data.success) { setCurrentSessionId(chatId); setMessages(data.history || []); }
    } catch (e) { console.error(e); }
  };

  const stopDictation = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* noop */ }
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try { mediaRecorderRef.current.stop(); } catch { /* noop */ }
    }
    setIsRecording(false);
  };

  const toggleDictation = async () => {
    if (isRecording) {
      stopDictation();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mr.onstop = async () => {
        setIsRecording(false);
        setIsProcessingAudio(true);
        stream.getTracks().forEach(t => t.stop());
        
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        let whisperSuccess = false;
        if (audioBlob.size > 0) {
          try {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'chat_dictation.webm');
            const res = await fetch('/api/stt', {
              method: 'POST',
              headers: { 'X-CSRF-Token': csrfToken },
              body: formData
            });
            const data = await res.json();
            if (data.success && data.text) {
              setInputValue(prev => {
                const newText = prev + (prev ? ' ' : '') + data.text;
                return newText;
              });
              whisperSuccess = true;
            }
          } catch (e) {
            console.error('STT error', e);
          }
        }
        
        // Fallback to browser STT if Whisper failed
        if (!whisperSuccess && interimTranscriptRef.current) {
          setInputValue(prev => {
            const newText = prev + (prev ? ' ' : '') + interimTranscriptRef.current;
            return newText;
          });
        }
        setIsProcessingAudio(false);
      };
      
      mediaRecorderRef.current = mr;
      mr.start();
      setIsRecording(true);

      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SR) {
        const rec = new SR();
        rec.continuous = false;
        rec.interimResults = true;
        rec.lang = 'en-ZA';
        
        rec.onstart = () => { interimTranscriptRef.current = ''; };
        rec.onresult = (e) => {
          let interim = '';
          let final = '';
          for (let i = e.resultIndex; i < e.results.length; i++) {
            if (e.results[i].isFinal) final += e.results[i][0].transcript;
            else interim += e.results[i][0].transcript;
          }
          interimTranscriptRef.current = (final + ' ' + interim).trim();
        };
        rec.onend = () => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
          }
        };
        
        recognitionRef.current = rec;
        rec.start();
      }

    } catch (e) {
      console.error('Microphone error', e);
      showToast({
        type: 'error',
        title: 'Microphone unavailable',
        message: 'Please allow microphone access in your browser, then try recording again.',
      });
    }
  };

  const handleSendMessage = async (text) => {
    const question = (text || inputValue).trim();
    if (!question || isSending) return;
    setInputValue('');
    setIsSending(true);
    const updatedMessages = [...messages, { role: 'user', content: question }];
    setMessages(updatedMessages);
    try {
      trackEvent('chat_message_sent', { route: '/chat', message_length: question.length });
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify({ message: question, history: messages }),
      });
      const data = await response.json();
      if (data.reply) {
        trackEvent('chat_response_received', { route: '/chat' });
        setMessages([...updatedMessages, { role: 'assistant', content: data.reply }]);
        try {
          const matchRes = await fetch('/match-animation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
            body: JSON.stringify({ question }),
          });
          const matchData = await matchRes.json();
          if (matchData?.animation_id && onMatchAnimation) {
            onMatchAnimation(matchData.animation_id, matchData.animation_label);
          }
        } catch (matchError) { console.warn('Simulation match failed', matchError); }
      } else {
        setMessages([...updatedMessages, { role: 'assistant', content: "I'm having a bit of trouble responding right now. Please try again." }]);
      }
      loadSessions();
    } catch {
      setMessages([...updatedMessages, { role: 'assistant', content: 'Connection issue. Could not reach AI Tutor.' }]);
    } finally { setIsSending(false); }
  };

  useEffect(() => {
    if (!initialPrompt || consumedPromptRef.current === initialPrompt) return;
    consumedPromptRef.current = initialPrompt;
    handleSendMessage(initialPrompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt]);

  useEffect(() => {
    if (!resumeChatId || consumedResumeRef.current === resumeChatId) return;
    consumedResumeRef.current = resumeChatId;
    handleResumeSession(resumeChatId);
  }, [resumeChatId]);

  const handleSaveAsNote = async (text) => {
    const topic = text.split(' ').slice(0, 3).join(' ') || 'General';
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify({ title: `Note: ${topic}`, content: text, topic, ai_generated: true }),
      });
      const data = await res.json();
      if (data.success) {
        trackEvent('note_saved_from_chat', { route: '/chat' });
        showToast({
          type: 'success',
          title: 'Saved to Notes',
          message: 'The answer was added to your Notes Vault.',
        });
      }
    } catch (err) { console.error(err); }
  };

  /* ── Shared select style ── */
  const selectStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: '8px',
    padding: '7px 10px',
    fontSize: '11px',
    color: '#d4d4d8',
    outline: 'none',
    cursor: 'pointer',
  };

  return (
    <div className="relative flex h-full min-h-0 overflow-hidden bg-zinc-950 text-zinc-100 dark:bg-zinc-950 dark:text-zinc-100 light:bg-zinc-50 light:text-zinc-950">

      {/* Sidebar mobile overlay */}
      {sidebarVisible && !isDesktop && (
        <div className="fixed inset-0 z-[130] bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Session Sidebar ── */}
      <aside className={`shrink-0 flex flex-col transition-all duration-300 ${
        sidebarVisible
          ? 'fixed inset-y-0 left-0 z-[140] w-72 shadow-2xl md:static md:z-auto md:w-64 md:shadow-none'
          : 'hidden'
      } bg-zinc-950/95 border-r border-zinc-800/40 backdrop-blur-md dark:bg-zinc-950/95 dark:border-zinc-800/40 light:bg-white/90 light:border-zinc-200/30`}>
        {/* Sidebar Header */}
        <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <h2 className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 text-zinc-400">
            <History className="w-3.5 h-3.5 text-emerald-400" />
            Sessions
          </h2>
          <div className="flex items-center gap-1">
            <button
              id="new-session-sidebar-btn"
              onClick={handleNewSession}
              className="p-1.5 rounded-lg text-emerald-400 transition-all cursor-pointer hover:bg-emerald-500/10"
              title="New Session"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
            </button>
            <button
              onClick={() => { setSidebarPinned(false); localStorage.setItem('vector_chat_sidebar_pinned', 'false'); setSidebarOpen(false); }}
              className="p-1.5 rounded-lg text-zinc-600 transition-all cursor-pointer hover:bg-zinc-800/60 hover:text-zinc-400"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {sessions.length === 0 ? (
            <div className="text-center py-10">
              <MessageSquare className="w-6 h-6 text-zinc-700 mx-auto mb-2" />
              <p className="text-[10px] text-zinc-600 font-medium">No previous sessions</p>
            </div>
          ) : (
            sessions.map((sess) => (
              <button
                key={sess.chat_id}
                onClick={() => handleResumeSession(sess.chat_id)}
                className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold truncate flex items-center gap-2.5 cursor-pointer transition-all"
                style={currentSessionId === sess.chat_id ? {
                  background: 'rgba(16,185,129,0.10)',
                  color: '#10b981',
                  border: '1px solid rgba(16,185,129,0.18)',
                } : {
                  color: '#71717a',
                  background: 'transparent',
                  border: '1px solid transparent',
                }}
                onMouseEnter={e => { if (currentSessionId !== sess.chat_id) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                onMouseLeave={e => { if (currentSessionId !== sess.chat_id) e.currentTarget.style.background = 'transparent'; }}
              >
                <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{sess.title || 'Untitled Session'}</span>
              </button>
            ))
          )}
        </div>

        {/* Voice Settings */}
        <div className="p-3 space-y-3 border-t border-zinc-800/50 bg-zinc-950/80 dark:border-zinc-800/50 dark:bg-zinc-950/80 light:border-zinc-200/30 light:bg-white/80">
          <div>
            <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest block mb-1.5">Voice Synth</label>
            <select value={ttsProvider} onChange={e => setTtsProvider(e.target.value)} style={selectStyle}>
              {voiceProviders.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest block mb-1.5">Speaker Profile</label>
            <select value={voiceId} onChange={e => setVoiceId(e.target.value)} style={selectStyle}>
              {ttsProvider === 'camb' && cambVoices.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              {ttsProvider === 'elevenlabs' && elevenLabsVoices.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              {ttsProvider === 'browser' && browserVoices.map(v => <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>)}
            </select>
          </div>
        </div>
      </aside>

      {/* ── Main Chat Workspace ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Toolbar */}
        <div className="flex h-11 shrink-0 items-center justify-between px-4 border-b border-zinc-800/40 bg-zinc-950/90 dark:border-zinc-800/40 dark:bg-zinc-950/90 light:border-zinc-200/30 light:bg-white/90">
          <button
            id="toggle-sidebar-btn"
            onClick={toggleSidebar}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 transition-all hover:text-zinc-200 hover:bg-zinc-800/60 cursor-pointer"
            title={sidebarVisible ? 'Hide sessions' : 'Show sessions'}
          >
            {sidebarVisible ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            Sessions
          </button>

          <button
            id="new-session-btn"
            onClick={handleNewSession}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all"
            style={{
              background: 'rgba(16,185,129,0.12)',
              color: '#10b981',
              border: '1px solid rgba(16,185,129,0.20)',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(16,185,129,0.20)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(16,185,129,0.12)'}
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            New
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 min-h-0 overflow-y-auto px-3 py-4 sm:px-6 sm:py-5 bg-zinc-950 dark:bg-zinc-950 light:bg-zinc-50">
          {messages.length === 0 ? (
            /* Empty State */
            <div className="mx-auto flex min-h-full max-w-2xl flex-col items-center justify-center py-8 sm:py-10 text-center px-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-4 sm:mb-6"
                style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(45,212,191,0.08))', border: '1px solid rgba(16,185,129,0.18)' }}
              >
                <Zap className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-400" strokeWidth={1.8} />
              </div>
              <h3 className="font-extrabold text-base sm:text-lg tracking-tight text-zinc-100 mb-1 sm:mb-2 dark:text-zinc-100 light:text-zinc-950">Vector AI</h3>
              <p className="text-zinc-500 text-xs sm:text-sm leading-relaxed mb-6 sm:mb-8 max-w-xs dark:text-zinc-500 light:text-zinc-600">
                Ask questions about CAPS Physical Sciences or Chemistry.
              </p>

              {/* Prompt chips */}
              <div className="flex flex-col w-full gap-2">
                {promptChips.map((chip, idx) => (
                  <button
                    key={idx}
                    id={`chip-${idx}`}
                    onClick={() => handleSendMessage(chip)}
                    className="rounded-lg p-3 sm:p-4 text-left text-xs sm:text-sm font-medium text-zinc-400 transition-all cursor-pointer hover:bg-zinc-800/70 hover:text-zinc-100 bg-zinc-950/70 border border-zinc-800/40 dark:bg-zinc-950/70 dark:border-zinc-800/40 light:bg-zinc-100 light:border-zinc-200/60 light:text-zinc-900 active:scale-95"
                  >
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 mb-1.5" />
                    <div className="font-medium text-xs sm:text-sm leading-snug">{chip}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Messages */
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-2 sm:gap-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={
                      `rounded-2xl p-3 sm:p-4 text-xs sm:text-sm leading-relaxed break-words max-w-[95%] sm:max-w-[80%] ${msg.role === 'user' ? 'rounded-br-none bg-gradient-to-br from-emerald-500/15 to-teal-500/10 border border-emerald-500/20 text-zinc-950' : 'rounded-bl-none bg-zinc-950/70 border border-zinc-800/40 text-zinc-100 shadow-sm light:bg-white/85 light:border-zinc-200/30 light:text-zinc-950'}`
                    }
                  >
                    <div className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-emerald-400 mb-1 sm:mb-2">
                      {msg.role === 'user' ? 'You' : 'AI'}
                    </div>
                    {msg.role === 'user' ? (
                      <p className="whitespace-pre-line font-medium text-xs sm:text-sm">{msg.content}</p>
                    ) : (
                      <div>
                        <MarkdownRenderer content={msg.content} />
                        <button
                          onClick={() => handleSaveAsNote(msg.content)}
                          className="mt-2 sm:mt-3 inline-flex items-center gap-1 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer rounded-md px-2 py-1"
                          style={{
                            color: '#52525b',
                            border: '1px solid rgba(255,255,255,0.07)',
                            background: 'rgba(255,255,255,0.03)',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#10b981'; e.currentTarget.style.borderColor = 'rgba(16,185,129,0.22)'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = '#52525b'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}
                        >
                          <Bookmark className="w-3 h-3" />
                          Save
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isSending && (
                <div className="flex flex-col self-start max-w-[140px]">
                  <div className="rounded-2xl rounded-bl-none p-3 sm:p-4 bg-zinc-950/70 border border-zinc-800/40 dark:bg-zinc-950/70 dark:border-zinc-800/40 light:bg-white/85 light:border-zinc-200/30">
                    <div className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-emerald-400 mb-1.5">AI</div>
                    <div className="flex gap-1 items-center">
                      {[0,1,2].map(i => (
                        <span key={i} className="typing-dot w-1.5 h-1.5 rounded-full"
                          style={{ background: '#10b981' }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* ── Input Bar ── */}
        <div className="shrink-0 p-3 sm:p-4 border-t border-zinc-800/40 bg-zinc-950/95 dark:border-zinc-800/40 dark:bg-zinc-950/95 light:border-zinc-200/30 light:bg-white/90">
          <div className="mx-auto flex max-w-3xl flex-col gap-2 sm:gap-3">
            <div className="flex items-end gap-2 sm:gap-3">
              <textarea
                ref={textareaRef}
                id="chat-input"
                rows={1}
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
                }}
                placeholder="Ask something..."
                className="flex-1 resize-none max-h-24 text-xs sm:text-sm py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl transition-all bg-zinc-950/70 border border-zinc-800/40 text-zinc-100 outline-none font-sans dark:bg-zinc-950/70 dark:border-zinc-800/40 dark:text-zinc-100 light:bg-zinc-100 light:border-zinc-200 light:text-zinc-950"
                onFocus={e => { e.target.style.borderColor = 'rgba(16,185,129,0.35)'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.06)'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.09)'; e.target.style.boxShadow = 'none'; }}
              />
              <button
                id="dictate-btn"
                onClick={toggleDictation}
                disabled={isProcessingAudio}
                className={`p-2.5 sm:p-3 rounded-lg sm:rounded-xl cursor-pointer transition-all flex items-center justify-center shrink-0 active:scale-95 ${
                  isRecording ? 'bg-red-500/20 text-red-500 border border-red-500/30 animate-pulse' : 'bg-zinc-800/50 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 border border-zinc-800/60'
                }`}
                title="Voice input"
                aria-label="Record voice"
              >
                {isProcessingAudio ? <Loader2 className="w-4 h-4 animate-spin" /> : isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              <button
                id="send-btn"
                onClick={() => handleSendMessage()}
                disabled={isSending || !inputValue.trim()}
                className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl cursor-pointer transition-all flex items-center justify-center shrink-0 active:scale-95"
                style={{
                  background: (!isSending && inputValue.trim()) ? 'linear-gradient(135deg, #10b981, #2dd4bf)' : 'rgba(255,255,255,0.05)',
                  color: (!isSending && inputValue.trim()) ? '#09090b' : '#3f3f46',
                  boxShadow: (!isSending && inputValue.trim()) ? '0 4px 16px rgba(16,185,129,0.25)' : 'none',
                }}
                aria-label="Send message"
              >
                <Send className="w-4 h-4 fill-current" />
              </button>
            </div>
            <p className="text-center text-[9px] sm:text-[10px] text-zinc-700 font-medium dark:text-zinc-700 light:text-zinc-400">Enter to send · Shift+Enter for newline</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
