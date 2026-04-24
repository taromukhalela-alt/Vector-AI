function initVectorAI() {
  const chatMessages = document.getElementById("chat-messages");
  const chatInput = document.getElementById("chat-input");
  const sendBtn = document.getElementById("send-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const newSessionBtn = document.getElementById("new-session-btn");
  const mobileFab = document.getElementById("mobile-fab");
  const topicsGrid = document.getElementById("topics-grid");
  const voiceSelects = Array.from(document.querySelectorAll(".voice-select"));

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
      
      // Add "Save as Note" button for assistant messages
      if (role === 'assistant') {
        const noteBtn = document.createElement('button');
        noteBtn.className = 'note-action-btn';
        noteBtn.textContent = 'Save as Note';
        noteBtn.onclick = () => saveResponseAsNote(text);
        msg.appendChild(noteBtn);
      }
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

   async function saveResponseAsNote(content) {
     // Try to infer topic from conversation history
     const lastUserMsg = conversationHistory.slice(-2)[0]?.content || '';
     const topic = lastUserMsg.split(' ').slice(0, 3).join(' ') || 'General';
     
     try {
       const res = await fetch('/api/notes', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           title: `Note: ${topic}`,
           content: content,
           topic: topic,
           ai_generated: true
         })
       });
       const data = await res.json();
       if (data.success) {
         appendMessage('Note saved to your collection!', 'system');
       }
     } catch (err) {
       console.error('Failed to save note:', err);
     }
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
      // No-op
    }
  }

  async function sendMessage(message) {
    const question = (message || "").trim();
    if (!question || isSending) return;

    appendMessage(question, "user");
    if (chatInput) chatInput.value = "";
    showTypingIndicator();
    isSending = true;
    if (sendBtn) sendBtn.disabled = true;
    if (chatInput) chatInput.disabled = true;

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
      appendMessage("Connection error. Please try again.", "assistant");
    } finally {
      isSending = false;
      if (sendBtn) sendBtn.disabled = false;
      if (chatInput) {
        chatInput.disabled = false;
        chatInput.focus();
      }
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
      // ignore
    }
    conversationHistory = [];
    window.conversationHistory = conversationHistory;
    if (chatMessages) chatMessages.innerHTML = "";
  }

  if (newSessionBtn) newSessionBtn.addEventListener("click", handleNewSession);
  if (mobileFab) mobileFab.addEventListener("click", handleNewSession);

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await fetch("/logout", { method: "POST" });
      window.location.href = "/";
    });
  }

  const tabs = document.querySelectorAll(".tab-btn[data-tab]");
  const panels = document.querySelectorAll(".tab-panel");

  function activateTab(tabId) {
    panels.forEach((panel) => {
      panel.classList.remove("active");
      panel.style.display = "none";
    });
    tabs.forEach((btn) => btn.classList.remove("active"));

    const panel = document.getElementById(`tab-${tabId}`);
    const btn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);

    if (panel) {
      panel.classList.add("active");
      panel.style.display = "flex";
    }
    if (btn) btn.classList.add("active");

    if (tabId === "animations" && window.handleAnimResize) {
      window.handleAnimResize();
    }
  }

  tabs.forEach((btn) => {
    btn.addEventListener("click", () => activateTab(btn.dataset.tab));
  });

  const params = new URLSearchParams(window.location.search);
  const initialTab = params.get("tab") || "chat";
  const initialAnimation = params.get("anim");
  const initialQuestion = params.get("q");

  const topics = [
    { title: "Projectile Motion", desc: "Launch angles, range, and time of flight in CAPS Physical Sciences.", tag: "Physical Sci", prompt: "Explain projectile motion for Grade 11 CAPS Physical Sciences." },
    { title: "Gas Laws", desc: "Pressure, temperature, and volume relationships in chemistry.", tag: "Chemistry", prompt: "Explain Boyle's law and Charles's law with examples." },
    { title: "Reaction Rates", desc: "Collision theory, catalysts, and why reactions speed up.", tag: "Chemistry", prompt: "Explain collision theory and reaction rates." },
    { title: "Newton's Laws", desc: "Force, mass, and acceleration in action.", tag: "Physical Sci", prompt: "Explain Newton's second law with a simple example." },
    { title: "Waves", desc: "Frequency, wavelength, and speed with CAPS examples.", tag: "Physical Sci", prompt: "Explain wave motion and the Doppler effect." },
    { title: "Electric Fields", desc: "Charges and the field lines between them.", tag: "Physical Sci", prompt: "How do electric fields work?" },
    { title: "Bonding", desc: "Ionic and covalent bonding with particle-level explanations.", tag: "Chemistry", prompt: "Explain ionic and covalent bonding." },
    { title: "Acids and Bases", desc: "pH, neutralisation, and acid-base behavior in solution.", tag: "Chemistry", prompt: "Explain acids, bases, and pH." },
    { title: "Electrochemistry", desc: "Redox reactions, cells, and electron flow.", tag: "Chemistry", prompt: "Explain electrochemistry and galvanic cells." },
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

  if (window.loadAnimation) {
    const targetAnimation = initialAnimation || "idle";
    window.loadAnimation(targetAnimation);
    if (window.setActiveAnimButton) window.setActiveAnimButton(targetAnimation);
  }

  activateTab(initialTab);

  if (initialQuestion && chatInput) {
    chatInput.value = initialQuestion;
  }
  if (initialQuestion && !initialAnimation) {
    requestAnimationMatch(initialQuestion);
  }

  window.requestAnimationMatch = requestAnimationMatch;

  window.addEventListener("unhandledrejection", (e) => {
    console.error("Unhandled promise:", e.reason);
    appendMessage("Something went wrong. Please refresh if issues continue.", "assistant");
  });

  // --- History tab ---
  loadHistorySessions();

  window.addEventListener("error", (e) => {
    console.warn("Frontend error:", e.message);
    if (e.filename && e.filename.includes("animations.js") && window.clearScene) {
      window.clearScene();
    }
  });

  function loadHistorySessions() {
    const listEl = document.getElementById("session-list");
    if (!listEl) return;
    fetch("/api/history")
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data)) return;
        // Group into sessions by chat_id
        const sessions = {};
        data.forEach(entry => {
          const cid = entry.chat_id || "legacy";
          if (!sessions[cid]) sessions[cid] = [];
          sessions[cid].push(entry);
        });
        listEl.innerHTML = "";
        Object.entries(sessions).forEach(([chatId, msgs]) => {
          const firstMsg = msgs[0]?.message || "Session";
          const lastTime = msgs[msgs.length - 1]?.time || "";
          const btn = document.createElement("div");
          btn.className = "session-item";
          btn.innerHTML = `
            <div class="session-item-title">${escapeHtml(firstMsg.slice(0, 40))}</div>
            <div class="session-item-meta">${msgs.length} messages · ${formatHistoryTime(lastTime)}</div>
          `;
          btn.onclick = () => showHistorySession(chatId, msgs, btn);
          listEl.appendChild(btn);
        });
      })
      .catch(e => console.error("History load error:", e));
  }

  function showHistorySession(chatId, messages, btnEl) {
    document.querySelectorAll(".session-item").forEach(el => el.classList.remove("active"));
    if (btnEl) btnEl.classList.add("active");

    const detail = document.getElementById("history-detail");
    const empty = document.getElementById("history-empty");
    if (!detail) return;
    if (empty) empty.style.display = "none";

    detail.innerHTML = "";
    messages.forEach(entry => {
      const role = entry.username ? "user" : "assistant";
      const msg = document.createElement("div");
      msg.className = `history-msg ${role}`;
      msg.innerHTML = `
        <div>${escapeHtml(entry.message || entry.reply || "").replace(/\n/g, "<br>")}</div>
        <div class="msg-meta">${formatHistoryTime(entry.time)} · ${entry.topic || ""}</div>
      `;
      detail.appendChild(msg);
    });
  }

  function formatHistoryTime(isoStr) {
    if (!isoStr) return "";
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString("en-ZA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    } catch { return isoStr; }
  }

  const voiceLaunchBtn = document.getElementById("voice-launch-btn");
  if (voiceLaunchBtn && !("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
    voiceLaunchBtn.style.display = "none";
  }

  if (voiceSelects.length) {
    loadVoices();
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    fetch('/api/user/preferences')
      .then(res => res.json())
      .then(data => {
        const savedVoice = data.success && data.preferences.voice ? data.preferences.voice : 'default';
        syncVoiceSelectors(savedVoice);
        updateVoiceOutput(savedVoice);
      })
      .catch(() => {
        syncVoiceSelectors(localStorage.getItem('preferred_voice') || 'default');
        updateVoiceOutput(localStorage.getItem('preferred_voice') || 'default');
      });

    voiceSelects.forEach((select) => {
      select.addEventListener('change', () => {
        syncVoiceSelectors(select.value);
        fetch('/api/user/preferences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ voice: select.value })
        }).catch(() => {});
        updateVoiceOutput(select.value);
      });
    });
  }

  function loadVoices() {
    const voices = window.speechSynthesis.getVoices();
    voiceSelects.forEach((select) => {
      select.innerHTML = '<option value="default">Default Voice</option>';
      const added = new Set();
      voices.forEach((voice, i) => {
        const key = `${voice.name}-${voice.lang}`;
        if (!added.has(key)) {
          added.add(key);
          const option = document.createElement('option');
          option.value = i;
          option.textContent = `${voice.name} (${voice.lang})`;
          select.appendChild(option);
        }
      });
    });
    syncVoiceSelectors(localStorage.getItem('preferred_voice') || 'default');
  }

  function syncVoiceSelectors(value) {
    voiceSelects.forEach((select) => {
      select.value = value;
    });
  }

  function updateVoiceOutput(selectedIndex) {
    const voices = window.speechSynthesis.getVoices();
    if (selectedIndex !== 'default' && voices[parseInt(selectedIndex)]) {
      localStorage.setItem('preferred_voice', String(selectedIndex));
      if (window.voiceOutput) {
        window.voiceOutput.setVoice(voices[parseInt(selectedIndex)]);
      }
    } else {
      localStorage.removeItem('preferred_voice');
      if (window.voiceOutput) {
        window.voiceOutput.setVoice(null);
      }
    }
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initVectorAI);
} else {
  initVectorAI();
}
