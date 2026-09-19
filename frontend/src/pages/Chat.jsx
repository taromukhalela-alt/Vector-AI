import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { trackEvent } from '../useAnalytics';
import { useToast } from '../context/ToastContext';
import { AnimatePresence, motion } from 'framer-motion';
import {
  PaperPlaneTilt, Plus,
  CaretLeft, CaretRight, BookmarkSimple, X, Microphone, MicrophoneSlash,
  CircleNotch, Brain, Trash, ArrowsClockwise, Tag,
  TrendUp, Target, Clock, CaretDown, CaretUp,
  WarningCircle, StopCircle, CopySimple, Check, ArrowRight
} from '@phosphor-icons/react';

// ─── Memory Panel Component ────────────────────────────────────────────────────
const MemoryPanel = ({ memory, isLoading, onClear, onRefresh, userName }) => {
  const [expanded, setExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="border-b-4 border-[var(--border)] bg-[var(--surface-muted)] p-4">
        <div className="flex items-center gap-2 text-[var(--ink-muted)]">
          <Brain className="h-5 w-5 animate-pulse" weight="bold" aria-hidden="true" />
          <span className="font-mono text-xs font-bold uppercase tracking-widest">Loading memory…</span>
        </div>
      </div>
    );
  }

  if (!memory) {
    return (
      <div className="border-b-4 border-[var(--border)] bg-[var(--surface-muted)] p-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5" weight="bold" aria-hidden="true" />
            <span className="text-xs font-black uppercase tracking-widest text-[var(--ink)]">Student Memory</span>
          </div>
          <button
            onClick={onRefresh}
            className="border-2 border-[var(--border)] bg-[var(--surface)] p-1 shadow-[2px_2px_0_var(--border)] transition-all hover:bg-[var(--surface-muted)] active:translate-y-[2px] active:shadow-none"
            title="Refresh memory"
            aria-label="Refresh memory"
          >
            <ArrowsClockwise className="h-4 w-4" weight="bold" aria-hidden="true" />
          </button>
        </div>
        <p className="text-xs font-bold leading-relaxed text-[var(--ink-muted)]">
          No memory yet. Start chatting and the AI will remember your learning profile.
        </p>
      </div>
    );
  }

  const { focus_topics = [], strengths = [], needs_practice = [], recent_context = '', study_preferences = [] } = memory;
  const hasContent = focus_topics.length || strengths.length || needs_practice.length || recent_context || study_preferences.length;

  return (
    <div className="border-b-4 border-[var(--border)] bg-[var(--surface-muted)]">
      <button
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between border-b-2 border-transparent p-4 transition-colors hover:bg-[var(--surface)]"
      >
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5" weight="bold" aria-hidden="true" />
          <span className="text-xs font-black uppercase tracking-widest text-[var(--ink)]">
            {userName ? `${userName.split(' ')[0]}'s Memory` : 'Student Memory'}
          </span>
          {hasContent && (
            <span className="h-2 w-2 shrink-0 border border-[var(--border)] bg-[var(--magenta)]" title="Memory active" />
          )}
        </div>
        {expanded ? <CaretUp className="h-5 w-5" weight="bold" aria-hidden="true" /> : <CaretDown className="h-5 w-5" weight="bold" aria-hidden="true" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 pt-2">
          {focus_topics.length > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Tag className="h-4 w-4" weight="bold" aria-hidden="true" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--ink)]">Focus Topics</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {focus_topics.map((t, i) => (
                  <span key={i} className="px-2 py-1 border-2 border-[var(--border)] bg-[var(--surface)] text-[10px] font-bold text-[var(--ink)] shadow-[2px_2px_0_var(--border)]">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {strengths.length > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-2">
                <TrendUp className="h-4 w-4" weight="bold" aria-hidden="true" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--ink)]">Strengths</span>
              </div>
              <ul className="space-y-1">
                {strengths.slice(0, 3).map((s, i) => (
                  <li key={i} className="text-xs font-bold text-[var(--ink-muted)] flex items-start gap-2">
                    <span className="text-[var(--emerald)] font-black">→</span>{s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {needs_practice.length > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Target className="h-4 w-4" weight="bold" aria-hidden="true" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--ink)]">Needs Practice</span>
              </div>
              <ul className="space-y-1">
                {needs_practice.slice(0, 3).map((n, i) => (
                  <li key={i} className="text-xs font-bold text-[var(--ink-muted)] flex items-start gap-2">
                    <span className="text-[var(--danger)] font-black">→</span>{n}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {recent_context && (
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4" weight="bold" aria-hidden="true" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--ink)]">Recent Context</span>
              </div>
              <p className="text-xs font-bold text-[var(--ink-muted)] leading-relaxed border-l-4 border-[var(--border)] pl-2">{recent_context}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 border-t-2 border-[var(--border)] pt-4">
            <button
              onClick={onRefresh}
              className="neo-btn neo-btn-sm flex items-center gap-2 px-3 py-2 text-[10px]"
            >
              <ArrowsClockwise className="h-3 w-3" weight="bold" aria-hidden="true" /> Refresh
            </button>
            <button
              onClick={onClear}
              className="neo-btn neo-btn-sm neo-btn-danger flex items-center gap-2 px-3 py-2 text-[10px]"
            >
              <Trash className="h-3 w-3" weight="bold" aria-hidden="true" /> Clear
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
  const [isThinking, setIsThinking] = useState(false);
  const abortRef = useRef(null);
  const [failedRequest, setFailedRequest] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);

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

  const educationalActions = [
    { label: "Explain differently", prompt: "Explain this concept in a different, simpler way." },
    { label: "Give an example", prompt: "Give me a real-world example of this." },
    { label: "Test me", prompt: "Give me a question to test my understanding." },
    { label: "Harder question", prompt: "Give me a more difficult question on this topic." },
    { label: "Make notes", prompt: "Summarize this into a study guide." },
    { label: "Show experiment", prompt: "Describe a laboratory experiment that demonstrates this." }
  ];

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

  const loadSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/history');
      const data = await res.json();
      if (data.success && Array.isArray(data.sessions)) setSessions(data.sessions);
    } catch (e) { console.error('Failed to load history', e); }
  }, []);

  const updateBrowserVoices = useCallback(() => {
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
  }, [voiceId]);

  useEffect(() => {
    const initializeChat = async () => {
      await Promise.all([loadSessions(), loadMemory()]);
      updateBrowserVoices();
    };
    initializeChat();
    if ('speechSynthesis' in window) window.speechSynthesis.onvoiceschanged = updateBrowserVoices;
    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.onvoiceschanged = null;
    };
  }, [loadMemory, loadSessions, updateBrowserVoices]);

  const syncVoiceSelection = useCallback(() => {
    localStorage.setItem('preferred_tts_provider', ttsProvider);
    if (ttsProvider === 'camb') {
      const next = localStorage.getItem('preferred_camb_voice') || '147320';
      setVoiceId(prev => (prev === next ? prev : next));
      return;
    }
    if (ttsProvider === 'elevenlabs') {
      const next = localStorage.getItem('preferred_elevenlabs_voice') || 'pNInz6obpgDQGcFmaJgB';
      setVoiceId(prev => (prev === next ? prev : next));
      return;
    }
    const saved = localStorage.getItem('preferred_browser_voice') || '';
    const next = saved || browserVoices[0]?.voiceURI || '';
    if (next) setVoiceId(prev => (prev === next ? prev : next));
  }, [browserVoices, ttsProvider]);

  useEffect(() => {
    syncVoiceSelection();
  }, [syncVoiceSelection]);

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

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
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

  const handleResumeSession = useCallback(async (chatId) => {
    try {
      const res = await fetch(`/api/session/${chatId}`);
      const data = await res.json();
      if (data.success) {
        setCurrentSessionId(chatId);
        setMessages(data.history || []);
        if (!isDesktop) setSidebarOpen(false);
      }
    } catch (e) { console.error(e); }
  }, [isDesktop]);

  const stopDictation = () => {
    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch { } }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try { mediaRecorderRef.current.stop(); } catch { }
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

  const handleSendMessage = async (text, historyOverride) => {
    const question = (text || inputValue).trim();
    if (!question || isSending) return;
    const baseMessages = historyOverride || messages;
    setInputValue('');
    setIsSending(true);
    setIsThinking(true);
    setFailedRequest(null);
    const controller = new AbortController();
    abortRef.current = controller;
    const updatedMessages = [...baseMessages, { role: 'user', content: question }];
    setMessages(updatedMessages);

    try {
      trackEvent('chat_message_sent', { route: '/chat', message_length: question.length });
      const response = await fetch('/api/chat', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
          'Accept': 'text/event-stream',
          'X-Stream': '1',
        },
        body: JSON.stringify({
          message: question,
          history: baseMessages,
          stream: true,
        }),
      });

      const settleAnimation = async () => {
        const headerAnimation = response.headers.get('X-Vector-Animation');
        if (headerAnimation && onMatchAnimation) {
          onMatchAnimation(headerAnimation, response.headers.get('X-Vector-Animation-Label') || '');
          return;
        }
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
      };

      if (response.headers.get('content-type')?.includes('application/json')) {
        const data = await response.json();
        if (data.reply) {
          trackEvent('chat_response_received', { route: '/chat' });
          setMessages([...updatedMessages, { role: 'assistant', content: data.reply }]);
          loadMemory();
          await settleAnimation();
        } else {
          setFailedRequest({ question, history: baseMessages });
        }
        loadSessions();
        return;
      }

      if (!response.body) {
        throw new Error('No response stream available');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let streamedReply = '';
      const assistantMessageIndex = updatedMessages.length;
      setMessages([...updatedMessages, { role: 'assistant', content: '' }]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        streamedReply += chunk;
        setMessages((prev) => {
          const next = [...prev];
          next[assistantMessageIndex] = { ...next[assistantMessageIndex], content: streamedReply };
          return next;
        });
      }

      trackEvent('chat_response_received', { route: '/chat' });
      loadMemory();
      await settleAnimation();
      loadSessions();
    } catch (error) {
      if (error?.name === 'AbortError') {
        trackEvent('chat_generation_stopped', { route: '/chat' });
      } else {
        trackEvent('chat_request_failed', { route: '/chat' });
        setFailedRequest({ question, history: baseMessages });
      }
    } finally {
      abortRef.current = null;
      setIsSending(false);
      setIsThinking(false);
    }
  };

  const handleStopGeneration = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsSending(false);
    setIsThinking(false);
  }, []);

  const handleRegenerate = useCallback(() => {
    if (isSending) return;
    const lastUserIndex = messages.map((msg) => msg.role).lastIndexOf('user');
    if (lastUserIndex === -1) return;
    const question = messages[lastUserIndex].content;
    handleSendMessage(question, messages.slice(0, lastUserIndex));
  }, [isSending, messages]);

  const handleCopyMessage = useCallback(async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex((current) => (current === index ? null : current)), 1800);
    } catch (copyError) {
      console.warn('Copy failed', copyError);
    }
  }, []);

  const handleRetryFailed = useCallback(() => {
    if (!failedRequest || isSending) return;
    const { question, history } = failedRequest;
    setFailedRequest(null);
    handleSendMessage(question, history);
  }, [failedRequest, isSending]);

  useEffect(() => {
    const scheduledPrompt = typeof window !== 'undefined'
      ? window.sessionStorage.getItem('vector_dashboard_prompt')
      : null;

    const promptToSend = scheduledPrompt || initialPrompt;
    if (!promptToSend || consumedPromptRef.current === promptToSend) return;

    consumedPromptRef.current = promptToSend;
    if (scheduledPrompt && typeof window !== 'undefined') {
      window.sessionStorage.removeItem('vector_dashboard_prompt');
    }
    handleSendMessage(promptToSend);
  }, [initialPrompt]);

  useEffect(() => {
    if (!resumeChatId || consumedResumeRef.current === resumeChatId) return;
    consumedResumeRef.current = resumeChatId;
    handleResumeSession(resumeChatId);
  }, [handleResumeSession, resumeChatId]);

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

  const selectClass = "w-full border-2 border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-bold uppercase outline-none focus:border-[var(--emerald)] shadow-[2px_2px_0_var(--border)]";

  const getGreeting = () => {
    const name = user?.name?.split(' ')[0];
    if (name) return `Vector AI Tutor. Welcome, ${name}.`;
    return 'Vector AI Tutor.';
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[var(--paper)] font-sans text-[var(--ink)]">
      
      {/* Mobile overlay */}
      {sidebarVisible && !isDesktop && (
        <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
      <aside className={`shrink-0 flex flex-col transition-all duration-300 border-r-4 border-[var(--border)] bg-[var(--surface)] ${
        sidebarVisible
          ? 'fixed inset-y-0 left-0 z-50 w-72 md:static md:z-auto md:w-80 shadow-[4px_0_0_var(--border)] md:shadow-none'
          : 'hidden'
      }`}>
        <div className="p-4 border-b-4 border-[var(--border)] flex items-center justify-between">
          <h2 className="text-xl font-black uppercase tracking-tight text-[var(--ink)]">Sessions</h2>
          <div className="flex gap-2">
            <button
              onClick={handleNewSession}
              aria-label="New session"
              className="neo-btn neo-btn-sm neo-btn-soft flex items-center px-2 py-1"
              title="New session"
            >
              <Plus className="h-5 w-5" weight="bold" aria-hidden="true" />
            </button>
            <button
              onClick={() => {
                setSidebarPinned(false);
                localStorage.setItem('vector_chat_sidebar_pinned', 'false');
                setSidebarOpen(false);
              }}
              aria-label="Close sessions"
              className="neo-btn neo-btn-sm flex items-center px-2 py-1"
              title="Close"
            >
              <X className="h-5 w-5" weight="bold" aria-hidden="true" />
            </button>
          </div>
        </div>

        <MemoryPanel
          memory={memory}
          isLoading={memoryLoading}
          onClear={handleClearMemory}
          onRefresh={handleRefreshMemory}
          userName={user?.name}
        />

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {sessions.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-sm font-bold uppercase text-[var(--ink-muted)]">No previous sessions</p>
            </div>
          ) : (
            sessions.map((sess) => {
              const active = currentSessionId === sess.chat_id;
              return (
                <button
                  key={sess.chat_id}
                  onClick={() => handleResumeSession(sess.chat_id)}
                  className={`w-full text-left p-4 border-2 border-[var(--border)] font-bold transition-all shadow-[4px_4px_0_var(--border)] ${
                    active
                      ? 'bg-[var(--emerald)] text-white translate-x-[2px] translate-y-[2px] shadow-[2px_2px_0_var(--border)]'
                      : 'bg-[var(--surface)] hover:bg-[var(--surface-muted)] text-[var(--ink)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none'
                  }`}
                >
                  <span className="truncate block uppercase tracking-wider text-sm">{sess.title || 'Untitled session'}</span>
                </button>
              );
            })
          )}
        </div>

        <div className="p-4 space-y-4 border-t-4 border-[var(--border)] bg-[var(--surface-muted)]">
          <div>
            <label className="text-xs font-black uppercase text-[var(--ink)] block mb-2">Voice synth</label>
            <select value={ttsProvider} onChange={e => setTtsProvider(e.target.value)} className={selectClass}>
              {voiceProviders.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-black uppercase text-[var(--ink)] block mb-2">Speaker</label>
            <select value={voiceId} onChange={e => setVoiceId(e.target.value)} className={selectClass}>
              {ttsProvider === 'camb' && cambVoices.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              {ttsProvider === 'elevenlabs' && elevenLabsVoices.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              {ttsProvider === 'browser' && browserVoices.map(v => <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>)}
            </select>
          </div>
        </div>
      </aside>

      {/* ── Main workspace ──────────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col bg-[var(--paper)]">
        {/* Toolbar */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b-4 border-[var(--border)] bg-[var(--surface)] px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSidebar}
              aria-expanded={sidebarVisible}
              className="neo-btn neo-btn-sm flex items-center gap-2 px-3 py-2 text-sm"
            >
              {sidebarVisible ? <CaretLeft className="h-5 w-5" weight="bold" aria-hidden="true" /> : <CaretRight className="h-5 w-5" weight="bold" aria-hidden="true" />}
              <span className="hidden font-bold uppercase sm:inline">Sessions</span>
            </button>

            {memory && !sidebarVisible && (
              <span className="hidden items-center gap-2 border-2 border-[var(--border)] bg-[var(--magenta-soft)] px-3 py-2 text-xs font-bold uppercase shadow-[2px_2px_0_var(--border)] md:inline-flex">
                <Brain className="h-4 w-4" weight="bold" aria-hidden="true" />
                Memory Active
              </span>
            )}
          </div>

          <button
            onClick={handleNewSession}
            className="neo-btn neo-btn-sm neo-btn-primary flex items-center gap-2 px-4 py-2 text-sm"
          >
            <Plus className="h-5 w-5" weight="bold" aria-hidden="true" />
            <span className="hidden sm:inline">New Chat</span>
          </button>
        </div>

        {/* Messages */}
        <div className="min-h-0 flex-1 overflow-y-auto bg-[var(--paper)] px-4 py-8 sm:px-8">
          {messages.length === 0 ? (
            <div className="mx-auto flex max-w-4xl flex-col pb-16 pt-8">
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: 'easeOut' }}>
              <p className="section-label mb-3">CAPS Physical Sciences · AI Tutor</p>
              <h1 className="mb-4 font-display text-4xl font-bold uppercase tracking-tight md:text-6xl">{getGreeting()}</h1>
              <p className="mb-12 text-lg font-bold text-[var(--ink-muted)]">
                Ask a question, request a summary, or let&apos;s solve a problem step by step.
              </p>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {educationalActions.map((action, idx) => (
                  <motion.button
                    key={idx}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: 0.05 * idx }}
                    onClick={() => handleSendMessage(action.prompt)}
                    className="neo-card group cursor-pointer p-6 text-left hover:bg-[var(--surface-muted)]"
                  >
                    <span className="mb-2 block text-lg font-black uppercase tracking-tight text-[var(--ink)]">
                      {action.label}
                    </span>
                    <ArrowRight className="h-6 w-6 text-[var(--magenta)] transition-transform group-hover:translate-x-2" weight="bold" aria-hidden="true" />
                  </motion.button>
                ))}
              </div>
              </motion.div>
            </div>
          ) : (
            <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 pb-8">
              <AnimatePresence initial={false}>
              {messages.map((msg, index) => {
                const isUser = msg.role === 'user';
                if (!isUser && !msg.content) return null;
                return (
                  <motion.div
                    key={`${index}-${msg.role}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex w-full flex-col ${isUser ? 'items-end' : 'items-start'} sm:max-w-[85%]`}>
                      <div className="section-label mb-2">
                        {isUser ? (user?.name?.split(' ')[0] || 'You') : 'Vector AI'}
                      </div>
                      {isUser ? (
                        <div className="chat-user chat-user-accent break-words p-6 text-lg font-bold leading-relaxed">
                          <p className="whitespace-pre-line">{msg.content}</p>
                        </div>
                      ) : (
                        <div className="chat-ai chat-ai-accent w-full break-words p-6 text-base leading-relaxed md:p-8 md:text-lg">
                          <div className="prose prose-lg max-w-none prose-headings:font-black prose-headings:uppercase prose-a:font-bold prose-strong:font-black">
                            <MarkdownRenderer content={msg.content} />
                          </div>

                          <div className="mt-8 flex flex-wrap items-center gap-4 border-t-2 border-[var(--border)] pt-6">
                            <button
                              onClick={() => handleSaveAsNote(msg.content)}
                              className="neo-btn neo-btn-sm flex items-center gap-2 px-4 py-2 text-xs"
                            >
                              <BookmarkSimple className="h-4 w-4" weight="bold" aria-hidden="true" /> Save as note
                            </button>
                            <button
                              onClick={() => handleCopyMessage(msg.content, index)}
                              className="neo-btn neo-btn-sm flex items-center gap-2 px-4 py-2 text-xs"
                            >
                              {copiedIndex === index ? (
                                <><Check className="h-4 w-4" weight="bold" aria-hidden="true" /> Copied</>
                              ) : (
                                <><CopySimple className="h-4 w-4" weight="bold" aria-hidden="true" /> Copy text</>
                              )}
                            </button>
                            {index === messages.length - 1 && !isSending && (
                              <button
                                onClick={handleRegenerate}
                                className="neo-btn neo-btn-sm flex items-center gap-2 px-4 py-2 text-xs"
                              >
                                <ArrowsClockwise className="h-4 w-4" weight="bold" aria-hidden="true" /> Regenerate
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
              </AnimatePresence>

              {(isSending || isThinking) && (
                <div className="flex justify-start">
                  <div className="flex w-full flex-col items-start sm:max-w-[85%]">
                    <div className="section-label mb-2">Vector AI</div>
                    <div className="neo-panel flex items-center gap-4 p-6" role="status" aria-live="polite">
                      <CircleNotch className="h-8 w-8 animate-spin" weight="bold" aria-hidden="true" />
                      <span className="text-xl font-black uppercase tracking-tight text-[var(--ink)]">Processing...</span>
                      <button
                        onClick={handleStopGeneration}
                        className="neo-btn neo-btn-sm neo-btn-danger ml-auto px-4 py-2 text-xs"
                      >
                        Stop
                      </button>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* ── Composer ──────────────────────────────────────────────────────── */}
        <div className="shrink-0 border-t-[3px] border-[var(--border)] bg-[var(--surface)] p-4 md:p-6">
          <div className="mx-auto max-w-4xl">
            {failedRequest && (
              <div className="neo-card neo-danger mb-4 flex items-start gap-4 p-4">
                <WarningCircle className="mt-1 h-6 w-6 shrink-0" weight="bold" aria-hidden="true" />
                <div className="flex-1">
                  <p className="text-lg font-black uppercase">Error processing request</p>
                  <p className="mt-1 font-bold">Your question was kept. Nothing was lost.</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleRetryFailed} disabled={isSending} className="neo-btn neo-btn-sm neo-btn-surface px-4 py-2 text-sm">Retry</button>
                  <button onClick={() => setFailedRequest(null)} aria-label="Dismiss error" className="neo-btn neo-btn-sm neo-btn-surface p-2"><X className="h-5 w-5" weight="bold" aria-hidden="true" /></button>
                </div>
              </div>
            )}
            <div className="neo-panel neo-paper neo-panel-focus flex flex-col">
              <label htmlFor="vector-composer" className="sr-only">Ask Vector a question</label>
              <textarea
                id="vector-composer"
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
                placeholder="Ask Vector..."
                aria-label="Ask Vector a question"
                className="w-full resize-none bg-transparent p-6 text-lg font-bold text-[var(--ink)] outline-none placeholder:text-[var(--ink-muted)] md:text-xl"
                style={{ minHeight: '80px', maxHeight: '200px' }}
              />
              <div className="flex items-center justify-between border-t-2 border-[var(--border)] bg-[var(--surface-muted)] px-4 pb-4 pt-4">
                <div className="flex gap-2">
                  <button
                    onClick={toggleDictation}
                    disabled={isProcessingAudio}
                    aria-label={isRecording ? 'Stop dictation' : 'Start dictation'}
                    className={`neo-btn neo-btn-sm flex items-center px-4 py-2 ${
                      isRecording ? 'neo-btn-danger animate-pulse' : 'neo-btn-surface'
                    }`}
                  >
                    {isProcessingAudio ? <CircleNotch className="h-5 w-5 animate-spin" weight="bold" aria-hidden="true" /> : isRecording ? <MicrophoneSlash className="h-5 w-5" weight="bold" aria-hidden="true" /> : <Microphone className="h-5 w-5" weight="bold" aria-hidden="true" />}
                  </button>
                </div>

                {isSending ? (
                  <button
                    onClick={handleStopGeneration}
                    className="neo-btn neo-btn-sm neo-btn-danger flex items-center gap-2 px-6 py-2"
                  >
                    <StopCircle className="h-5 w-5" weight="fill" aria-hidden="true" /> Stop
                  </button>
                ) : (
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!inputValue.trim()}
                    className="neo-btn neo-btn-primary flex items-center px-8 py-3 text-lg"
                  >
                    Send <PaperPlaneTilt className="ml-2 h-5 w-5" weight="bold" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
