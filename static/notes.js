let notes = [];
let editingNoteId = null;

document.addEventListener("DOMContentLoaded", () => {
  loadNotes();
  setupEventListeners();
  setupAIGeneration();
});

function loadNotes() {
  fetch("/api/notes")
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        notes = data.notes;
        renderNotes();
      }
    })
    .catch((error) => console.error("Failed to load notes:", error));
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
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:0.5rem;">
        <h3>${escapeHtml(note.title)}</h3>
        <div style="display:flex;gap:0.25rem;">
          <button class="btn-icon" onclick="editNote('${note.id}')" title="Edit">E</button>
          <button class="btn-icon" onclick="deleteNote('${note.id}')" title="Delete">X</button>
        </div>
      </div>
      <div class="note-meta">${formatDate(note.created_at)}${note.topic ? ` | ${escapeHtml(note.topic)}` : ""}</div>
      ${
        note.tags && note.tags.length
          ? `<div style="margin-bottom:0.5rem;">${note.tags
              .map((tag) => `<span class="note-tag">${escapeHtml(tag)}</span>`)
              .join("")}</div>`
          : ""
      }
      <div class="note-content">${escapeHtml(note.content)}</div>
    `;
    grid.appendChild(card);
  });
}

function setupEventListeners() {
  const modal = document.getElementById("note-modal");
  const form = document.getElementById("note-form");
  const createBtn = document.getElementById("create-note-btn");
  const searchInput = document.getElementById("note-search");

  if (createBtn) {
    createBtn.addEventListener("click", () => openModal());
  }

  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      await saveNote();
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", (event) => {
      const query = event.target.value.toLowerCase();
      const filtered = notes.filter(
        (note) =>
          note.title.toLowerCase().includes(query) ||
          note.content.toLowerCase().includes(query) ||
          (note.topic && note.topic.toLowerCase().includes(query))
      );
      renderNotes(filtered);
    });
  }

  if (modal) {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeModal();
    });
  }
}

function openModal(note = null) {
  const modal = document.getElementById("note-modal");
  const titleEl = document.getElementById("note-title");
  const topicEl = document.getElementById("note-topic");
  const contentEl = document.getElementById("note-content");
  const modalTitle = document.getElementById("modal-title");

  if (!modal || !titleEl || !topicEl || !contentEl || !modalTitle) return;

  if (note) {
    editingNoteId = note.id;
    titleEl.value = note.title;
    topicEl.value = note.topic || "";
    contentEl.value = note.content;
    modalTitle.textContent = "Edit Note";
  } else {
    editingNoteId = null;
    titleEl.value = "";
    topicEl.value = "";
    contentEl.value = "";
    modalTitle.textContent = "Create New Note";
  }

  modal.classList.add("active");
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
  const aiGenerated = document.getElementById("ai-generated")?.checked;

  if (!title || !content) {
    alert("Please fill in title and content");
    return;
  }

  const payload = { title, topic, content, ai_generated: aiGenerated };

  try {
    const response = await fetch(editingNoteId ? `/api/notes/${editingNoteId}` : "/api/notes", {
      method: editingNoteId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (data.success) {
      closeModal();
      loadNotes();
    }
  } catch (error) {
    console.error("Failed to save note:", error);
    alert("Failed to save note");
  }
}

async function deleteNote(noteId) {
  if (!confirm("Delete this note?")) return;

  try {
    const response = await fetch(`/api/notes/${noteId}`, { method: "DELETE" });
    const data = await response.json();
    if (data.success) {
      loadNotes();
    }
  } catch (error) {
    console.error("Failed to delete note:", error);
  }
}

function editNote(noteId) {
  const note = notes.find((item) => item.id === noteId);
  if (note) openModal(note);
}

function createFromTopic(topic) {
  openModal();
  document.getElementById("note-topic").value = topic;
  document.getElementById("note-title").value = `Notes on ${topic}`;
  document.getElementById("ai-generated").checked = true;
}

function setupAIGeneration() {
  window.addEventListener("ai-suggest-note", (event) => {
    const { title, content, topic } = event.detail;
    openModal({
      id: null,
      title: title || "New Note",
      topic: topic || "",
      content: content || "",
    });
  });
}

async function generateNoteWithAI(topic) {
  try {
    const response = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `Create comprehensive study notes for CAPS physics or chemistry topic: ${topic}. Include key definitions, formulas, and worked examples.`,
        history: [],
      }),
    });
    const data = await response.json();
    return data.reply;
  } catch (error) {
    console.error("AI generation failed:", error);
    return null;
  }
}

function formatDate(isoStr) {
  const date = new Date(isoStr);
  return date.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function escapeHtml(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

window.Notes = {
  generate: generateNoteWithAI,
  createFromTopic,
};
