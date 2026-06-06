let notes = [];
let editingNoteId = null;
let examSetupModal = null;
let searchTimer = null;
let currentNoteTags = [];
let noteUsedAI = false;

document.addEventListener("DOMContentLoaded", () => {
  loadNotes();
  setupEventListeners();
});

function loadNotes() {
  fetch("/api/notes")
    .then((r) => r.json())
    .then((data) => {
      if (data.success) {
        notes = data.notes;
        renderNotes();
      }
    })
    .catch((e) => console.error("Failed to load notes:", e));
}

function renderNotes(notesToRender = notes) {
  const grid = document.getElementById("notes-grid");
  const emptyState = document.getElementById("empty-state");
  if (!grid || !emptyState) return;

  grid.innerHTML = "";
  if (!notesToRender.length) {
    emptyState.classList.remove("hidden");
    return;
  }
  emptyState.classList.add("hidden");

  notesToRender.forEach((note) => {
    const card = document.createElement("div");
    card.className = "note-card";
    card.onclick = () => viewNote(note.id);
    
    card.innerHTML = `
      <div class="note-card-title">${escapeHtml(note.title)}</div>
      <div class="note-card-meta">${formatDate(note.created_at)}</div>
      ${note.topic ? `<span class="note-card-topic">${escapeHtml(note.topic)}</span>` : ""}
      <div class="note-card-content">${renderMarkdown(note.content)}</div>
      <div class="note-card-actions" onclick="event.stopPropagation()">
        <button class="note-action-btn" onclick="editNote('${note.id}')">Edit</button>
        <button class="note-action-btn" onclick="deleteNote('${note.id}')">Delete</button>
      </div>
    `;
    grid.appendChild(card);
    renderLatexInElement(card);
  });
}

function simpleMarkdown(text) {
  if (!text) return "";
  return escapeHtml(text)
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/^### (.+)$/gm, "<h4>$1</h4>")
    .replace(/^## (.+)$/gm, "<h3>$1</h3>")
    .replace(/^# (.+)$/gm, "<h2>$1</h2>")
    .replace(/\n/g, "<br>");
}

function renderMarkdown(text) {
  if (!text) return "";
  if (typeof marked !== "undefined") {
    try {
      marked.setOptions({ breaks: true, gfm: true, headerIds: false, mangle: false });
      return marked.parse(text);
    } catch (e) { /* fallback */ }
  }
  return simpleMarkdown(text);
}

function renderLatexInElement(el) {
  if (typeof renderMathInElement === "function") {
    try {
      renderMathInElement(el, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false },
          { left: "\\(", right: "\\)", display: false },
          { left: "\\[", right: "\\]", display: true },
        ],
        throwOnError: false,
      });
    } catch (e) { /* silent */ }
  }
}

function viewNote(noteId) {
  const note = notes.find((n) => n.id === noteId);
  if (!note) return;
  openModal(note, true);
}

function setupEventListeners() {
  const form = document.getElementById("note-form");
  const createBtn = document.getElementById("create-note-btn");
  const searchInput = document.getElementById("note-search");
  const modal = document.getElementById("note-modal");

  if (createBtn) createBtn.addEventListener("click", () => openModal());

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      await saveNote();
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const q = e.target.value.trim();
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => searchNotes(q), 250);
    });
  }

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });
  }
}

async function searchNotes(query) {
  if (!query) {
    renderNotes(notes);
    return;
  }
  try {
    const response = await fetch("/api/notes/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    const data = await response.json();
    if (data.success) {
      renderNotes(data.notes || []);
      return;
    }
  } catch (error) {
    console.warn("Semantic search failed, using local filter:", error);
  }
  const q = query.toLowerCase();
  renderNotes(
    notes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        (n.topic && n.topic.toLowerCase().includes(q)) ||
        (Array.isArray(n.tags) && n.tags.join(" ").toLowerCase().includes(q))
    )
  );
}

function openModal(note = null, viewOnly = false) {
  const modal = document.getElementById("note-modal");
  const titleEl = document.getElementById("note-title");
  const topicEl = document.getElementById("note-topic");
  const contentEl = document.getElementById("note-content");
  const previewContainer = document.getElementById("note-preview-container");
  const previewEl = document.getElementById("note-preview");
  const modalTitle = document.getElementById("modal-title");
  const toggleBtn = document.getElementById("toggle-view-btn");
  const genBtn = document.querySelector(".ai-gen-btn");
  const footer = modal?.querySelector(".modal-footer");

  if (!modal || !titleEl || !topicEl || !contentEl || !modalTitle) return;

  if (note) {
    editingNoteId = note.id;
    currentNoteTags = Array.isArray(note.tags) ? note.tags.slice(0, 6) : [];
    noteUsedAI = note.source === "ai";
    titleEl.value = note.title;
    topicEl.value = note.topic || "";
    contentEl.value = note.content;
    modalTitle.textContent = viewOnly ? note.title : "Edit Note";
    
    if (viewOnly) {
      contentEl.style.display = "none";
      previewContainer.style.display = "block";
      previewEl.innerHTML = renderMarkdown(note.content);
      renderLatexInElement(previewEl);
      titleEl.style.display = "none";
      topicEl.style.display = "none";
      if (footer) footer.style.display = "none";
      if (toggleBtn) { toggleBtn.classList.remove("hidden"); toggleBtn.textContent = "Edit"; }
      if (genBtn) genBtn.style.display = "none";
      const pdfBtn = document.getElementById("download-pdf-btn");
      if (pdfBtn) pdfBtn.classList.remove("hidden");
    } else {
      contentEl.style.display = "block";
      previewContainer.style.display = "none";
      titleEl.style.display = "block";
      topicEl.style.display = "block";
      if (footer) footer.style.display = "flex";
      if (toggleBtn) { toggleBtn.classList.remove("hidden"); toggleBtn.textContent = "Preview"; }
      if (genBtn) genBtn.style.display = "inline-block";
      const pdfBtn = document.getElementById("download-pdf-btn");
      if (pdfBtn) pdfBtn.classList.add("hidden");
    }
  } else {
    editingNoteId = null;
    currentNoteTags = [];
    noteUsedAI = false;
    titleEl.value = "";
    topicEl.value = "";
    contentEl.value = "";
    contentEl.style.display = "block";
    previewContainer.style.display = "none";
    titleEl.style.display = "block";
    topicEl.style.display = "block";
    modalTitle.textContent = "Create New Note";
    if (footer) footer.style.display = "flex";
    if (toggleBtn) { toggleBtn.classList.remove("hidden"); toggleBtn.textContent = "Preview"; }
    if (genBtn) genBtn.style.display = "inline-block";
    const pdfBtn = document.getElementById("download-pdf-btn");
    if (pdfBtn) pdfBtn.classList.add("hidden");
  }

  modal.classList.add("active");
}

function toggleViewEdit() {
  const contentEl = document.getElementById("note-content");
  const previewContainer = document.getElementById("note-preview-container");
  const previewEl = document.getElementById("note-preview");
  const toggleBtn = document.getElementById("toggle-view-btn");
  const titleEl = document.getElementById("note-title");
  const topicEl = document.getElementById("note-topic");
  const footer = document.querySelector(".modal-footer");
  const genBtn = document.querySelector(".ai-gen-btn");
  const pdfBtn = document.getElementById("download-pdf-btn");

  if (contentEl.style.display === "none") {
    // Switch to edit
    contentEl.style.display = "block";
    previewContainer.style.display = "none";
    titleEl.style.display = "block";
    topicEl.style.display = "block";
    if (footer) footer.style.display = "flex";
    if (toggleBtn) toggleBtn.textContent = "Preview";
    if (genBtn) genBtn.style.display = "inline-block";
    if (pdfBtn) pdfBtn.classList.add("hidden");
  } else {
    // Switch to preview
    contentEl.style.display = "none";
    previewContainer.style.display = "block";
    previewEl.innerHTML = renderMarkdown(contentEl.value);
    renderLatexInElement(previewEl);
    if (toggleBtn) toggleBtn.textContent = "Edit";
    if (pdfBtn && contentEl.value.trim()) pdfBtn.classList.remove("hidden");
  }
}

function showPreviewMode() {
  const contentEl = document.getElementById("note-content");
  const previewContainer = document.getElementById("note-preview-container");
  const previewEl = document.getElementById("note-preview");
  const toggleBtn = document.getElementById("toggle-view-btn");
  const titleEl = document.getElementById("note-title");
  const topicEl = document.getElementById("note-topic");
  const pdfBtn = document.getElementById("download-pdf-btn");
  if (!contentEl || !previewContainer || !previewEl) return;
  contentEl.style.display = "none";
  previewContainer.style.display = "block";
  previewEl.innerHTML = renderMarkdown(contentEl.value);
  renderLatexInElement(previewEl);
  if (titleEl) titleEl.style.display = "block";
  if (topicEl) topicEl.style.display = "block";
  if (toggleBtn) {
    toggleBtn.classList.remove("hidden");
    toggleBtn.textContent = "Edit";
  }
  if (pdfBtn && contentEl.value.trim()) pdfBtn.classList.remove("hidden");
}

async function generateAINote() {
  const topicEl = document.getElementById("note-topic");
  const titleEl = document.getElementById("note-title");
  const contentEl = document.getElementById("note-content");
  const genBtn = document.querySelector(".ai-gen-btn");

  const topic = topicEl.value.trim() || titleEl.value.trim() || "CAPS Physics or Chemistry";
  
  if (!topic) {
    alert("Please enter a topic or title first.");
    return;
  }

  const originalText = genBtn.textContent;
  genBtn.textContent = "Generating...";
  genBtn.disabled = true;

  try {
    const prompt = `Generate a comprehensive CAPS Physical Sciences study note on: ${topic}.
Use clean markdown for a study document, not chat. Use one main title, short section headings, bullet points for key ideas, and worked examples where useful. Avoid decorative symbols and avoid unnecessary heading levels.`;
    
    const response = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: prompt, history: [], response_format: "document" })
    });
    
    const data = await response.json();
    if (data && data.reply) {
      contentEl.value = data.reply;
      noteUsedAI = true;
      if (titleEl.value === "") titleEl.value = `Notes on ${topic}`;
      // Auto-switch to preview
      toggleViewEdit();
    }
  } catch (e) {
    console.error("AI Generation failed:", e);
    alert("Failed to generate note with AI.");
  } finally {
    genBtn.textContent = originalText;
    genBtn.disabled = false;
  }
}

function currentNotePayload() {
  return {
    title: document.getElementById("note-title")?.value.trim() || "",
    topic: document.getElementById("note-topic")?.value.trim() || "",
    content: document.getElementById("note-content")?.value.trim() || "",
  };
}

async function runNoteAI(action, buttonText = "Working...") {
  const buttons = Array.from(document.querySelectorAll(".note-action-btn"));
  const btn = buttons.find((item) => item.textContent.toLowerCase().includes(action === "metadata" ? "auto" : action));
  const originalText = btn?.textContent || "";
  if (btn) {
    btn.textContent = buttonText;
    btn.disabled = true;
  }
  try {
    const response = await fetch("/api/notes/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...currentNotePayload() }),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || "AI note tool failed.");
    }
    return data;
  } finally {
    if (btn) {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  }
}

async function applyAIMetadata() {
  try {
    const data = await runNoteAI("metadata", "Tagging...");
    const metadata = data.metadata || {};
    const titleEl = document.getElementById("note-title");
    const topicEl = document.getElementById("note-topic");
    if (metadata.title && titleEl) titleEl.value = metadata.title;
    if (metadata.topic && topicEl) topicEl.value = metadata.topic;
    noteUsedAI = true;
    if (Array.isArray(metadata.tags) && metadata.tags.length) {
      currentNoteTags = metadata.tags.slice(0, 6);
      const contentEl = document.getElementById("note-content");
      const existing = contentEl?.value.trim() || "";
      const tagLine = `\n\nTags: ${currentNoteTags.join(", ")}`;
      if (contentEl && !existing.toLowerCase().includes("tags:")) {
        contentEl.value = `${existing}${tagLine}`;
      }
    }
  } catch (error) {
    alert(error.message || "Could not generate metadata.");
  }
}

async function shortenNote() {
  try {
    const data = await runNoteAI("shorten", "Shortening...");
    const contentEl = document.getElementById("note-content");
    if (contentEl && data.content) {
      contentEl.value = data.content;
      noteUsedAI = true;
      showPreviewMode();
    }
  } catch (error) {
    alert(error.message || "Could not shorten note.");
  }
}

async function turnIntoFlashcards() {
  try {
    const data = await runNoteAI("flashcards", "Cards...");
    const cards = Array.isArray(data.flashcards) ? data.flashcards : [];
    if (!cards.length) return;
    const markdown = [
      "# Flashcards",
      "",
      ...cards.map((card, index) => `## Card ${index + 1}\n**Q:** ${card.question}\n\n**A:** ${card.answer}`),
    ].join("\n\n");
    const contentEl = document.getElementById("note-content");
    if (contentEl) {
      contentEl.value = markdown;
      noteUsedAI = true;
      showPreviewMode();
    }
  } catch (error) {
    alert(error.message || "Could not create flashcards.");
  }
}

async function generateQuestionPaper() {
  openExamSetupModal();
}

async function generateAdaptivePractice() {
  const buttons = Array.from(document.querySelectorAll("button"));
  const practiceBtn = buttons.find((b) => b.textContent.includes("Adaptive Practice"));
  const originalText = practiceBtn?.textContent || "";
  if (practiceBtn) {
    practiceBtn.textContent = "Generating...";
    practiceBtn.disabled = true;
  }
  try {
    const response = await fetch("/api/practice/adaptive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || "Could not generate adaptive practice.");
    }
    const focus = Array.isArray(data.focus_areas) ? data.focus_areas.join(", ") : "Revision";
    const questions = (data.questions || [])
      .map((item, index) => `${index + 1}. [${item.marks || 4} marks] ${item.question}\nSkill: ${item.skill || "practice"}`)
      .join("\n\n");
    openModal();
    setTimeout(() => {
      document.getElementById("note-title").value = "Adaptive Practice Set";
      document.getElementById("note-topic").value = focus || "Revision";
      document.getElementById("note-content").value = `# Adaptive Practice\n\nFocus areas: ${focus}\n\n${questions}`;
      noteUsedAI = true;
      showPreviewMode();
    }, 50);
  } catch (error) {
    alert(error.message || "Could not generate adaptive practice.");
  } finally {
    if (practiceBtn) {
      practiceBtn.textContent = originalText;
      practiceBtn.disabled = false;
    }
  }
}

function openAnswerCheckModal() {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay active";
  overlay.innerHTML = `
    <div class="modal-box">
      <div class="modal-header">
        <h2>Check My Working</h2>
        <button class="modal-close" type="button" data-close-check>&times;</button>
      </div>
      <form id="answer-check-form">
        <textarea id="check-question" class="form-input" placeholder="Paste the question..." required></textarea>
        <textarea id="check-working" class="form-input" placeholder="Paste your working..." required></textarea>
        <textarea id="check-rubric" class="form-input" placeholder="Optional memo or rubric..."></textarea>
        <div id="check-result" class="form-input" style="display:none; min-height:120px;"></div>
        <div class="modal-footer">
          <button type="button" class="note-action-btn" data-close-check>Cancel</button>
          <button type="submit" class="create-note-btn" style="width:auto;">Check</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay || event.target.closest("[data-close-check]")) {
      overlay.remove();
    }
  });
  overlay.querySelector("#answer-check-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = event.submitter;
    const original = submit.textContent;
    submit.textContent = "Checking...";
    submit.disabled = true;
    try {
      const response = await fetch("/api/answer/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: overlay.querySelector("#check-question").value,
          working: overlay.querySelector("#check-working").value,
          rubric: overlay.querySelector("#check-rubric").value,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Could not check working.");
      const assessment = data.assessment || {};
      const result = overlay.querySelector("#check-result");
      result.style.display = "block";
      result.innerHTML = renderMarkdown([
        "# Feedback",
        assessment.score !== null ? `Score: ${assessment.score}/${assessment.max_score || "?"}` : "",
        "## Strengths",
        ...(assessment.strengths || []).map((item) => `- ${item}`),
        "## Corrections",
        ...(assessment.corrections || []).map((item) => `- ${item}`),
        "## Next Step",
        assessment.next_step || "",
      ].filter(Boolean).join("\n"));
    } catch (error) {
      alert(error.message || "Could not check working.");
    } finally {
      submit.textContent = original;
      submit.disabled = false;
    }
  });
}

function openExamSetupModal() {
  if (!examSetupModal) {
    examSetupModal = document.createElement("div");
    examSetupModal.className = "modal-overlay exam-setup-overlay";
    examSetupModal.innerHTML = `
      <div class="modal-box exam-setup-box">
        <div class="modal-header">
          <h2>Generate Exam Paper</h2>
          <button class="modal-close" type="button" data-exam-close>&times;</button>
        </div>
        <form id="exam-setup-form" class="exam-setup-form">
          <label>
            <span>Topic</span>
            <input class="form-input" id="exam-topic" required placeholder="Projectile motion, acids and bases, stoichiometry">
          </label>
          <div class="exam-setup-grid">
            <label>
              <span>Grade</span>
              <select class="form-input" id="exam-grade">
                <option value="Grade 12">Grade 12</option>
                <option value="Grade 11">Grade 11</option>
                <option value="Grade 10">Grade 10</option>
              </select>
            </label>
            <label>
              <span>Difficulty</span>
              <select class="form-input" id="exam-difficulty">
                <option value="balanced">Balanced</option>
                <option value="foundation">Foundation</option>
                <option value="challenging">Challenging</option>
              </select>
            </label>
            <label>
              <span>Total Marks</span>
              <input class="form-input" id="exam-marks" type="number" min="20" max="150" step="10" value="50">
            </label>
            <label>
              <span>Duration</span>
              <select class="form-input" id="exam-duration">
                <option value="1 hour">1 hour</option>
                <option value="45 minutes">45 minutes</option>
                <option value="90 minutes">90 minutes</option>
                <option value="2 hours">2 hours</option>
              </select>
            </label>
          </div>
          <div class="modal-footer">
            <button type="button" class="note-action-btn" data-exam-close>Cancel</button>
            <button type="submit" class="create-note-btn" style="width:auto;">Generate Paper</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(examSetupModal);
    examSetupModal.addEventListener("click", (event) => {
      if (event.target === examSetupModal || event.target.closest("[data-exam-close]")) {
        closeExamSetupModal();
      }
    });
    examSetupModal.querySelector("#exam-setup-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      const options = {
        topic: document.getElementById("exam-topic").value.trim(),
        grade: document.getElementById("exam-grade").value,
        difficulty: document.getElementById("exam-difficulty").value,
        marks: document.getElementById("exam-marks").value,
        duration: document.getElementById("exam-duration").value,
      };
      if (options.topic) {
        closeExamSetupModal();
        await generateQuestionPaperFromOptions(options);
      }
    });
  }

  const topicInput = examSetupModal.querySelector("#exam-topic");
  const existingTopic = document.getElementById("note-topic")?.value.trim();
  if (existingTopic && !topicInput.value) topicInput.value = existingTopic;
  examSetupModal.classList.add("active");
  setTimeout(() => topicInput.focus(), 0);
}

function closeExamSetupModal() {
  if (examSetupModal) examSetupModal.classList.remove("active");
}

async function generateQuestionPaperFromOptions(options) {
  const topic = options.topic;

  const buttons = Array.from(document.querySelectorAll('button'));
  const examBtn = buttons.find(b => b.textContent.includes("Generate Exam Paper"));
  
  const originalText = examBtn ? examBtn.textContent : "";
  if (examBtn) {
    examBtn.textContent = "✨ Generating...";
    examBtn.disabled = true;
    examBtn.style.opacity = "0.7";
  }

  try {
    const promptText = `Create a polished CAPS Physical Sciences exam paper.

Topic: ${topic}
Grade: ${options.grade}
Difficulty: ${options.difficulty}
Duration: ${options.duration}
Total marks: ${options.marks}

Use this exact document structure:
# ${topic} Exam Paper
**Grade:** ${options.grade}
**Time:** ${options.duration}
**Total:** ${options.marks} marks

## Instructions
- Answer all questions.
- Show all working for calculations.
- Use correct units and scientific notation where appropriate.

## Section A: Multiple Choice
Create 5 CAPS-aligned multiple-choice questions. Give four options labelled A to D. Add marks in square brackets.

## Section B: Structured Questions
Create 3 structured questions with sub-questions. Include calculations, definitions, interpretation, and one graph/table/data question if relevant. Add marks in square brackets.

## Section C: Extended Question
Create 1 higher-order question that tests reasoning and application. Add marks in square brackets.

---

# Memorandum
Give concise answers and marking guidance for every question. For calculations, show formula, substitution, answer, and units.

Rules:
- Use markdown headings only for the exact sections above.
- Do not create a heading for every question.
- Keep the paper realistic for South African CAPS learners.
- Ensure the total roughly matches ${options.marks} marks.`;
    
    const response = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: promptText,
        history: [],
        response_format: "document",
        generation_type: "exam"
      })
    });
    
    const responseText = await response.text();
    let data = {};
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      throw new Error(responseText || "The server returned an unreadable response.");
    }

    if (!response.ok) {
      throw new Error(data.reply || data.message || `Server returned ${response.status}.`);
    }

    if (data && data.reply) {
      const generationFailed = /exam generator took too long|temporary issue while generating|not configured/i.test(data.reply);
      if (generationFailed) {
        alert(data.reply);
        return;
      }

      openModal();
      
      setTimeout(() => {
        const titleEl = document.getElementById("note-title");
        const topicEl = document.getElementById("note-topic");
        const contentEl = document.getElementById("note-content");
        
        if (titleEl) titleEl.value = `Exam Paper: ${topic}`;
        if (topicEl) topicEl.value = topic;
        if (contentEl) {
          contentEl.value = data.reply;
          noteUsedAI = true;
          showPreviewMode();
        }
      }, 50);
    }
  } catch (e) {
    console.error("AI Paper Generation failed:", e);
    alert(e.message || "AI generation failed. Please try again.");
  } finally {
    if (examBtn) {
      examBtn.textContent = originalText;
      examBtn.disabled = false;
      examBtn.style.opacity = "1";
    }
  }
}

async function downloadAsPDF() {
  if (typeof html2pdf === 'undefined') {
    alert("PDF exporter is still loading. Please try again in a moment.");
    return;
  }

  const title = document.getElementById("note-title")?.value.trim() || "Vector AI Notes";
  const topic = document.getElementById("note-topic")?.value.trim() || "CAPS Physical Sciences";
  let contentHtml = "";

  const previewEl = document.getElementById("note-preview");
  const contentEl = document.getElementById("note-content");

  // Determine what to print: preview HTML or rendered content
  if (previewEl && previewEl.style.display !== "none" && previewEl.innerHTML.trim()) {
    contentHtml = previewEl.innerHTML;
  } else if (contentEl && contentEl.value.trim()) {
    contentHtml = renderMarkdown(contentEl.value);
  }

  if (!contentHtml) {
    alert("There is no note content to export.");
    return;
  }

  // Create an off-screen container for the PDF content
  const pdfContainer = document.createElement("div");
  pdfContainer.style.padding = "20px";
  pdfContainer.style.fontFamily = "Inter, sans-serif";
  pdfContainer.style.color = "#121415"; // Dark ink
  
  // Header
  const header = document.createElement("div");
  header.style.borderBottom = "2px solid #32910a";
  header.style.paddingBottom = "10px";
  header.style.marginBottom = "20px";
  header.innerHTML = `
    <h1 style="margin:0;font-size:24px;color:#121415;">${escapeHtml(title)}</h1>
    <div style="font-size:12px;color:#666;margin-top:4px;">
      <b>Vector AI</b> &middot; ${escapeHtml(topic)} &middot; ${new Date().toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}
    </div>
  `;
  pdfContainer.appendChild(header);

  // Body content wrapper
  const bodyWrap = document.createElement("div");
  bodyWrap.className = "markdown-body";
  bodyWrap.style.fontSize = "12px";
  bodyWrap.style.lineHeight = "1.6";
  bodyWrap.innerHTML = contentHtml;
  pdfContainer.appendChild(bodyWrap);

  // Render LaTeX explicitly on the cloned container
  renderLatexInElement(bodyWrap);

  const opt = {
    margin:       [15, 15, 15, 15],
    filename:     `${safeFileName(title)}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  try {
    const examBtn = document.getElementById("generate-note-btn");
    let originalText = "";
    if (examBtn) {
      originalText = examBtn.textContent;
      examBtn.textContent = "Exporting PDF...";
      examBtn.disabled = true;
    }

    await html2pdf().set(opt).from(pdfContainer).save();

    if (examBtn) {
      examBtn.textContent = originalText;
      examBtn.disabled = false;
    }
  } catch (err) {
    console.error("PDF Export error:", err);
    alert("Failed to export PDF.");
  }
}


function loadImageData(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = url;
  });
}

function safeFileName(name) {
  return (name || "Vector-AI-Note")
    .replace(/[^a-z0-9]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80) || "Vector-AI-Note";
}

function closeModal() {
  const modal = document.getElementById("note-modal");
  if (modal) modal.classList.remove("active");
  editingNoteId = null;
}

async function saveNote() {
  const title = document.getElementById("note-title")?.value;
  const topic = document.getElementById("note-topic")?.value;
  const content = document.getElementById("note-content")?.value;
  const aiGenerated = noteUsedAI;

  if (!title || !content) {
    alert("Please fill in title and content");
    return;
  }

  const payload = { title, topic, content, tags: currentNoteTags, ai_generated: aiGenerated };
  try {
    const response = await fetch(
      editingNoteId ? `/api/notes/${editingNoteId}` : "/api/notes",
      {
        method: editingNoteId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const data = await response.json();
    if (data.success) {
      closeModal();
      loadNotes();
    }
  } catch (e) {
    console.error("Failed to save note:", e);
    alert("Failed to save note");
  }
}

async function deleteNote(noteId) {
  if (!confirm("Delete this note?")) return;
  try {
    const response = await fetch(`/api/notes/${noteId}`, { method: "DELETE" });
    const data = await response.json();
    if (data.success) loadNotes();
  } catch (e) {
    console.error("Failed to delete note:", e);
  }
}

function editNote(noteId) {
  const note = notes.find((n) => n.id === noteId);
  if (note) openModal(note, false);
}

function createFromTopic(topic) {
  openModal();
  document.getElementById("note-topic").value = topic;
  document.getElementById("note-title").value = `Notes on ${topic.charAt(0).toUpperCase() + topic.slice(1)}`;
  generateAINote();
}

function formatDate(isoStr) {
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return isoStr;
  }
}

function escapeHtml(str) {
  if (!str) return "";
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

window.Notes = { createFromTopic };
