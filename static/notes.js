let notes = [];
let editingNoteId = null;
let examSetupModal = null;

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
  return simpleMarkdown(text || "");
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
      const q = e.target.value.toLowerCase();
      const filtered = notes.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          (n.topic && n.topic.toLowerCase().includes(q))
      );
      renderNotes(filtered);
    });
  }

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });
  }
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
    titleEl.value = note.title;
    topicEl.value = note.topic || "";
    contentEl.value = note.content;
    modalTitle.textContent = viewOnly ? note.title : "Edit Note";
    
    if (viewOnly) {
      contentEl.style.display = "none";
      previewContainer.style.display = "block";
      previewEl.innerHTML = renderMarkdown(note.content);
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

async function generateQuestionPaper() {
  openExamSetupModal();
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
      body: JSON.stringify({ message: promptText, history: [], response_format: "document" })
    });
    
    const data = await response.json();
    if (data && data.reply) {
      openModal();
      
      setTimeout(() => {
        const titleEl = document.getElementById("note-title");
        const topicEl = document.getElementById("note-topic");
        const contentEl = document.getElementById("note-content");
        
        if (titleEl) titleEl.value = `Exam Paper: ${topic}`;
        if (topicEl) topicEl.value = topic;
        if (contentEl) {
          contentEl.value = data.reply;
          showPreviewMode();
        }
      }, 50);
    }
  } catch (e) {
    console.error("AI Paper Generation failed:", e);
    alert("AI Generation failed. Please check your connection and try again.");
  } finally {
    if (examBtn) {
      examBtn.textContent = originalText;
      examBtn.disabled = false;
      examBtn.style.opacity = "1";
    }
  }
}

async function downloadAsPDF() {
  if (!window.jspdf?.jsPDF) {
    alert("PDF tools are still loading. Please try again in a moment.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const title = document.getElementById("note-title")?.value.trim() || "Vector AI Notes";
  const topic = document.getElementById("note-topic")?.value.trim() || "CAPS Physical Sciences";
  const content = document.getElementById("note-content")?.value.trim() || document.getElementById("note-preview")?.innerText || "";
  if (!content) {
    alert("There is no note content to export.");
    return;
  }

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  const contentWidth = pageWidth - margin * 2;
  const colors = {
    ink: [30, 32, 33],
    muted: [102, 92, 84],
    accent: [184, 187, 38],
    aqua: [142, 192, 124],
    panel: [248, 248, 240],
    rule: [222, 220, 205],
  };
  let y = margin;

  const logo = await loadImageData("/static/icons/pwa-192.png").catch(() => null);

  function setColor(rgb) {
    doc.setTextColor(rgb[0], rgb[1], rgb[2]);
  }

  function drawHeader() {
    if (logo) doc.addImage(logo, "PNG", margin, 28, 30, 30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    setColor(colors.ink);
    doc.text("VECTOR AI", logo ? margin + 40 : margin, 42);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    setColor(colors.muted);
    doc.text("CAPS Physical Sciences", logo ? margin + 40 : margin, 55);
    doc.setDrawColor(...colors.rule);
    doc.line(margin, 70, pageWidth - margin, 70);
  }

  function drawFooter(pageNumber, pageCount) {
    doc.setDrawColor(...colors.rule);
    doc.line(margin, pageHeight - 42, pageWidth - margin, pageHeight - 42);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    setColor(colors.muted);
    doc.text(topic, margin, pageHeight - 26);
    doc.text(`Page ${pageNumber} of ${pageCount}`, pageWidth - margin, pageHeight - 26, { align: "right" });
  }

  function addPage() {
    doc.addPage();
    y = 92;
    drawHeader();
  }

  function ensureSpace(height) {
    if (y + height > pageHeight - 64) addPage();
  }

  function cleanInline(text) {
    return (text || "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\s+/g, " ")
      .trim();
  }

  function writeWrapped(text, options = {}) {
    const fontSize = options.fontSize || 10.5;
    const lineHeight = options.lineHeight || fontSize * 1.45;
    const x = options.x || margin;
    const width = options.width || contentWidth;
    const fontStyle = options.fontStyle || "normal";
    const color = options.color || colors.ink;
    const indent = options.indent || 0;
    const bullet = options.bullet || "";
    const lines = doc.splitTextToSize(cleanInline(text), width - indent - (bullet ? 14 : 0));
    ensureSpace(lines.length * lineHeight + 4);
    doc.setFont("helvetica", fontStyle);
    doc.setFontSize(fontSize);
    setColor(color);
    lines.forEach((line, index) => {
      const lineX = x + indent + (bullet ? 14 : 0);
      if (bullet && index === 0) doc.text(bullet, x + indent, y);
      doc.text(line, lineX, y);
      y += lineHeight;
    });
    y += options.after || 2;
  }

  function writeHeading(text, level) {
    const size = level === 1 ? 17 : level === 2 ? 13 : 11.5;
    const height = level === 1 ? 34 : 26;
    ensureSpace(height);
    y += level === 1 ? 12 : 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(size);
    setColor(level === 1 ? colors.ink : colors.aqua);
    doc.text(cleanInline(text), margin, y);
    y += level === 1 ? 10 : 7;
    if (level <= 2) {
      doc.setDrawColor(...(level === 1 ? colors.accent : colors.rule));
      doc.line(margin, y, pageWidth - margin, y);
    }
    y += level === 1 ? 18 : 14;
  }

  function writeRule() {
    ensureSpace(24);
    doc.setDrawColor(...colors.rule);
    doc.line(margin, y + 8, pageWidth - margin, y + 8);
    y += 24;
  }

  doc.setFillColor(...colors.panel);
  doc.roundedRect(margin, margin, contentWidth, 116, 12, 12, "F");
  if (logo) doc.addImage(logo, "PNG", margin + 18, margin + 20, 54, 54);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(23);
  setColor(colors.ink);
  doc.text(cleanInline(title), margin + (logo ? 88 : 22), margin + 44, { maxWidth: contentWidth - (logo ? 110 : 44) });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  setColor(colors.muted);
  doc.text(topic, margin + (logo ? 88 : 22), margin + 70);
  doc.text(new Date().toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" }), margin + (logo ? 88 : 22), margin + 88);
  y = margin + 152;

  const lines = content.split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      y += 8;
      continue;
    }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (/^-{3,}$/.test(line)) {
      writeRule();
    } else if (heading) {
      const headingText = heading[2];
      if (/^memorandum\b/i.test(headingText) && y > margin + 180) addPage();
      writeHeading(headingText, heading[1].length);
    } else if (/^[-*]\s+/.test(line)) {
      writeWrapped(line.replace(/^[-*]\s+/, ""), { bullet: "-", indent: 12, color: colors.ink });
    } else if (/^\d+[\).\s]/.test(line)) {
      writeWrapped(line, { indent: 8, color: colors.ink });
    } else {
      writeWrapped(line, { color: colors.ink });
    }
  }

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i += 1) {
    doc.setPage(i);
    drawFooter(i, pageCount);
  }

  doc.save(`${safeFileName(title)}.pdf`);
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
  const aiGenerated = true; // Assume AI generated since we have the button now

  if (!title || !content) {
    alert("Please fill in title and content");
    return;
  }

  const payload = { title, topic, content, ai_generated: aiGenerated };
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
