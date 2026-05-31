import { useState, useEffect, useRef, useCallback } from 'react';
import AvatarCanvas from '../components/AvatarCanvas';
import { trackEvent } from '../useAnalytics';
import { useToast } from '../context/ToastContext';
import { Mic, MicOff, Info, Volume2 } from 'lucide-react';

const Voice = ({ onMatchAnimation, csrfToken }) => {
  const { showToast } = useToast();
  const [status, setStatus] = useState('Tap the mic to start');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [youTranscript, setYouTranscript] = useState('');
  const [aiTranscript, setAiTranscript] = useState('');
  const [avatarState, setAvatarState] = useState('idle');
  const [speakingAmplitude, setSpeakingAmplitude] = useState(0);
  const [frequencyData, setFrequencyData] = useState(null);

  const isSpeakingRef = useRef(false);
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const interimTranscriptRef = useRef('');
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

  const processWhisperSTT = async (audioBlob) => {
    setStatus('Transcribing...');
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      
      const res = await fetch('/api/stt', {
        method: 'POST',
        headers: { 'X-CSRF-Token': csrfToken },
        body: formData
      });
      
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success && data.text) {
        setYouTranscript(data.text);
        handleSpeechInput(data.text);
        return;
      }
      console.warn('Whisper STT did not return usable text:', {
        status: res.status,
        message: data.message,
      });
    } catch (e) {
      console.error('Whisper STT error', e);
    }
    
    // Fallback to browser
    const fallbackText = interimTranscriptRef.current;
    if (fallbackText) {
      console.warn('Falling back to browser STT text');
      showToast({
        type: 'warning',
        title: 'Using browser transcript',
        message: 'Cloud transcription had trouble, so I used the live browser transcript instead.',
      });
      setYouTranscript(fallbackText);
      handleSpeechInput(fallbackText);
    } else {
      setStatus('Could not hear anything');
      setAvatarState('idle');
      showToast({
        type: 'warning',
        title: 'No speech detected',
        message: 'I could not hear that clearly. Please move closer to the mic and try again.',
      });
    }
  };

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
      throw error;
    }
  };

  const stopAmplitudeTracking = useCallback(() => {
    if (ampIntervalRef.current) {
      clearInterval(ampIntervalRef.current);
      ampIntervalRef.current = null;
    }
    setSpeakingAmplitude(0);
  }, []);

  const stopSpeaking = useCallback(() => {
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
  }, [stopAmplitudeTracking]);

  const stopAllVoiceState = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* noop */ }
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try { mediaRecorderRef.current.stop(); } catch { /* noop */ }
    }
    stopSpeaking();
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current) {
      audioContextRef.current.stream.getTracks().forEach(t => t.stop());
      try { audioContextRef.current.audioCtx.close(); } catch { /* noop */ }
      audioContextRef.current = null;
    }
  }, [stopSpeaking]);

  // Setup Web Speech Recognition for interim fallback
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      console.warn('Speech recognition not supported in this browser.');
      return undefined;
    }

    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = 'en-ZA';

    rec.onstart = () => {
      interimTranscriptRef.current = '';
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
      const combined = (final + ' ' + interim).trim();
      if (combined) {
        interimTranscriptRef.current = combined;
        setYouTranscript(combined + '...');
      }
    };

    rec.onend = () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };

    rec.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        showToast({
          type: 'error',
          title: 'Microphone blocked',
          message: 'Please enable microphone access in your browser settings to speak to the AI Tutor.',
        });
      }
    };

    recognitionRef.current = rec;

    return () => {
      stopAllVoiceState();
    };
  }, [showToast, stopAllVoiceState]);

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
    setStatus('Processing...');
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
          max_chars: ttsProvider === 'camb' ? 500 : undefined,
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
      setStatus('Tap to speak');
      setAvatarState('idle');
      showToast({
        type: 'error',
        title: 'Voice tutor paused',
        message: 'I could not get a response right now. Please try again in a moment.',
      });
    }
  };

  const readResponsePreview = async (response) => {
    const contentType = response.headers.get('Content-Type') || '';
    try {
      if (contentType.toLowerCase().includes('application/json')) {
        const data = await response.json();
        return { contentType, body: data };
      }
      const text = await response.text();
      return { contentType, body: text.slice(0, 400) };
    } catch (error) {
      return { contentType, body: `Unable to read response body: ${error.message}` };
    }
  };

  const speakText = async (text) => {
    stopSpeaking();
    activeSessionRef.current += 1;
    const sessionId = activeSessionRef.current;

    const cleanText = normalizeText(text);
    if (!cleanText) return;

    if (ttsProvider === 'browser') {
      speakWithBrowser(cleanText, sessionId, { notifyOnFailure: true });
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

        const contentType = response.headers.get('Content-Type') || '';
        if (!response.ok) {
          const details = await readResponsePreview(response);
          console.error('Cloud TTS request failed:', {
            provider: ttsProvider,
            status: response.status,
            details,
          });
          throw new Error('Cloud TTS request failed');
        }

        if (!contentType.toLowerCase().startsWith('audio/')) {
          const details = await readResponsePreview(response);
          console.error('Cloud TTS returned a non-audio response:', {
            provider: ttsProvider,
            status: response.status,
            details,
          });
          throw new Error('Cloud TTS response was not audio');
        }

        const blob = await response.blob();
        if (blob.size === 0) {
          throw new Error('Cloud TTS returned empty audio');
        }
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
          setStatus('Switching to browser voice...');
          URL.revokeObjectURL(url);
          console.error('Audio playback error (Cloud TTS format unsupported or corrupted)');
          showToast({
            type: 'warning',
            title: 'Cloud voice unavailable',
            message: 'Using your browser voice instead.',
          });
          speakWithBrowser(cleanText, sessionId, { notifyOnFailure: true });
        };

        await aud.play();
      } catch (e) {
        console.error('Cloud TTS error:', e);
        if (sessionId === activeSessionRef.current) {
          setIsSpeaking(false);
          setAvatarState('idle');
          stopAmplitudeTracking();
          setStatus('Switching to browser voice...');
          showToast({
            type: 'warning',
            title: 'Cloud voice unavailable',
            message: 'Using your browser voice instead.',
          });
          speakWithBrowser(cleanText, sessionId, { notifyOnFailure: true });
        }
      }
    }
  };

  const speakWithBrowser = (text, sessionId, options = {}) => {
    if (!('speechSynthesis' in window)) {
      setIsSpeaking(false);
      setAvatarState('idle');
      setStatus('Tap to speak');
      if (options.notifyOnFailure) {
        showToast({
          type: 'error',
          title: 'Audio unavailable',
          message: "I couldn't play audio. You can still read the answer below.",
        });
      }
      return false;
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

    utterance.onerror = (event) => {
      if (sessionId !== activeSessionRef.current) return;
      console.error('Browser speech synthesis error:', event.error);
      setIsSpeaking(false);
      setAvatarState('idle');
      stopAmplitudeTracking();
      setStatus('Tap to speak');
      if (options.notifyOnFailure) {
        showToast({
          type: 'error',
          title: 'Audio unavailable',
          message: "I couldn't play audio. You can still read the answer below.",
        });
      }
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    window.speechSynthesis.resume();
    return true;
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
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      return;
    }

    try {
      await setupAudioAnalyser();
      
      if (audioContextRef.current?.stream) {
        audioChunksRef.current = [];
        const mr = new MediaRecorder(audioContextRef.current.stream);
        mr.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };
        mr.onstop = async () => {
          setIsListening(false);
          if (!isSpeakingRef.current) setAvatarState('idle');
          
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          if (audioBlob.size > 0) {
            await processWhisperSTT(audioBlob);
          } else {
            setStatus('No audio recorded');
            setAvatarState('idle');
            showToast({
              type: 'warning',
              title: 'No audio recorded',
              message: 'I did not receive any microphone audio. Please try again.',
            });
          }
        };
        mediaRecorderRef.current = mr;
        mr.start();
      }

      if (recognitionRef.current) {
        interimTranscriptRef.current = '';
        recognitionRef.current.start();
      }
      
      setIsListening(true);
      setAvatarState('listening');
      setStatus('Listening...');
      setYouTranscript('...');
    } catch (error) {
      console.error('Microphone unavailable:', error);
      setStatus('Microphone unavailable');
      showToast({
        type: 'error',
        title: 'Microphone unavailable',
        message: 'Please allow microphone access in your browser, then try speaking again.',
      });
    }
  };

  return (
    <div className="relative flex h-full min-h-0 flex-col items-center justify-between overflow-hidden bg-zinc-950 px-3 py-4 select-none sm:px-6 sci-grid">
      {/* Avatar Container */}
      <div className="relative flex min-h-0 w-full max-w-lg flex-1 items-center justify-center">
        
        {/* Glow behind avatar */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full blur-[80px] pointer-events-none transition-all duration-700 ${
          isListening ? 'bg-blue-500/20' : isSpeaking ? 'bg-emerald-500/30' : 'bg-transparent'
        }`} />

        <AvatarCanvas 
          avatarState={avatarState} 
          speakingAmplitude={speakingAmplitude} 
          frequencyData={frequencyData} 
        />
        
        {/* Status indicator tag */}
        <div className="absolute top-8 px-4 py-2 rounded-full border bg-zinc-900/80 backdrop-blur-md text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 shadow-lg transition-colors"
          style={{
            borderColor: isListening ? 'rgba(59,130,246,0.3)' : isSpeaking ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)',
            color: isListening ? '#60a5fa' : isSpeaking ? '#34d399' : '#a1a1aa'
          }}
        >
          <span className={`w-2 h-2 rounded-full ${
            avatarState === 'listening' ? 'bg-blue-500 animate-ping' :
            avatarState === 'speaking' ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-500'
          }`} />
          {status}
        </div>
      </div>

      {/* ── Transcripts Display & Controls Container ── */}
      <div className="w-full max-w-2xl shrink-0 flex flex-col gap-4 z-10">
        
        {/* Transcript Box */}
        <div className="w-full rounded-2xl overflow-hidden anim-fade-up glass"
          style={{
            padding: '16px',
            maxHeight: '180px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div className="flex-1 overflow-y-auto">
            {youTranscript ? (
              <div className="mb-4">
                <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Student</div>
                <p className="text-sm font-semibold text-zinc-300 leading-relaxed italic">
                  "{youTranscript}"
                </p>
              </div>
            ) : (
              <div className="text-center py-4 text-zinc-500 flex flex-col items-center gap-2">
                <Volume2 className="w-6 h-6 opacity-50" />
                <span className="text-xs font-bold uppercase tracking-wider">Awaiting voice input...</span>
              </div>
            )}

            {aiTranscript && (
              <div className="pt-3 border-t border-white/[0.08]">
                <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1.5">AI Tutor</div>
                <p className="text-sm font-medium text-zinc-100 leading-relaxed">
                  {aiTranscript}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Control Mic Bar */}
        <div className="flex shrink-0 items-center justify-between p-4 rounded-2xl glass anim-fade-up d-100">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-zinc-400">
             <Info className="w-4 h-4 text-emerald-500" />
             <span className="hidden sm:inline">Optimized for short vocal queries.</span>
             <span className="sm:hidden">Short queries only.</span>
          </div>

          <div className="flex flex-col items-center gap-1.5 absolute left-1/2 -translate-x-1/2 -top-6">
            <button
              onClick={toggleMic}
              className={`w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all cursor-pointer border-4 border-zinc-950 ${
                isListening 
                  ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-[0_0_30px_rgba(59,130,246,0.4)]' 
                  : isSpeaking
                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-[0_0_30px_rgba(239,68,68,0.4)]'
                  : 'bg-gradient-to-br from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-zinc-950 shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:scale-105 hover:-translate-y-1'
              }`}
            >
              {isListening ? (
                <Mic className="w-7 h-7 stroke-[2.5px] animate-bounce" />
              ) : isSpeaking ? (
                <MicOff className="w-7 h-7 stroke-[2.5px]" />
              ) : (
                <Mic className="w-7 h-7 stroke-[2.5px] fill-current" />
              )}
            </button>
            <span className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-widest bg-zinc-950 px-2 py-0.5 rounded-full mt-1">
              {isListening ? 'Stop' : isSpeaking ? 'Cancel' : 'Tap to speak'}
            </span>
          </div>

          <div className="w-[100px]" /> {/* Spacer for symmetry */}
        </div>
      </div>
    </div>
  );
};

export default Voice;
