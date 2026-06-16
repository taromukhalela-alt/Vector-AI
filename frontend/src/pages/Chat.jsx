import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { trackEvent } from '../useAnalytics';
import { useToast } from '../context/ToastContext';
import {
  Send, Plus, MessageSquare, History,
  ChevronLeft, ChevronRight, Bookmark, X, Sparkles, Mic, MicOff,
  Loader2, Zap, Brain, Trash2, RefreshCw, Tag, BookOpen,
  TrendingUp, Target, Clock, ChevronDown, ChevronUp,
} from 'lucide-react';

// ─── Memory Panel Component ────────────────────────────────────────────────────
const MemoryPanel = ({ memory, isLoading, onClear, onRefresh, userName }) => {
  const [expanded, setExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="px-3 py-3 border-b border-white/[0.05]">
        <div className="flex items-center gap-2 text-zinc-500">
          <Brain className="w-3.5 h-3.5 animate-pulse text-emerald-500" />
          <span className="text-[11px]">Loading memory…</span>
        </div>
      </div>
    );
  }

  if (!memory) {
    return (
      <div className="px-3 py-3 border-b border-white/[0.05]">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <Brain className="w-3.5 h-3.5 text-zinc-600" />
            <span className="text-[10.5px] font-semibold text-zinc-500">Student Memory</span>
          </div>
          <button
            onClick={onRefresh}
            className="p-1 rounded text-zinc-600 hover:text-emerald-400 transition-colors"
            title="Refresh memory"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
        <p className="text-[10px] text-zinc-600 leading-relaxed">
          No memory yet. Start chatting and the AI will remember your learning profile.
        </p>
      </div>
    );
  }

  const { focus_topics = [], strengths = [], needs_practice = [], recent_context = '', study_preferences = [] } = memory;
  const hasContent = focus_topics.length || strengths.length || needs_practice.length || recent_context || study_preferences.length;

  return (
    <div className="border-b border-white/[0.05]">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-1.5">
          <Brain className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[10.5px] font-semibold text-zinc-300">
            {userName ? `${userName.split(' ')[0]}'s Memory` : 'Student Memory'}
          </span>
          {hasContent && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Memory active" />
          )}
        </div>
        {expanded ? (
          <ChevronUp className="w-3 h-3 text-zinc-500" />
        ) : (
          <ChevronDown className="w-3 h-3 text-zinc-500" />
        )}
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-2.5">
          {focus_topics.length > 0 && (
            <div>
              <div className="flex items-center gap-1 mb-1">
                <Tag className="w-2.5 h-2.5 text-emerald-400" />
                <span className="text-[9.5px] font-bold uppercase tracking-wider text-emerald-400">Focus Topics</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {focus_topics.map((t, i) => (
                  <span key={i} className="px-1.5 py-0.5 rounded-md bg-emerald-500/[0.10] border border-emerald-500/20 text-[9.5px] text-emerald-300 font-medium">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {strengths.length > 0 && (
            <div>
              <div className="flex items-center gap-1 mb-1">
                <TrendingUp className="w-2.5 h-2.5 text-emerald-400" />
                <span className="text-[9.5px] font-bold uppercase tracking-wider text-emerald-400">Strengths</span>
              </div>
              <ul className="space-y-0.5">
                {strengths.slice(0, 3).map((s, i) => (
                  <li key={i} className="text-[10px] text-zinc-400 leading-snug flex items-start gap-1">
                    <span className="text-emerald-400 mt-0.5 shrink-0">·</span>{s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {needs_practice.length > 0 && (
            <div>
              <div className="flex items-center gap-1 mb-1">
                <Target className="w-2.5 h-2.5 text-emerald-400" />
                <span className="text-[9.5px] font-bold uppercase tracking-wider text-emerald-400">Needs Practice</span>
              </div>
              <ul className="space-y-0.5">
                {needs_practice.slice(0, 3).map((n, i) => (
                  <li key={i} className="text-[10px] text-zinc-400 leading-snug flex items-start gap-1">
                    <span className="text-emerald-400 mt-0.5 shrink-0">·</span>{n}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {recent_context && (
            <div>
              <div className="flex items-center gap-1 mb-1">
                <Clock className="w-2.5 h-2.5 text-zinc-400" />
                <span className="text-[9.5px] font-bold uppercase tracking-wider text-zinc-500">Recent Context</span>
              </div>
              <p className="text-[10px] text-zinc-500 leading-relaxed line-clamp-3">{recent_context}</p>
            </div>
          )}

          {study_preferences.length > 0 && (
            <div>
              <div className="flex items-center gap-1 mb-1">
                <BookOpen className="w-2.5 h-2.5 text-emerald-400" />
                <span className="text-[9.5px] font-bold uppercase tracking-wider text-emerald-400">Preferences</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {study_preferences.map((p, i) => (
                  <span key={i} className="px-1.5 py-0.5 rounded-md bg-emerald-500/[0.08] border border-emerald-500/20 text-[9.5px] text-emerald-300 font-medium">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1 border-t border-white/[0.04]">
            <button
              onClick={onRefresh}
              className="flex items-center gap-1 text-[9.5px] text-zinc-500 hover:text-emerald-400 transition-colors"
            >
              <RefreshCw className="w-2.5 h-2.5" />
              Refresh
            </button>
            <button
              onClick={onClear}
              className="flex items-center gap-1 text-[9.5px] text-zinc-500 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-2.5 h-2.5" />
              Clear memory
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Chat Component ───────────────────────────────────────────────────────
const Chat = ({ onMatchAnimation, initialPrompt, resumeChatId }) => {
  const { csrfToken, user } = useAuth();
  const { showToast } = useToast();

  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState('');
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Tool Toggles
  const [enableSearch, setEnableSearch] = useState(true);
  const [enableCode, setEnableCode] = useState(true);

  // Memory/RAG state
  const [memory, setMemory] = useState(null);
  const [memoryLoading, setMemoryLoading] = useState(true);

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
    setSidebarOpen(prev => !prev);
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
    { title: "Projectile motion", sub: "Grade 11 CAPS, with worked example", prompt: "Explain projectile motion for Grade 11 CAPS." },
    { title: "Newton's second law", sub: "F = ma with intuition", prompt: "Explain Newton's second law with a worked example." },
    { title: "Reaction rates", sub: "Collision theory & catalysts", prompt: "Explain collision theory and reaction rates." },
    { title: "Electric fields", sub: "Coulomb's law visualised", prompt: "How do electric fields and Coulomb's Law work?" },
  ];

  // ─── Load memory ────────────────────────────────────────────────────────────
  const loadMemory = useCallback(async () => {
    setMemoryLoading(true);
    try {
      const res = await fetch('/api/memory');
      const data = await res.json();
      if (data.success) setMemory(data.memory);
    } catch (e) {
      console.warn('Failed to load memory', e);
    } finally {
      setMemoryLoading(false);
    }
  }, []);

  const handleClearMemory = async () => {
    if (!confirm('Clear your learning memory? The AI will start fresh on your next conversation.')) return;
    try {
      const res = await fetch('/api/memory', {
        method: 'DELETE',
        headers: { 'X-CSRF-Token': csrfToken },
      });
      const data = await res.json();
      if (data.success) {
        setMemory(null);
        showToast({ type: 'success', title: 'Memory cleared', message: 'Your learning profile has been reset.' });
      }
    } catch (e) {
      console.warn('Failed to clear memory', e);
    }
  };

  const handleRefreshMemory = async () => {
    try {
      const res = await fetch('/api/memory/update', {
        method: 'POST',
        headers: { 'X-CSRF-Token': csrfToken },
      });
      const data = await res.json();
      if (data.success) {
        setMemory(data.memory);
        showToast({ type: 'success', title: 'Memory updated', message: 'Your learning profile has been refreshed.' });
      }
    } catch (e) {
      console.warn('Failed to refresh memory', e);
    }
  };

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
    loadSessions();
    loadMemory();
    updateBrowserVoices();
    if ('speechSynthesis' in window) window.speechSynthesis.onvoiceschanged = updateBrowserVoices;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    localStorage.setItem('preferred_tts_provider', ttsProvider);
    if (ttsProvider === 'camb') setVoiceId(localStorage.getItem('preferred_camb_voice') || '147320');
    else if (ttsProvider === 'elevenlabs') setVoiceId(localStorage.getItem('preferred_elevenlabs_voice') || 'pNInz6obpgDQGcFmaJgB');
    else {
      const saved = localStorage.getItem('preferred_browser_voice') || '';
      if (saved) setVoiceId(saved);
      else if (browserVoices.length > 0) setVoiceId(browserVoices[0].voiceURI);
    }
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

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  }, [inputValue]);

  const handleNewSession = async () => {
    try {
      const res = await fetch('/api/new_session', {
        method: 'POST',
        headers: { 'X-CSRF-Token': csrfToken },
      });
      const data = await res.json();
      if (data.success) {
        setCurrentSessionId(data.chat_id);
        setMessages([]);
        loadSessions();
        if (!isDesktop) setSidebarOpen(false);
      }
    } catch (e) { console.error(e); }
  };

  const handleResumeSession = async (chatId) => {
    try {
      const res = await fetch(`/api/session/${chatId}`);
      const data = await res.json();
      if (data.success) {
        setCurrentSessionId(chatId);
        setMessages(data.history || []);
        if (!isDesktop) setSidebarOpen(false);
      }
    } catch (e) { console.error(e); }
  };

  const stopDictation = () => {
    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch { /* noop */ } }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try { mediaRecorderRef.current.stop(); } catch { /* noop */ }
    }
    setIsRecording(false);
  };

  const toggleDictation = async () => {
    if (isRecording) { stopDictation(); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
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
              body: formData,
            });
            const data = await res.json();
            if (data.success && data.text) {
              setInputValue(prev => prev + (prev ? ' ' : '') + data.text);
              whisperSuccess = true;
            }
          } catch (e) { console.error('STT error', e); }
        }
        if (!whisperSuccess && interimTranscriptRef.current) {
          setInputValue(prev => prev + (prev ? ' ' : '') + interimTranscriptRef.current);
        }
        setIsProcessingAudio(false);
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setIsRecording(true);
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SR) {
        const rec = new SR();
        rec.continuous = false; rec.interimResults = true; rec.lang = 'en-ZA';
        rec.onstart = () => { interimTranscriptRef.current = ''; };
        rec.onresult = (e) => {
          let interim = '', final = '';
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
      showToast({ type: 'error', title: 'Microphone unavailable', message: 'Please allow microphone access in your browser.' });
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
        body: JSON.stringify({ 
          message: question, 
          history: messages,
          enable_search: enableSearch,
          enable_code: enableCode
        }),
      });
      const data = await response.json();
      if (data.reply) {
        trackEvent('chat_response_received', { route: '/chat' });
        setMessages([...updatedMessages, { 
          role: 'assistant', 
          content: data.reply,
          tool_metadata: data.tool_metadata 
        }]);

        // Refresh memory after every AI response (the backend auto-updates it)
        loadMemory();

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
    } finally {
      setIsSending(false);
    }
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
        showToast({ type: 'success', title: 'Saved to Notes', message: 'The answer was added to your Notes Vault.' });
      }
    } catch (err) { console.error(err); }
  };

  const selectClass = "w-full bg-white/[0.03] border border-white/[0.07] rounded-md px-2.5 py-1.5 text-[12px] text-zinc-200 outline-none focus:border-emerald-500/40 cursor-pointer";

  // ─── Memory-aware greeting ──────────────────────────────────────────────────
  const getGreeting = () => {
    const name = user?.name?.split(' ')[0];
    if (name) return `How can I help you study today, ${name}?`;
    return 'How can I help you study today?';
  };

  const getSubGreeting = () => {
    if (memory?.focus_topics?.length) {
      return `I remember you've been working on ${memory.focus_topics.slice(0, 2).join(' and ')}. Ready to continue?`;
    }
    if (memory?.needs_practice?.length) {
      return `You've been practising ${memory.needs_practice[0]}. Want to keep going?`;
    }
    return 'Ask anything about CAPS Physical Sciences or Chemistry. Worked examples, formulas, and visual simulations included.';
  };

  return (
    <div className="relative flex h-full min-h-0 overflow-hidden bg-zinc-950 text-zinc-100">
      {/* Mobile overlay */}
      {sidebarVisible && !isDesktop && (
        <div
          className="fixed inset-0 z-[130] bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
      <aside className={`shrink-0 flex flex-col transition-all duration-300 bg-zinc-950/98 border-r border-white/[0.05] backdrop-blur-md ${
        sidebarVisible
          ? 'fixed inset-y-0 left-0 z-[140] w-72 shadow-2xl md:static md:z-auto md:w-64 md:shadow-none'
          : 'hidden'
      }`}>
        {/* Sidebar header */}
        <div className="px-3 py-3 border-b border-white/[0.05] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-400" strokeWidth={1.8} />
            <h2 className="text-[12.5px] font-semibold text-zinc-100">Sessions</h2>
          </div>
          <div className="flex items-center gap-0.5">
            <button
              onClick={handleNewSession}
              className="p-1.5 rounded-md text-emerald-300 hover:bg-emerald-500/[0.08] transition-colors"
              title="New session"
            >
              <Plus className="w-4 h-4" strokeWidth={2.25} />
            </button>
            <button
              onClick={() => {
                setSidebarPinned(false);
                localStorage.setItem('vector_chat_sidebar_pinned', 'false');
                setSidebarOpen(false);
              }}
              className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04] transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Memory panel (RAG) */}
        <MemoryPanel
          memory={memory}
          isLoading={memoryLoading}
          onClear={handleClearMemory}
          onRefresh={handleRefreshMemory}
          userName={user?.name}
        />

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {sessions.length === 0 ? (
            <div className="text-center py-10">
              <MessageSquare className="w-5 h-5 text-zinc-700 mx-auto mb-2" />
              <p className="text-[11.5px] text-zinc-500">No previous sessions</p>
            </div>
          ) : (
            sessions.map((sess) => {
              const active = currentSessionId === sess.chat_id;
              return (
                <button
                  key={sess.chat_id}
                  onClick={() => handleResumeSession(sess.chat_id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-[13px] font-medium truncate flex items-center gap-2 cursor-pointer transition-colors ${
                    active
                      ? 'bg-emerald-500/[0.08] text-emerald-300 border border-emerald-500/20'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.03] border border-transparent'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-70" strokeWidth={1.8} />
                  <span className="truncate">{sess.title || 'Untitled session'}</span>
                </button>
              );
            })
          )}
        </div>

        {/* Voice settings */}
        <div className="p-3 space-y-2.5 border-t border-white/[0.05]">
          <div>
            <label className="text-[10.5px] font-medium text-zinc-500 block mb-1">Voice synth</label>
            <select value={ttsProvider} onChange={e => setTtsProvider(e.target.value)} className={selectClass}>
              {voiceProviders.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10.5px] font-medium text-zinc-500 block mb-1">Speaker</label>
            <select value={voiceId} onChange={e => setVoiceId(e.target.value)} className={selectClass}>
              {ttsProvider === 'camb' && cambVoices.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              {ttsProvider === 'elevenlabs' && elevenLabsVoices.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              {ttsProvider === 'browser' && browserVoices.map(v => <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>)}
            </select>
          </div>
        </div>
      </aside>

      {/* ── Main workspace ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex h-12 shrink-0 items-center justify-between px-3 sm:px-4 border-b border-white/[0.05] bg-zinc-950/90 backdrop-blur-md">
          <button
            onClick={toggleSidebar}
            className="inline-flex items-center gap-1.5 rounded-md px-2 sm:px-2.5 py-1.5 text-[11.5px] font-medium text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04] transition-colors cursor-pointer"
          >
            {sidebarVisible ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            <span className="hidden xs:inline">Sessions</span>
          </button>

          {/* Memory indicator badge (mobile) */}
          {memory && !sidebarVisible && (
            <button
              onClick={toggleSidebar}
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/[0.08] border border-emerald-500/20 text-[10px] text-emerald-400 font-medium"
              title="View your learning memory"
            >
              <Brain className="w-3 h-3" />
              <span className="hidden sm:inline">Memory active</span>
            </button>
          )}

          <button
            onClick={handleNewSession}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 sm:px-3 py-1.5 text-[11.5px] font-medium bg-emerald-500/[0.10] border border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/[0.16] transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.25} />
            <span className="hidden xs:inline">New chat</span>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 min-h-0 overflow-y-auto px-3 py-5 sm:px-6 sm:py-6 bg-zinc-950">
          {messages.length === 0 ? (
            <div className="mx-auto flex min-h-full max-w-2xl flex-col items-center justify-center py-8 text-center px-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 bg-emerald-500/[0.08] border border-emerald-500/15">
                <Zap className="w-6 h-6 text-emerald-400" strokeWidth={1.6} />
              </div>
              <h2 className="text-[18px] sm:text-[22px] font-semibold tracking-tight text-zinc-50 mb-2">
                {getGreeting()}
              </h2>
              <p className="text-zinc-400 text-[13px] sm:text-[13.5px] leading-relaxed mb-7 max-w-md">
                {getSubGreeting()}
              </p>

              {/* Memory context chips */}
              {memory?.focus_topics?.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1.5 mb-6">
                  {memory.focus_topics.slice(0, 4).map((topic, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(`Explain ${topic} in detail with examples.`)}
                      className="px-2.5 py-1 rounded-full bg-emerald-500/[0.08] border border-emerald-500/20 text-[11px] text-emerald-300 hover:bg-emerald-500/[0.15] transition-colors cursor-pointer"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 w-full gap-2">
                {promptChips.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(chip.prompt)}
                    className="group rounded-xl p-3.5 sm:p-4 text-left transition-all cursor-pointer bg-zinc-900/40 hover:bg-zinc-900/70 border border-white/[0.05] hover:border-emerald-500/20"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400 mb-2 opacity-80" strokeWidth={2.25} />
                    <div className="text-[13px] sm:text-[13.5px] font-semibold text-zinc-100 leading-snug group-hover:text-emerald-300 transition-colors">{chip.title}</div>
                    <div className="text-[11.5px] sm:text-[12px] text-zinc-500 mt-1">{chip.sub}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 sm:gap-6">
              {messages.map((msg, index) => {
                const isUser = msg.role === 'user';
                return (
                  <div key={index} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} w-full sm:max-w-[88%]`}>
                      <div className="text-[10px] sm:text-[10.5px] font-medium uppercase tracking-wider text-zinc-500 mb-1.5 px-1">
                        {isUser ? (user?.name?.split(' ')[0] || 'You') : 'Vector AI'}
                      </div>
                      {isUser ? (
                        <div className="rounded-2xl rounded-tr-sm px-3.5 sm:px-4 py-2.5 sm:py-3 bg-emerald-500/[0.10] border border-emerald-500/20 text-zinc-100 text-[13.5px] sm:text-[14px] leading-relaxed break-words max-w-full">
                          <p className="whitespace-pre-line">{msg.content}</p>
                        </div>
                      ) : (
                        <div className="rounded-2xl rounded-tl-sm px-3.5 sm:px-4 py-2.5 sm:py-3 bg-zinc-900/50 border border-white/[0.06] text-zinc-200 text-[13.5px] sm:text-[14px] leading-relaxed break-words w-full">
                          {/* Tool Badges */}
                          {msg.tool_metadata && (
                            <div className="flex gap-2 mb-2">
                              {msg.tool_metadata.used_search && (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                                  <Zap className="w-2.5 h-2.5" /> Google Search
                                </span>
                              )}
                              {msg.tool_metadata.used_code && (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                                  <Sparkles className="w-2.5 h-2.5" /> Code Execution
                                </span>
                              )}
                            </div>
                          )}
                          <MarkdownRenderer content={msg.content} dark={true} />
                          <button
                            onClick={() => handleSaveAsNote(msg.content)}
                            className="mt-2.5 sm:mt-3 inline-flex items-center gap-1.5 text-[10.5px] sm:text-[11px] font-medium text-zinc-500 hover:text-emerald-300 transition-colors rounded-md px-2 py-1 border border-white/[0.06] hover:border-emerald-500/20 hover:bg-emerald-500/[0.04]"
                          >
                            <Bookmark className="w-3 h-3" strokeWidth={2} />
                            Save to notes
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {isSending && (
                <div className="flex justify-start">
                  <div className="flex flex-col items-start">
                    <div className="text-[10.5px] font-medium uppercase tracking-wider text-zinc-500 mb-1.5 px-1">Vector AI</div>
                    <div className="rounded-2xl rounded-tl-sm px-4 py-3 bg-zinc-900/50 border border-white/[0.06]">
                      <div className="flex gap-1 items-center">
                        {[0, 1, 2].map(i => (
                          <span key={i} className="typing-dot w-1.5 h-1.5 rounded-full bg-emerald-400/80" style={{ animationDelay: `${i * 0.15}s` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* ── Composer ──────────────────────────────────────────────────────── */}
        <div className="shrink-0 px-3 sm:px-4 pb-3 sm:pb-4 pt-2 bg-zinc-950 border-t border-white/[0.04]">
          <div className="mx-auto max-w-3xl">
            <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/40 focus-within:border-emerald-500/30 focus-within:bg-zinc-900/60 transition-colors backdrop-blur-md">
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask anything…"
                className="w-full resize-none text-[13.5px] sm:text-[14px] py-3 sm:py-3.5 px-3.5 sm:px-4 bg-transparent text-zinc-100 placeholder:text-zinc-500 outline-none font-sans leading-relaxed"
                style={{ minHeight: '44px', maxHeight: '120px' }}
              />
              <div className="flex items-center justify-between px-2 pb-2">
                <div className="flex items-center gap-1.5 pl-1">
                  <button
                    onClick={() => setEnableSearch(!enableSearch)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all border ${
                      enableSearch 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                        : 'bg-zinc-800/50 border-white/5 text-zinc-500'
                    }`}
                    title="Enable/Disable Google Search"
                  >
                    <Zap className={`w-3 h-3 ${enableSearch ? 'text-emerald-400' : 'text-zinc-600'}`} />
                    <span className="hidden sm:inline">Search</span>
                  </button>
                  <button
                    onClick={() => setEnableCode(!enableCode)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all border ${
                      enableCode 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                        : 'bg-zinc-800/50 border-white/5 text-zinc-500'
                    }`}
                    title="Enable/Disable Code Execution"
                  >
                    <Sparkles className={`w-3 h-3 ${enableCode ? 'text-emerald-400' : 'text-zinc-600'}`} />
                    <span className="hidden sm:inline">Code</span>
                  </button>
                </div>
                
                <div className="flex items-center gap-1.5 ml-auto">
                  {/* Mic button */}
                  <button
                    onClick={toggleDictation}
                    disabled={isProcessingAudio}
                    className={`p-2 rounded-lg cursor-pointer transition-all flex items-center justify-center ${
                      isRecording
                        ? 'bg-red-500/15 text-red-300 border border-red-500/30 animate-pulse'
                        : 'text-zinc-400 hover:text-emerald-300 hover:bg-white/[0.04] border border-transparent'
                    }`}
                    title={isRecording ? 'Stop recording' : 'Voice input'}
                  >
                    {isProcessingAudio
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : isRecording
                      ? <MicOff className="w-4 h-4" />
                      : <Mic className="w-4 h-4" strokeWidth={1.8} />
                    }
                  </button>
                  {/* Send button */}
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={isSending || !inputValue.trim()}
                    className={`p-2 rounded-lg cursor-pointer transition-all flex items-center justify-center ${
                      !isSending && inputValue.trim()
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-[0_4px_12px_-2px_rgba(16,185,129,0.4)]'
                        : 'bg-white/[0.04] text-zinc-600'
                    }`}
                    aria-label="Send message"
                  >
                    <Send className="w-4 h-4" strokeWidth={2.25} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
