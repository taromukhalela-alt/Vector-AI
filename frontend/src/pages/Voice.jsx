import { useState, useEffect, useRef } from 'react';
import AvatarCanvas from '../components/AvatarCanvas';
import { trackEvent } from '../useAnalytics';
import { Mic, MicOff, AlertCircle, Info } from 'lucide-react';

const Voice = ({ onMatchAnimation, csrfToken }) => {
  const [status, setStatus] = useState('Tap the mic to start');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [youTranscript, setYouTranscript] = useState('');
  const [aiTranscript, setAiTranscript] = useState('');
  const [avatarState, setAvatarState] = useState('idle');
  const [speakingAmplitude, setSpeakingAmplitude] = useState(0);
  const [frequencyData, setFrequencyData] = useState(null);
  const [micError, setMicError] = useState(false);

  const isSpeakingRef = useRef(false);
  const recognitionRef = useRef(null);
  const audioRef = useRef(null);
  const synthUtteranceRef = useRef(null);
  const ampIntervalRef = useRef(null);
  const activeSessionRef = useRef(0);
  const audioContextRef = useRef(null);
  const animationFrameRef = useRef(null);
  const conversationHistoryRef = useRef([]);

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  // Sync settings with localStorage
  const ttsProvider = localStorage.getItem('preferred_tts_provider') || 'camb';
  const voiceId = localStorage.getItem('preferred_elevenlabs_voice') || 'pNInz6obpgDQGcFmaJgB';
  const cambVoiceId = localStorage.getItem('preferred_camb_voice') || '147320';
  const browserVoiceURI = localStorage.getItem('preferred_browser_voice') || '';

  // Setup Web Speech Recognition
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      console.warn('Speech recognition not supported in this browser.');
      return;
    }

    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = 'en-ZA';

    rec.onstart = () => {
      setIsListening(true);
      setAvatarState('listening');
      setStatus('Listening...');
      setYouTranscript('...');
    };

    rec.onresult = (event) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += text;
        } else {
          interim += text;
        }
      }
      if (interim) setYouTranscript(interim + '...');
      if (final) {
        setYouTranscript(final.trim());
        // eslint-disable-next-line react-hooks/immutability
        handleSpeechInput(final.trim());
      }
    };

    rec.onend = () => {
      setIsListening(false);
      if (!isSpeakingRef.current) {
        setAvatarState('idle');
      }
    };

    rec.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      setAvatarState('idle');
      setStatus('Tap to speak');
      if (event.error === 'not-allowed') {
        setMicError(true);
      }
    };

    recognitionRef.current = rec;

    return () => {
      // eslint-disable-next-line react-hooks/immutability
      stopAllVoiceState();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setupAudioAnalyser = async () => {
    if (audioContextRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      source.connect(analyser);

      audioContextRef.current = { audioCtx, stream };

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateFrequencyData = () => {
        analyser.getByteFrequencyData(dataArray);
        setFrequencyData(new Uint8Array(dataArray));
        animationFrameRef.current = requestAnimationFrame(updateFrequencyData);
      };
      updateFrequencyData();
    } catch (error) {
      console.warn('Audio analyser not available:', error);
    }
  };

  const stopAllVoiceState = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* noop */ }
    }
    stopSpeaking();
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current) {
      audioContextRef.current.stream.getTracks().forEach(t => t.stop());
      try { audioContextRef.current.audioCtx.close(); } catch { /* noop */ }
      audioContextRef.current = null;
    }
  };

  const startAmplitudeTracking = () => {
    stopAmplitudeTracking();
    let t = 0;
    ampIntervalRef.current = setInterval(() => {
      t += 0.1;
      setSpeakingAmplitude(
        Math.max(0, 0.4 + Math.sin(t * 8) * 0.2 + Math.sin(t * 3.3) * 0.15 + Math.random() * 0.15)
      );
    }, 50);
  };

  const stopAmplitudeTracking = () => {
    if (ampIntervalRef.current) {
      clearInterval(ampIntervalRef.current);
      ampIntervalRef.current = null;
    }
    setSpeakingAmplitude(0);
  };

  const normalizeText = (text) => {
    return (text || '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/`/g, '')
      .replace(/#{1,6}\s/g, '')
      .replace(/F_net|F_s|F_k/g, 'F net, F static, F kinetic')
      .replace(/v²|vÂ²/g, 'v squared')
      .replace(/m\/s²|m\/sÂ²/g, 'metres per second squared')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const handleSpeechInput = async (transcriptText) => {
    setStatus('Thinking...');
    setAvatarState('idle');
    setAiTranscript('');

    try {
      trackEvent('voice_prompt_sent', {
        route: '/voice',
        transcript_length: transcriptText.length,
        tts_provider: ttsProvider,
      });

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({
          message: transcriptText,
          history: conversationHistoryRef.current,
          voice_mode: true,
          voice_provider: ttsProvider,
          max_words: ttsProvider === 'camb' ? 500 : undefined,
        }),
      });

      const data = await response.json();
      conversationHistoryRef.current = Array.isArray(data.history)
        ? data.history.slice(-14)
        : conversationHistoryRef.current;

      const reply = data.reply || '';
      setAiTranscript(reply);
      trackEvent('voice_response_received', {
        route: '/voice',
        tts_provider: ttsProvider,
      });

      // Trigger simulation matching
      if (onMatchAnimation) {
        try {
          const matchRes = await fetch('/match-animation', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-Token': csrfToken,
            },
            body: JSON.stringify({ question: transcriptText }),
          });
          const matchData = await matchRes.json();
          if (matchData?.animation_id) {
            onMatchAnimation(matchData.animation_id, matchData.animation_label);
          }
        } catch (matchError) {
          console.warn('Voice simulation match failed', matchError);
        }
      }

      // Speak response
      speakText(reply);
    } catch (error) {
      console.error('Voice chat failed:', error);
      setStatus('Error. Try again.');
      setAvatarState('idle');
    }
  };

  const speakText = async (text) => {
    activeSessionRef.current += 1;
    const sessionId = activeSessionRef.current;
    
    stopSpeaking();
    const cleanText = normalizeText(text);
    if (!cleanText) return;

    if (ttsProvider === 'browser') {
      speakWithBrowser(cleanText, sessionId);
    } else {
      try {
        setStatus('Speaking...');
        setIsSpeaking(true);
        setAvatarState('speaking');
        startAmplitudeTracking();

        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken,
          },
          body: JSON.stringify({
            text: cleanText,
            provider: ttsProvider,
            voice_id: ttsProvider === 'camb' ? cambVoiceId : voiceId,
          })
        });

        if (!response.ok) throw new Error('Cloud TTS Failed');

        const blob = await response.blob();
        if (sessionId !== activeSessionRef.current) return;

        const url = URL.createObjectURL(blob);
        const aud = new Audio(url);
        audioRef.current = aud;

        aud.onplay = () => {
          setAvatarState('speaking');
        };

        aud.onended = () => {
          if (sessionId !== activeSessionRef.current) return;
          setIsSpeaking(false);
          setAvatarState('idle');
          stopAmplitudeTracking();
          setStatus('Tap to speak');
          URL.revokeObjectURL(url);
        };

        aud.onerror = () => {
          if (sessionId !== activeSessionRef.current) return;
          setIsSpeaking(false);
          setAvatarState('idle');
          stopAmplitudeTracking();
          setStatus('Tap to speak');
          URL.revokeObjectURL(url);
        };

        await aud.play();
      } catch (e) {
        console.error('Cloud TTS error:', e);
        // Fallback to browser
        if (sessionId === activeSessionRef.current) {
          speakWithBrowser(cleanText, sessionId);
        }
      }
    }
  };

  const speakWithBrowser = (text, sessionId) => {
    if (!('speechSynthesis' in window)) {
      setIsSpeaking(false);
      setAvatarState('idle');
      setStatus('Tap to speak');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    let preferredVoice = null;
    if (browserVoiceURI) {
      preferredVoice = voices.find(v => v.voiceURI === browserVoiceURI);
    }
    if (!preferredVoice && voices.length > 0) {
      preferredVoice = voices[0];
    }
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.lang = preferredVoice?.lang || 'en-ZA';
    utterance.rate = 0.92;
    utterance.pitch = 0.82;
    synthUtteranceRef.current = utterance;

    utterance.onstart = () => {
      if (sessionId !== activeSessionRef.current) return;
      setIsSpeaking(true);
      setAvatarState('speaking');
      startAmplitudeTracking();
      setStatus('Speaking...');
    };

    utterance.onend = () => {
      if (sessionId !== activeSessionRef.current) return;
      setIsSpeaking(false);
      setAvatarState('idle');
      stopAmplitudeTracking();
      setStatus('Tap to speak');
    };

    utterance.onerror = () => {
      if (sessionId !== activeSessionRef.current) return;
      setIsSpeaking(false);
      setAvatarState('idle');
      stopAmplitudeTracking();
      setStatus('Tap to speak');
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    window.speechSynthesis.resume();
  };

  const stopSpeaking = () => {
    activeSessionRef.current += 1;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    stopAmplitudeTracking();
    setIsSpeaking(false);
    setAvatarState('idle');
  };

  const toggleMic = async () => {
    if (isSpeaking) {
      stopSpeaking();
      setStatus('Tap the mic to start');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      return;
    }

    if (recognitionRef.current) {
      setMicError(false);
      try {
        await setupAudioAnalyser();
        recognitionRef.current.start();
      } catch {
        setMicError(true);
        setStatus('Microphone unavailable');
      }
    } else {
      alert('Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-zinc-950 p-3 sm:p-6 items-center justify-center relative overflow-hidden select-none">
      {/* Mic Permission Alert */}
      {micError && (
        <div className="absolute top-4 inset-x-6 max-w-md mx-auto z-50 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-start gap-3 shadow-lg">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold uppercase tracking-wider">Microphone Blocked</p>
            <p className="mt-1 leading-relaxed">Please enable microphone access in your browser settings to speak to the AI Tutor.</p>
          </div>
        </div>
      )}

      {/* Avatar Container */}
      <div className="min-h-0 flex-1 w-full flex items-center justify-center relative max-w-lg">
        <AvatarCanvas 
          avatarState={avatarState} 
          speakingAmplitude={speakingAmplitude} 
          frequencyData={frequencyData} 
        />
        
        {/* Status indicator tag */}
        <div className="absolute bottom-4 px-4 py-2 rounded-full border border-emerald-500/20 bg-zinc-900/60 backdrop-blur-md text-emerald-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${
            avatarState === 'listening' ? 'bg-blue-500 animate-ping' :
            avatarState === 'speaking' ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-500'
          }`} />
          {status}
        </div>
      </div>

      {/* Transcripts Display */}
      <div className="w-full max-w-xl bg-zinc-900/40 border border-zinc-900 rounded-2xl p-3 sm:p-5 mb-4 sm:mb-6 backdrop-blur-md space-y-3 sm:space-y-4">
        <div>
          <div className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider mb-1">You said:</div>
          <p className="text-sm font-semibold text-zinc-300 min-h-[20px] leading-relaxed italic">
            {youTranscript || 'Speak to start conversation...'}
          </p>
        </div>

        {aiTranscript && (
          <div className="pt-3 border-t border-zinc-900">
            <div className="text-[10px] font-extrabold text-emerald-500 uppercase tracking-wider mb-1">AI Tutor reply:</div>
            <p className="text-sm font-medium text-zinc-200 leading-relaxed max-h-24 sm:max-h-[140px] overflow-y-auto">
              {aiTranscript}
            </p>
          </div>
        )}
      </div>

      {/* Control Mic Bar */}
      <div className="mb-4 sm:mb-6 flex flex-col items-center gap-2 sm:gap-3">
        <button
          onClick={toggleMic}
          className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all cursor-pointer ${
            isListening 
              ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-blue-500/20 animate-pulse' 
              : isSpeaking
              ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20'
              : 'bg-emerald-500 hover:bg-emerald-600 text-zinc-950 shadow-emerald-500/20 hover:scale-105'
          }`}
        >
          {isListening ? (
            <Mic className="w-6 h-6 stroke-[2.5px] animate-bounce" />
          ) : isSpeaking ? (
            <MicOff className="w-6 h-6 stroke-[2.5px]" />
          ) : (
            <Mic className="w-6 h-6 stroke-[2.5px]" />
          )}
        </button>
        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
          {isListening ? 'Click to Cancel' : isSpeaking ? 'Click to Stop Speaking' : 'Click to Speak'}
        </span>
      </div>

      {/* Banner Limit Info */}
      <div className="flex items-center gap-2 p-3 rounded-xl border border-zinc-900 bg-zinc-900/10 text-zinc-500 text-[10px] font-bold uppercase tracking-wide max-w-sm text-center">
        <Info className="w-4 h-4 shrink-0 text-emerald-500/70" />
        <span>Vocal synthesizers are optimized for 500 words per reply.</span>
      </div>
    </div>
  );
};

export default Voice;
