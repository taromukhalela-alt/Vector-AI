let notes = [];
let editingNoteId = null;

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
    
    // Use marked if available, otherwise fallback
    const rawHTML = typeof marked !== "undefined" ? marked.parse(note.content || "") : simpleMarkdown(note.content);
    
    card.innerHTML = `
      <div class="note-card-title">${escapeHtml(note.title)}</div>
      <div class="note-card-meta">${formatDate(note.created_at)}</div>
      ${note.topic ? `<span class="note-card-topic">${escapeHtml(note.topic)}</span>` : ""}
      <div class="note-card-content">${rawHTML}</div>
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
    editingNoteId = viewOnly ? null : note.id;
    titleEl.value = note.title;
    topicEl.value = note.topic || "";
    contentEl.value = note.content;
    modalTitle.textContent = viewOnly ? note.title : "Edit Note";
    
    if (viewOnly) {
      contentEl.style.display = "none";
      previewContainer.style.display = "block";
      previewEl.innerHTML = typeof marked !== "undefined" ? marked.parse(note.content || "") : simpleMarkdown(note.content);
      titleEl.style.display = "none";
      topicEl.style.display = "none";
      if (footer) footer.style.display = "none";
      if (toggleBtn) { toggleBtn.classList.remove("hidden"); toggleBtn.textContent = "Edit"; }
      if (genBtn) genBtn.style.display = "none";
    } else {
      contentEl.style.display = "block";
      previewContainer.style.display = "none";
      titleEl.style.display = "block";
      topicEl.style.display = "block";
      if (footer) footer.style.display = "flex";
      if (toggleBtn) { toggleBtn.classList.remove("hidden"); toggleBtn.textContent = "Preview"; }
      if (genBtn) genBtn.style.display = "inline-block";
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

  if (contentEl.style.display === "none") {
    // Switch to edit
    contentEl.style.display = "block";
    previewContainer.style.display = "none";
    titleEl.style.display = "block";
    topicEl.style.display = "block";
    if (footer) footer.style.display = "flex";
    if (toggleBtn) toggleBtn.textContent = "Preview";
    if (genBtn) genBtn.style.display = "inline-block";
  } else {
    // Switch to preview
    contentEl.style.display = "none";
    previewContainer.style.display = "block";
    previewEl.innerHTML = typeof marked !== "undefined" ? marked.parse(contentEl.value || "") : simpleMarkdown(contentEl.value);
    if (toggleBtn) toggleBtn.textContent = "Edit";
  }
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
    const prompt = `Generate a comprehensive, structured CAPS study note on the topic: ${topic}. Use markdown formatting with clear headings, bullet points, and bold text for key terms. Keep it focused and educational.`;
    
    const response = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: prompt, history: [] })
    });
    
    const data = await response.json();
    if (data && data.reply) {
      contentEl.value = data.reply;
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
