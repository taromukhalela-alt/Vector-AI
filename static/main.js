const chatMessages = document.getElementById("chat-messages");
const chatInput = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");
const logoutBtn = document.getElementById("logout-btn");
const newSessionBtn = document.getElementById("new-session-btn");
const mobileFab = document.getElementById("mobile-fab");
const topicsGrid = document.getElementById("topics-grid");

let conversationHistory = [];
window.conversationHistory = conversationHistory;
let typingNode = null;
let isSending = false;

function sanitize(str) {
  const d = document.createElement("div");
  d.appendChild(document.createTextNode(str));
  return d.innerHTML;
}

function appendMessage(text, role) {
  if (!chatMessages) return;
  const msg = document.createElement("div");
  msg.className = `message ${role}`;
  msg.innerHTML = sanitize(text || "")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br>");
  chatMessages.appendChild(msg);
  msg.scrollIntoView({ behavior: "smooth", block: "end" });
}

function showTypingIndicator() {
  if (!chatMessages || typingNode) return;
  typingNode = document.createElement("div");
  typingNode.className = "typing-indicator";
  typingNode.innerHTML = "<span class=\"typing-dot\"></span><span class=\"typing-dot\"></span><span class=\"typing-dot\"></span>";
  chatMessages.appendChild(typingNode);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideTypingIndicator() {
  if (!typingNode) return;
  typingNode.remove();
  typingNode = null;
}

async function requestAnimationMatch(question) {
  try {
    const response = await fetch("/match-animation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    const data = await response.json();
    if (data && data.animation_id && window.loadAnimation) {
      window.loadAnimation(data.animation_id);
      if (window.setActiveAnimButton) {
        window.setActiveAnimButton(data.animation_id);
      }
    }
  } catch (_) {
    // No-op for animation matching failures
  }
}

async function sendMessage(message) {
  const question = (message || "").trim();
  if (!question) return;
  if (isSending) return;

  appendMessage(question, "user");
  if (chatInput) chatInput.value = "";
  showTypingIndicator();
  isSending = true;
  if (sendBtn) sendBtn.disabled = true;

  try {
    const response = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: question, history: conversationHistory }),
    });
    const data = await response.json();
    hideTypingIndicator();
    appendMessage(data.reply || "I need a moment to respond.", "assistant");
    conversationHistory = Array.isArray(data.history) ? data.history : conversationHistory;
    if (conversationHistory.length > 14) {
      conversationHistory = conversationHistory.slice(-14);
    }
    window.conversationHistory = conversationHistory;
    requestAnimationMatch(question);
  } catch (error) {
    hideTypingIndicator();
    appendMessage("Sorry, something went wrong. Try again.", "assistant");
  } finally {
    isSending = false;
    if (sendBtn) sendBtn.disabled = false;
  }
}

if (sendBtn && chatInput) {
  sendBtn.addEventListener("click", () => sendMessage(chatInput.value));
  chatInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage(chatInput.value);
    }
  });
}

const quickChips = document.querySelectorAll(".quick-prompt-chip");
quickChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    const prompt = chip.getAttribute("data-prompt") || chip.textContent || "";
    sendMessage(prompt);
  });
});

async function handleNewSession() {
  try {
    await fetch("/api/new_session", { method: "POST" });
  } catch (_) {
    // Ignore session reset failure
  }
  conversationHistory = [];
  window.conversationHistory = conversationHistory;
  if (chatMessages) chatMessages.innerHTML = "";
}

if (newSessionBtn) {
  newSessionBtn.addEventListener("click", handleNewSession);
}

if (mobileFab) {
  mobileFab.addEventListener("click", handleNewSession);
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await fetch("/logout", { method: "POST" });
    window.location.href = "/";
  });
}

const tabs = document.querySelectorAll(".tab-btn");
const panels = document.querySelectorAll(".tab-panel");

function activateTab(tabId) {
  tabs.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabId);
  });
  panels.forEach((panel) => {
    panel.classList.toggle("active", panel.id === `tab-${tabId}`);
  });
  if (tabId === "animations" && window.handleAnimResize) {
    window.handleAnimResize();
  }
}

tabs.forEach((btn) => {
  btn.addEventListener("click", () => activateTab(btn.dataset.tab));
});

const topics = [
  {
    title: "Projectile Motion",
    desc: "Launch angles, range, and time of flight.",
    tag: "Kinematics",
    prompt: "What is projectile motion?",
  },
  {
    title: "Simple Harmonic Motion",
    desc: "Pendulums, springs, and oscillations.",
    tag: "SHM",
    prompt: "Explain simple harmonic motion.",
  },
  {
    title: "Newton's Laws",
    desc: "Force, mass, and acceleration in action.",
    tag: "Dynamics",
    prompt: "Explain Newton's second law.",
  },
  {
    title: "Waves",
    desc: "Frequency, wavelength, and speed.",
    tag: "Waves",
    prompt: "Explain wave motion.",
  },
  {
    title: "Electric Fields",
    desc: "Charges and the field lines between them.",
    tag: "Electricity",
    prompt: "How do electric fields work?",
  },
  {
    title: "Magnetic Fields",
    desc: "Currents, fields, and particle motion.",
    tag: "Magnetism",
    prompt: "Explain magnetic fields around a wire.",
  },
  {
    title: "Refraction",
    desc: "Snell's law and light bending through media.",
    tag: "Optics",
    prompt: "What is refraction and Snell's law?",
  },
  {
    title: "Thermodynamics",
    desc: "Gas particles, temperature, and volume.",
    tag: "Thermo",
    prompt: "Explain the ideal gas law.",
  },
  {
    title: "Doppler Effect",
    desc: "Motion and frequency shifts in waves.",
    tag: "Waves",
    prompt: "What is the Doppler effect?",
  },
  {
    title: "Photoelectric Effect",
    desc: "Photon energy and electron emission.",
    tag: "Modern",
    prompt: "Explain the photoelectric effect.",
  },
];

if (topicsGrid) {
  topicsGrid.innerHTML = "";
  topics.forEach((topic) => {
    const card = document.createElement("div");
    card.className = "topic-card";
    card.innerHTML = `
      <div class="topic-title">${topic.title}</div>
      <div class="topic-desc">${topic.desc}</div>
      <div class="topic-tag">${topic.tag}</div>
    `;
    card.addEventListener("click", async () => {
      activateTab("chat");
      await sendMessage(topic.prompt);
      requestAnimationMatch(topic.prompt);
    });
    topicsGrid.appendChild(card);
  });
}

// Set initial animation match if the animations tab is opened directly
if (window.loadAnimation) {
  window.loadAnimation("idle");
  if (window.setActiveAnimButton) {
    window.setActiveAnimButton("idle");
  }
}

window.requestAnimationMatch = requestAnimationMatch;

window.addEventListener("unhandledrejection", (e) => {
  console.error("Unhandled promise:", e.reason);
  appendMessage("Something went wrong. Please refresh if issues continue.", "assistant");
});

window.addEventListener("error", (e) => {
  console.warn("Frontend error:", e.message);
  if (e.filename && e.filename.includes("animations.js") && window.clearScene) {
    window.clearScene();
  }
});

const voiceLaunchBtn = document.getElementById("voice-launch-btn");
if (voiceLaunchBtn && !("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
  voiceLaunchBtn.style.display = "none";
}
