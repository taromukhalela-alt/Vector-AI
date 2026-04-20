class VoiceInput {
  constructor(onResult, onStart, onEnd) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      console.warn("Speech recognition not supported in this browser.");
      this.supported = false;
      return;
    }

    this.supported = true;
    this.recognition = new SR();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = "en-ZA";

    this.recognition.onstart = () => {
      window.avatarState = window.AvatarState?.LISTENING || "listening";
      onStart();
    };

    this.recognition.onresult = (event) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += text;
        } else {
          interim += text;
        }
      }
      updateTranscript(interim || final, "interim");
      if (final) onResult(final.trim());
    };

    this.recognition.onend = () => {
      window.avatarState = window.AvatarState?.IDLE || "idle";
      onEnd();
    };

    this.recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      window.avatarState = window.AvatarState?.IDLE || "idle";
      onEnd();
      if (event.error === "not-allowed") {
        showMicPermissionError();
      }
    };
  }

  start() {
    if (!this.supported) return;
    try {
      this.recognition.start();
    } catch (_) {}
  }

  stop() {
    if (!this.supported) return;
    try {
      this.recognition.stop();
    } catch (_) {}
  }
}

class VoiceOutput {
  constructor() {
    this.synth = window.speechSynthesis;
    this.voice = null;
    this.resumeTimer = null;
    this.activeSession = 0;
    this.loadVoices();
  }

  loadVoices() {
    const setVoice = () => {
      const voices = this.synth.getVoices();
      const savedVoiceIndex = localStorage.getItem("preferred_voice");

      if (savedVoiceIndex !== null && voices[parseInt(savedVoiceIndex, 10)]) {
        this.voice = voices[parseInt(savedVoiceIndex, 10)];
        return;
      }

      const preferred = [
        "Google UK English Female",
        "Microsoft Libby Online (Natural)",
        "Microsoft Ryan Online (Natural)",
        "Samantha",
        "Karen",
        "en-ZA",
        "en-GB",
        "en-US",
      ];

      for (const name of preferred) {
        const match = voices.find((voice) => voice.name.includes(name) || voice.lang.includes(name));
        if (match) {
          this.voice = match;
          return;
        }
      }

      this.voice = voices.find((voice) => voice.lang.startsWith("en")) || voices[0] || null;
    };

    setVoice();
    this.synth.addEventListener("voiceschanged", () => {
      setVoice();
      if (window.onVoicesLoaded) window.onVoicesLoaded();
    });
  }

  setVoice(voice) {
    if (voice) {
      this.voice = voice;
      return;
    }
    this.loadVoices();
  }

  splitIntoChunks(text) {
    const content = (text || "").trim();
    if (!content) return [];

    const sentences = content.match(/[^.!?]+[.!?]?/g) || [content];
    const chunks = [];
    let current = "";

    sentences.forEach((sentence) => {
      const next = current ? `${current} ${sentence.trim()}` : sentence.trim();
      if (next.length > 220 && current) {
        chunks.push(current.trim());
        current = sentence.trim();
      } else {
        current = next;
      }
    });

    if (current) {
      chunks.push(current.trim());
    }

    return chunks;
  }

  startResumeGuard() {
    this.stopResumeGuard();
    this.resumeTimer = setInterval(() => {
      if (this.synth?.speaking) {
        this.synth.resume();
      }
    }, 1500);
  }

  stopResumeGuard() {
    if (this.resumeTimer) {
      clearInterval(this.resumeTimer);
      this.resumeTimer = null;
    }
  }

  startAmplitudeTracking() {
    this.stopAmplitudeTracking();
    let t = 0;
    this._ampInterval = setInterval(() => {
      t += 0.1;
      window.speakingAmplitude = Math.max(
        0,
        0.4 + Math.sin(t * 8) * 0.2 + Math.sin(t * 3.3) * 0.15 + Math.random() * 0.15
      );
    }, 50);
  }

  stopAmplitudeTracking() {
    clearInterval(this._ampInterval);
    window.speakingAmplitude = 0;
  }

  normalizeText(text) {
    return (text || "")
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/`/g, "")
      .replace(/#{1,6}\s/g, "")
      .replace(/\n+/g, ". ")
      .replace(/F_net|F_s|F_k/g, "F net, F static, F kinetic")
      .replace(/vÂ²/g, "v squared")
      .replace(/m\/sÂ²/g, "metres per second squared")
      .replace(/[=+\-Ã—Ã·]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 1200);
  }

  speak(text, onStart, onEnd) {
    this.activeSession += 1;
    const sessionId = this.activeSession;
    this.synth.cancel();
    this.stopAmplitudeTracking();
    this.stopResumeGuard();

    const clean = this.normalizeText(text);
    const chunks = this.splitIntoChunks(clean);
    if (!chunks.length) {
      if (onEnd) onEnd();
      return;
    }

    const speakChunk = (index) => {
      if (sessionId !== this.activeSession) return;

      if (index >= chunks.length) {
        window.avatarState = window.AvatarState?.IDLE || "idle";
        this.stopAmplitudeTracking();
        this.stopResumeGuard();
        if (onEnd) onEnd();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(chunks[index]);
      utterance.voice = this.voice;
      utterance.rate = 0.95;
      utterance.pitch = 1.02;
      utterance.volume = 1.0;

      utterance.onstart = () => {
        window.avatarState = window.AvatarState?.SPEAKING || "speaking";
        this.startAmplitudeTracking();
        this.startResumeGuard();
        if (index === 0 && onStart) onStart();
      };

      utterance.onend = () => {
        if (sessionId !== this.activeSession) return;
        speakChunk(index + 1);
      };

      utterance.onerror = () => {
        if (sessionId !== this.activeSession) return;
        speakChunk(index + 1);
      };

      this.synth.speak(utterance);
    };

    speakChunk(0);
  }

  stop() {
    this.activeSession += 1;
    this.synth.cancel();
    this.stopAmplitudeTracking();
    this.stopResumeGuard();
    window.avatarState = window.AvatarState?.IDLE || "idle";
    window.speakingAmplitude = 0;
  }
}

async function setupAudioAnalyser() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 128;
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function updateFrequencyData() {
      analyser.getByteFrequencyData(dataArray);
      window.audioFrequencyData = dataArray;
      requestAnimationFrame(updateFrequencyData);
    }
    updateFrequencyData();
  } catch (error) {
    console.warn("Audio analyser not available:", error);
  }
}

const voiceInput = new VoiceInput(onSpeechResult, onListeningStart, onListeningEnd);
const voiceOutput = new VoiceOutput();
window.voiceOutput = voiceOutput;
window.voiceInput = voiceInput;

let isSpeaking = false;
let isListening = false;

const voiceLaunchBtn = document.getElementById("voice-launch-btn");
const voiceOverlay = document.getElementById("voice-mode");
const voiceCloseBtn = document.getElementById("voice-close-btn");
const voiceEndBtn = document.getElementById("voice-end-btn");
const micBtn = document.getElementById("voice-mic-btn");

if (voiceLaunchBtn && voiceOverlay) {
  voiceLaunchBtn.addEventListener("click", () => {
    voiceOverlay.classList.remove("hidden");
    voiceOverlay.classList.add("active");
    setVoiceStatus("Tap the mic to start");
    setupAudioAnalyser();
  });
}

if (voiceCloseBtn) voiceCloseBtn.addEventListener("click", closeVoiceMode);
if (voiceEndBtn) voiceEndBtn.addEventListener("click", closeVoiceMode);

function closeVoiceMode() {
  voiceInput.stop();
  voiceOutput.stop();
  isSpeaking = false;
  isListening = false;
  if (voiceOverlay) {
    voiceOverlay.classList.remove("active");
    voiceOverlay.classList.add("hidden");
  }
  window.avatarState = window.AvatarState?.IDLE || "idle";
}

if (micBtn) {
  micBtn.addEventListener("click", () => {
    if (isSpeaking) {
      voiceOutput.stop();
      isSpeaking = false;
      setVoiceStatus("Tap the mic to start");
      return;
    }
    if (isListening) {
      voiceInput.stop();
      return;
    }
    startListening();
  });

  micBtn.addEventListener(
    "touchstart",
    (event) => {
      event.preventDefault();
      startListening();
    },
    { passive: false }
  );

  micBtn.addEventListener(
    "touchend",
    (event) => {
      event.preventDefault();
      voiceInput.stop();
    },
    { passive: false }
  );
}

function startListening() {
  if (!voiceInput.supported) {
    alert("Voice input is not supported in this browser. Please use Chrome or Edge.");
    return;
  }
  voiceInput.start();
}

function onListeningStart() {
  isListening = true;
  if (micBtn) micBtn.classList.add("recording");
  setVoiceStatus("Listening...");
  const transcriptYou = document.getElementById("transcript-you");
  if (transcriptYou) transcriptYou.textContent = "...";
}

function onListeningEnd() {
  isListening = false;
  if (micBtn) micBtn.classList.remove("recording");
  if (!isSpeaking) {
    setVoiceStatus("Processing...");
  }
}

async function onSpeechResult(transcript) {
  const transcriptYou = document.getElementById("transcript-you");
  const transcriptAi = document.getElementById("transcript-ai");
  if (transcriptYou) transcriptYou.textContent = transcript;
  if (transcriptAi) transcriptAi.textContent = "";
  setVoiceStatus("Thinking...");
  window.avatarState = window.AvatarState?.IDLE || "idle";

  try {
    const response = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: transcript,
        history: window.conversationHistory || [],
        voice_mode: true,
      }),
    });

    const data = await response.json();
    window.conversationHistory = Array.isArray(data.history) ? data.history : window.conversationHistory;
    if (window.conversationHistory.length > 14) {
      window.conversationHistory = window.conversationHistory.slice(-14);
    }

    const reply = data.reply || "";
    if (transcriptAi) transcriptAi.textContent = reply;

    if (window.requestAnimationMatch) {
      window.requestAnimationMatch(transcript);
    }

    setVoiceStatus("Speaking...");
    isSpeaking = true;
    voiceOutput.speak(
      reply,
      () => {
        window.avatarState = window.AvatarState?.SPEAKING || "speaking";
      },
      () => {
        isSpeaking = false;
        window.avatarState = window.AvatarState?.IDLE || "idle";
        setVoiceStatus("Tap to speak");
      }
    );
  } catch (error) {
    console.error("Voice chat failed:", error);
    isSpeaking = false;
    setVoiceStatus("Error. Try again.");
    window.avatarState = window.AvatarState?.IDLE || "idle";
  }
}

function setVoiceStatus(text) {
  const label = document.getElementById("voice-status-label");
  if (label) label.textContent = text;
}

function updateTranscript(text, type) {
  if (type === "interim") {
    const transcriptYou = document.getElementById("transcript-you");
    if (transcriptYou) transcriptYou.textContent = `${text}...`;
  }
}

function showMicPermissionError() {
  const error = document.getElementById("mic-error");
  if (error) error.classList.remove("hidden");
}

window.openMicSettings = () => {
  alert("Please enable microphone access in your browser settings for this site.");
};

if (!("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
  if (voiceLaunchBtn) {
    voiceLaunchBtn.title = "Voice input requires Chrome or Edge. Text mode still works.";
  }
}
