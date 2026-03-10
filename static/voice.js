// === SPEECH RECOGNITION ===
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
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        event.results[i].isFinal ? (final += t) : (interim += t);
      }
      updateTranscript(interim || final, "interim");
      if (final) onResult(final);
    };

    this.recognition.onend = () => {
      window.avatarState = window.AvatarState?.IDLE || "idle";
      onEnd();
    };

    this.recognition.onerror = (e) => {
      console.error("Speech recognition error:", e.error);
      window.avatarState = window.AvatarState?.IDLE || "idle";
      onEnd();
      if (e.error === "not-allowed") showMicPermissionError();
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

// === SPEECH SYNTHESIS ===
class VoiceOutput {
  constructor() {
    this.synth = window.speechSynthesis;
    this.voice = null;
    this.loadVoices();
  }

  loadVoices() {
    const setVoice = () => {
      const voices = this.synth.getVoices();
      const preferred = [
        "Google UK English Female",
        "Microsoft Libby Online (Natural)",
        "Samantha",
        "Karen",
        "en-ZA",
        "en-GB",
        "en-US",
      ];

      for (const name of preferred) {
        const match = voices.find((v) => v.name.includes(name) || v.lang.includes(name));
        if (match) {
          this.voice = match;
          break;
        }
      }

      if (!this.voice) {
        this.voice = voices.find((v) => v.lang.startsWith("en")) || voices[0];
      }
    };

    setVoice();
    this.synth.addEventListener("voiceschanged", setVoice);
  }

  speak(text, onStart, onEnd) {
    this.synth.cancel();

    const clean = (text || "")
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/`/g, "")
      .replace(/#{1,6} /g, "")
      .replace(/\n+/g, ". ")
      .replace(/F_net|F_s|F_k/g, "F net, F static, F kinetic")
      .replace(/v²/g, "v squared")
      .replace(/m\/s²/g, "metres per second squared")
      .replace(/[=+\-×÷]/g, " ")
      .substring(0, 600);

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.voice = this.voice;
    utterance.rate = 0.95;
    utterance.pitch = 1.05;
    utterance.volume = 1.0;

    utterance.onstart = () => {
      window.avatarState = window.AvatarState?.SPEAKING || "speaking";
      this.startAmplitudeTracking();
      if (onStart) onStart();
    };

    utterance.onend = () => {
      window.avatarState = window.AvatarState?.IDLE || "idle";
      window.speakingAmplitude = 0;
      this.stopAmplitudeTracking();
      if (onEnd) onEnd();
    };

    utterance.onerror = () => {
      window.avatarState = window.AvatarState?.IDLE || "idle";
      window.speakingAmplitude = 0;
      if (onEnd) onEnd();
    };

    this.synth.speak(utterance);
  }

  startAmplitudeTracking() {
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

  stop() {
    this.synth.cancel();
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
  } catch (e) {
    console.warn("Audio analyser not available:", e);
  }
}

const voiceInput = new VoiceInput(onSpeechResult, onListeningStart, onListeningEnd);
const voiceOutput = new VoiceOutput();

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
    (e) => {
      e.preventDefault();
      startListening();
    },
    { passive: false }
  );

  micBtn.addEventListener(
    "touchend",
    (e) => {
      e.preventDefault();
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
  setVoiceStatus("Processing...");
}

async function onSpeechResult(transcript) {
  const transcriptYou = document.getElementById("transcript-you");
  const transcriptAi = document.getElementById("transcript-ai");
  if (transcriptYou) transcriptYou.textContent = transcript;
  if (transcriptAi) transcriptAi.textContent = "";
  setVoiceStatus("Thinking...");
  window.avatarState = window.AvatarState?.IDLE || "idle";

  try {
    const res = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: transcript,
        history: window.conversationHistory || [],
        voice_mode: true,
      }),
    });

    const data = await res.json();
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
  } catch (err) {
    setVoiceStatus("Error — try again");
    window.avatarState = window.AvatarState?.IDLE || "idle";
  }
}

function setVoiceStatus(text) {
  const el = document.getElementById("voice-status-label");
  if (el) el.textContent = text;
}

function updateTranscript(text, type) {
  if (type === "interim") {
    const transcriptYou = document.getElementById("transcript-you");
    if (transcriptYou) transcriptYou.textContent = `${text}...`;
  }
}

function showMicPermissionError() {
  const el = document.getElementById("mic-error");
  if (el) el.classList.remove("hidden");
}

window.openMicSettings = () => {
  alert("Please enable microphone access in your browser settings for this site.");
};

if (!("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
  if (voiceLaunchBtn) {
    voiceLaunchBtn.title = "Voice input requires Chrome or Edge. Text mode still works!";
  }
}
