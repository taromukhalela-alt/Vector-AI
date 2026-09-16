import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { trackEvent } from '../useAnalytics';
import { useToast } from '../context/ToastContext';
import { PageHeader, EmptyState, ErrorState, VectorLoader } from '../components/ui';
import {
  FileText,
  Search,
  Plus,
  Trash2,
  Edit3,
  Eye,
  Download,
  Sparkles,
  Save,
  ChevronLeft,
  ChevronRight,
  X,
  BookOpen,
  Clock,
  AlignLeft,
} from 'lucide-react';

// ─── Helper: format relative date ─────────────────────────────────────────────
const formatRelativeDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 2) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
};

// ─── Component ────────────────────────────────────────────────────────────────
const Notes = () => {
  const { csrfToken } = useAuth();
  const { showToast } = useToast();

  const [notes, setNotes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNote, setSelectedNote] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editTopic, setEditTopic] = useState('');
  const [editContent, setEditContent] = useState('');

  const [aiTopic, setAiTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoadingNotes, setIsLoadingNotes] = useState(true);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [wordCount, setWordCount] = useState(0);

  const textareaRef = useRef(null);

  const [isDesktop, setIsDesktop] = useState(
    () => (typeof window !== 'undefined' ? window.innerWidth >= 768 : true)
  );
  const [sidebarPinned, setSidebarPinned] = useState(() =>
    typeof window !== 'undefined'
      ? localStorage.getItem('vector_notes_sidebar_pinned') === 'true'
      : false
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const sidebarVisible = isDesktop ? sidebarPinned || sidebarOpen : sidebarOpen;

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 768;
      setIsDesktop(desktop);
      if (desktop) setSidebarOpen(false);
    };
    if (typeof window !== 'undefined') {
      handleResize();
      window.addEventListener('resize', handleResize);
    }
    return () => { if (typeof window !== 'undefined') window.removeEventListener('resize', handleResize); };
  }, []);

  // Update word count when editing
  useEffect(() => {
    if (isEditing) {
      const words = editContent.trim().split(/\s+/).filter(Boolean).length;
      setWordCount(words);
    }
  }, [editContent, isEditing]);

  const toggleSidebar = () => {
    if (isDesktop) {
      setSidebarPinned((current) => {
        const next = !current;
        localStorage.setItem('vector_notes_sidebar_pinned', String(next));
        return next;
      });
      setSidebarOpen(false);
    } else {
      setSidebarOpen((prev) => !prev);
    }
  };

  const handleSelectNote = (note) => {
    setSelectedNote(note);
    setEditTitle(note.title);
    setEditTopic(note.topic || 'General');
    setEditContent(note.content || '');
    setIsEditing(false);
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const fetchNotes = async (query = '') => {
    setIsLoadingNotes(true);
    setLoadError('');
    try {
      const res = await fetch(`/api/notes${query ? `?q=${encodeURIComponent(query)}` : ''}`);
      if (!res.ok) throw new Error(`Unable to load notes (${res.status})`);
      const data = await res.json();
      if (data.success && Array.isArray(data.notes)) {
        setNotes(data.notes);
        if (data.notes.length > 0 && !selectedNote) handleSelectNote(data.notes[0]);
      } else {
        throw new Error(data.message || 'Unable to load notes right now.');
      }
    } catch (e) {
      console.error(e);
      setLoadError(e.message || 'Unable to load notes right now.');
      showStatus(e.message || 'Unable to load notes right now.', 'error');
    } finally {
      setIsLoadingNotes(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const showStatus = (message, type = 'success', title) => {
    showToast({ type, title: title || (type === 'error' ? 'Notes issue' : 'Notes'), message });
  };

  const handleCreateNote = () => {
    const newNote = {
      id: `temp-${Date.now()}`,
      title: 'Untitled Note',
      topic: 'General',
      content: '# Untitled Note\n\nStart writing your study notes here…\n\nMath works: $E = mc^2$ and display mode:\n$$F = ma$$\n',
      isTemp: true,
    };
    setSelectedNote(newNote);
    setEditTitle(newNote.title);
    setEditTopic(newNote.topic);
    setEditContent(newNote.content);
    setIsEditing(true);
    if (typeof window !== 'undefined' && window.innerWidth < 768) setSidebarOpen(false);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const handleSaveNote = async () => {
    if (!editTitle.trim() || !editContent.trim()) {
      showStatus('Title and content are required', 'error');
      return;
    }
    setIsSavingNote(true);
    try {
      const isNew = !selectedNote || selectedNote.isTemp;
      const url = isNew ? '/api/notes' : `/api/notes/${selectedNote.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify({ title: editTitle, topic: editTopic, content: editContent, ai_generated: false }),
      });
      const data = await res.json();

      if (data.success) {
        trackEvent('note_saved', { route: '/notes', note_topic: editTopic || 'General', is_new: isNew });
        showStatus('Note saved successfully!');
        await fetchNotes();
        const savedNote = data.note || notes.find((n) => n.title === editTitle);
        if (savedNote) {
          setSelectedNote(savedNote);
          setEditTitle(savedNote.title);
          setEditTopic(savedNote.topic || 'General');
          setEditContent(savedNote.content || '');
        }
        setIsEditing(false);
      } else {
        showStatus(data.message || 'Your note could not be saved. Please try again.', 'error', 'Save failed');
      }
    } catch (e) {
      console.error(e);
      showStatus('Network error while saving', 'error');
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleDeleteNote = async (id) => {
    if (String(id).startsWith('temp-')) { setSelectedNote(null); return; }
    if (!confirm('Are you sure you want to delete this study note?')) return;
    try {
      const res = await fetch(`/api/notes/${id}`, { method: 'DELETE', headers: { 'X-CSRF-Token': csrfToken } });
      const data = await res.json();
      if (data.success) {
        showStatus('Note deleted');
        setSelectedNote(null);
        fetchNotes();
      }
    } catch (e) { console.error(e); }
  };

  const handleGenerateAINote = async () => {
    if (!aiTopic.trim()) { showStatus('Please specify a topic to generate notes', 'error'); return; }
    setIsGenerating(true);
    showStatus('Generating comprehensive study guide…', 'success');
    try {
      const res = await fetch('/api/notes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify({ topic: aiTopic }),
      });
      const data = await res.json();
      if (data.success) {
        trackEvent('ai_note_generated', { route: '/notes', topic_length: aiTopic.length });
        showStatus('Study guide generated!');
        setAiTopic('');
        fetchNotes();
        if (data.note) handleSelectNote(data.note);
      } else {
        showStatus('Could not generate the study guide. Please try again.', 'error', 'Generation failed');
      }
    } catch (e) {
      console.error(e);
      showStatus('Network error during AI generation', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSearchSubmit = (e) => { e.preventDefault(); fetchNotes(searchQuery); };

  // Generate PDFs through the authenticated backend pipeline.
  const handleDownloadPDF = useCallback(async () => {
    if (!selectedNote) return;
    setIsExporting(true);
    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify({ title: selectedNote.title || 'Study Note', content: selectedNote.content || '', theme: 'default' }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || 'PDF generation failed');
      let status = payload.status;
      let generationError = payload.document?.error || payload.error || '';
      // Bounded wait: without a deadline a stuck job polled this endpoint forever.
      const deadline = Date.now() + 60000;
      while (status !== 'completed') {
        if (status === 'failed') throw new Error(generationError || 'PDF generation failed');
        if (Date.now() > deadline) throw new Error('PDF generation is taking too long. Please try again.');
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const poll = await fetch(`/api/documents/${encodeURIComponent(payload.id)}/status`);
        const data = await poll.json();
        if (!poll.ok) throw new Error(data.error || 'Unable to check PDF status');
        status = data.status;
        generationError = data.error || generationError;
      }
      if (status !== 'completed') throw new Error('PDF generation returned an unexpected status. Please try again.');
      const download = await fetch(`/api/documents/${encodeURIComponent(payload.id)}/download`);
      if (!download.ok) {
        const failure = await download.json().catch(() => ({}));
        throw new Error(failure.error || 'Generated PDF is unavailable');
      }
      const url = URL.createObjectURL(await download.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = `${(selectedNote.title || 'study_note').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      showStatus('PDF exported successfully ✓');
      trackEvent('pdf_exported', { route: '/notes', note_title: selectedNote.title });
    } catch (error) {
      showStatus(`PDF export failed: ${error.message}`, 'error');
    } finally {
      setIsExporting(false);
    }
  }, [selectedNote, csrfToken]);

  // ─── Keyboard shortcut: Ctrl+S to save ────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's' && isEditing) {
        e.preventDefault();
        handleSaveNote();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, editTitle, editContent, editTopic]);

  // ─── Render ───────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">
      <PageHeader kicker="Create · Textbook" title="Notes" intro="A digital textbook for CAPS Physical Sciences. Select a note or generate one with AI." />
      <div className="neo-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-[3px] border-[var(--border)] bg-[var(--surface-muted)] p-4">
          <p className="section-label">Study vault · {notes.length}</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={toggleSidebar} className="neo-btn px-4 py-2 text-xs">Library</button>
            <button onClick={handleCreateNote} className="neo-btn neo-btn-primary px-4 py-2 text-xs"><Plus className="mr-2 h-4 w-4" aria-hidden="true" />New note</button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr]">
          {sidebarVisible && (
            <aside className="border-b-[3px] border-[var(--border)] bg-[var(--surface)] md:border-b-0 md:border-r-[3px]" aria-label="Notes">
              <div className="border-b-2 border-[var(--border)] p-3">
                <form onSubmit={handleSearchSubmit} className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]" aria-hidden="true" />
                  <input type="text" placeholder="Search notes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="neo-input py-2.5 pl-10 pr-3 text-sm font-semibold" aria-label="Search notes" />
                </form>
              </div>
              <div className="max-h-96 overflow-y-auto p-3 md:max-h-[560px]">
                {isLoadingNotes ? (<VectorLoader label="Loading notes" />) : loadError ? (<ErrorState title="Unable to load notes" body={loadError} onRetry={fetchNotes} />) : notes.length === 0 ? (
                  <EmptyState icon={FileText} title="No notes yet" body="Generate your first study guide." actionLabel="New note" onAction={handleCreateNote} />
                ) : (
                  <div className="flex flex-col gap-2">
                    {notes.map((note) => {
                      const isActive = selectedNote?.id === note.id;
                      return (
                        <button key={note.id} onClick={() => handleSelectNote(note)} className={`border-2 border-[var(--border)] p-3 text-left shadow-[2px_2px_0_var(--border)] ${isActive ? 'bg-[var(--emerald)] text-white' : 'bg-[var(--paper)] hover:bg-[var(--surface-muted)]'}`}>
                          <span className="flex items-center gap-2 text-sm font-extrabold"><FileText className="h-4 w-4 shrink-0" aria-hidden="true" /><span className="truncate">{note.title}</span></span>
                          <span className={`mt-2 block text-[11px] font-bold uppercase tracking-widest ${isActive ? 'text-white' : 'text-[var(--ink-muted)]'}`}>{note.topic || 'General'} · {formatRelativeDate(note.updated_at)}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="border-t-[3px] border-[var(--border)] bg-[var(--surface-muted)] p-3">
                <p className="section-label mb-2">AI study guide</p>
                <input type="text" placeholder="e.g. Newton's second law" value={aiTopic} onChange={(e) => setAiTopic(e.target.value)} className="neo-input py-2.5 px-3 text-sm font-semibold" aria-label="AI note topic" />
                <button onClick={handleGenerateAINote} disabled={isGenerating || !aiTopic.trim()} className="neo-btn neo-btn-primary mt-2 w-full px-4 py-2.5 text-xs">{isGenerating ? 'Generating...' : (<><Sparkles className="mr-2 h-4 w-4" aria-hidden="true" />Generate</>)}</button>
              </div>
            </aside>
          )}
          <div className="min-w-0">
            {selectedNote ? (<NotesReader selectedNote={selectedNote} notes={notes} isEditing={isEditing} setIsEditing={setIsEditing} editTitle={editTitle} setEditTitle={setEditTitle} editTopic={editTopic} setEditTopic={setEditTopic} editContent={editContent} textareaRef={textareaRef} wordCount={wordCount} handleSaveNote={handleSaveNote} isSavingNote={isSavingNote} handleDownloadPDF={handleDownloadPDF} isExporting={isExporting} handleDeleteNote={handleDeleteNote} />) : (
              <div className="p-4 md:p-6">
                <EmptyState icon={BookOpen} title="Select a study note" body="Review saved chapters or generate a comprehensive CAPS study guide." actionLabel="New note" onAction={handleCreateNote} />
              </div>
            )}
          </div>
        </div>
      </div>
      {sidebarVisible && !isDesktop && (<button className="no-print fixed inset-0 z-[130] bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close notes" />)}
    </div>
  );
};

// ─── Reader: digital textbook presentation ───────────────────────────────────
const NotesReader = ({ selectedNote, isEditing, setIsEditing, editTitle, setEditTitle, editTopic, setEditTopic, editContent, textareaRef, wordCount, handleSaveNote, isSavingNote, handleDownloadPDF, isExporting, handleDeleteNote }) => {
  const chapterNo = String(Math.abs((selectedNote.title || 'note').split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 24 + 1).padStart(2, '0');

  return (
    <div className="flex min-h-[480px] flex-col border-[3px] border-[var(--border)] bg-[var(--surface)] shadow-[6px_6px_0_var(--border)]">

      {/* Textbook spine header */}
      <header className="no-print flex items-stretch justify-between border-b-[3px] border-[var(--border)] bg-[var(--ink)] text-[var(--paper)]">
        <div className="flex min-w-0 items-center gap-4 px-4 py-3 md:px-6">
          <span className="hidden shrink-0 border-2 border-[var(--paper)] px-2 py-1 font-mono text-xs font-bold sm:block" aria-hidden="true">CH.{chapterNo}</span>
          {isEditing ? (
            <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row">
              <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Note title…" aria-label="Note title"
                className="min-w-0 flex-1 border-2 border-[var(--paper)] bg-transparent px-3 py-1.5 text-sm font-extrabold text-[var(--paper)] placeholder:text-[var(--ink-muted)] focus:outline-none" />
              <input type="text" value={editTopic} onChange={(e) => setEditTopic(e.target.value)} placeholder="Topic…" aria-label="Note topic"
                className="w-full border-2 border-[var(--paper)] bg-transparent px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-[var(--paper)] placeholder:text-[var(--ink-muted)] focus:outline-none sm:w-36" />
            </div>
          ) : (
            <div className="min-w-0">
              <p className="section-label" style={{ color: 'var(--ink-muted)' }}>{selectedNote.topic || 'General'}</p>
              <h2 className="truncate text-lg font-black uppercase leading-tight md:text-xl">{selectedNote.title}</h2>
            </div>
          )}
        </div>
        <div className="no-print flex shrink-0 items-stretch border-l-[3px] border-[var(--paper)]">
          <button onClick={() => setIsEditing(!isEditing)} title={isEditing ? 'Preview note' : 'Edit note'} aria-label={isEditing ? 'Preview note' : 'Edit note'}
            className="flex w-12 items-center justify-center border-l-2 border-[var(--paper)]/30 text-[var(--paper)] hover:bg-[var(--paper)]/10 md:w-14">
            {isEditing ? <Eye className="h-5 w-5" aria-hidden="true" /> : <Edit3 className="h-5 w-5" aria-hidden="true" />}
          </button>
          <button onClick={handleDownloadPDF} disabled={isExporting} title="Export as PDF" aria-label="Export as PDF"
            className="flex w-12 items-center justify-center border-l-2 border-[var(--paper)]/30 text-[var(--paper)] hover:bg-[var(--paper)]/10 disabled:opacity-50 md:w-14">
            {isExporting ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--paper)]/40 border-t-[var(--paper)]" aria-hidden="true" /> : <Download className="h-5 w-5" aria-hidden="true" />}
          </button>
          <button onClick={() => handleDeleteNote(selectedNote.id)} title="Delete note" aria-label="Delete note"
            className="flex w-12 items-center justify-center border-l-2 border-[var(--paper)]/30 text-[var(--paper)] hover:bg-[var(--danger)] md:w-14">
            <Trash2 className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {isEditing ? (
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between gap-3 border-b-2 border-[var(--border)] bg-[var(--surface-muted)] px-4 py-1.5">
              <span className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-[var(--ink-muted)]">
                <AlignLeft className="h-3 w-3" aria-hidden="true" /> {wordCount} words
              </span>
              <span className="hidden font-mono text-[11px] font-bold text-[var(--ink-muted)] sm:inline">Markdown · $E=mc^2$ · Ctrl+S saves</span>
              <button onClick={handleSaveNote} disabled={isSavingNote} className="neo-btn neo-btn-primary px-3 py-1 text-[11px]">
                {isSavingNote ? 'Saving…' : (<><Save className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />Save</>)}
              </button>
            </div>
            <textarea ref={textareaRef} value={editContent} onChange={(e) => setEditContent(e.target.value)} spellCheck={false}
              placeholder={'Write your study notes in Markdown…\n\nMath: $E = mc^2$ or display: $$F = ma$$\nHeaders: # Title, ## Section'}
              aria-label="Note content"
              className="min-h-[420px] flex-1 resize-none border-0 bg-[var(--surface)] p-4 font-mono text-sm leading-relaxed text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none sm:p-6" />
          </div>
        ) : (
          <article className="px-4 py-6 sm:px-8 sm:py-8 md:px-12">
            <div id="print-note-root" className="mx-auto max-w-3xl">
              {selectedNote.updated_at && (
                <p className="mb-6 flex items-center gap-2 border-b-2 border-[var(--border)] pb-3 font-mono text-[11px] font-bold uppercase tracking-widest text-[var(--ink-muted)]">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" /> Updated {formatRelativeDate(selectedNote.updated_at)}
                </p>
              )}
              <MarkdownRenderer content={selectedNote.content || ''} />
              <div className="mt-10 border-t-[3px] border-[var(--border)] pt-3">
                <p className="section-label">End of chapter · Vector AI Notes</p>
              </div>
            </div>
          </article>
        )}
      </div>
    </div>
  );
};

export default Notes;


