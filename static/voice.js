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
    this.audio = null;
    this.activeSession = 0;
    this.voiceId = localStorage.getItem("preferred_elevenlabs_voice") || "pNInz6obpgDQGcFmaJgB"; // Default Adam
    this._ampInterval = null;
  }

  setVoiceId(id) {
    if (id && id !== 'default') {
      this.voiceId = id;
      localStorage.setItem("preferred_elevenlabs_voice", id);
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
    if (this._ampInterval) {
      clearInterval(this._ampInterval);
      this._ampInterval = null;
    }
    window.speakingAmplitude = 0;
  }

  normalizeText(text) {
    return (text || "")
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/`/g, "")
      .replace(/#{1,6}\s/g, "")
      .replace(/F_net|F_s|F_k/g, "F net, F static, F kinetic")
      .replace(/vÂ²/g, "v squared")
      .replace(/m\/sÂ²/g, "metres per second squared")
      .trim()
      .slice(0, 2000);
  }

  async speak(text, onStart, onEnd) {
    this.activeSession += 1;
    const sessionId = this.activeSession;
    
    this.stop();
    const clean = this.normalizeText(text);
    if (!clean) {
      if (onEnd) onEnd();
      return;
    }

    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: clean, voice_id: this.voiceId })
      });

      if (!response.ok) throw new Error("TTS failed");

      const blob = await response.blob();
      if (sessionId !== this.activeSession) return;

      const url = URL.createObjectURL(blob);
      this.audio = new Audio(url);
      
      this.audio.onplay = () => {
        window.avatarState = window.AvatarState?.SPEAKING || "speaking";
        this.startAmplitudeTracking();
        if (onStart) onStart();
      };

      this.audio.onended = () => {
        if (sessionId !== this.activeSession) return;
        window.avatarState = window.AvatarState?.IDLE || "idle";
        this.stopAmplitudeTracking();
        if (onEnd) onEnd();
        URL.revokeObjectURL(url);
      };

      this.audio.onerror = () => {
        if (sessionId !== this.activeSession) return;
        window.avatarState = window.AvatarState?.IDLE || "idle";
        this.stopAmplitudeTracking();
        if (onEnd) onEnd();
        URL.revokeObjectURL(url);
      };

      await this.audio.play();

    } catch (e) {
      console.error("ElevenLabs TTS Error:", e);
      window.avatarState = window.AvatarState?.IDLE || "idle";
      if (onEnd) onEnd();
    }
  }

  stop() {
    this.activeSession += 1;
    if (this.audio) {
      this.audio.pause();
      this.audio.src = "";
      this.audio = null;
    }
    this.stopAmplitudeTracking();
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

const voiceTab = document.getElementById("tab-voice");
const micBtn = document.getElementById("voice-mic-btn");

let analyserSetup = false;
if (voiceTab) {
  // We can use a mutation observer to detect when the tab becomes active
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === "class") {
        if (voiceTab.classList.contains("active")) {
          if (!analyserSetup) {
            setupAudioAnalyser();
            analyserSetup = true;
          }
        } else {
          // Tab hidden, stop listening/speaking if active
          closeVoiceMode();
        }
      }
    });
  });
  observer.observe(voiceTab, { attributes: true });
}

function closeVoiceMode() {
  voiceInput.stop();
  voiceOutput.stop();
  isSpeaking = false;
  isListening = false;
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
