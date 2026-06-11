import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { trackEvent } from '../useAnalytics';
import { useToast } from '../context/ToastContext';
import {
  FileText,
  Search,
  Plus,
  Trash2,
  Edit,
  Eye,
  Download,
  Sparkles,
  Save,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import html2canvas from 'html2canvas';
import { pdf } from '@react-pdf/renderer';
import NotesPdfDocument from '../components/NotesPdfDocument';

// ── Math pre-rendering helpers ───────────────────────────────────────────────

/**
 * Replaces all math expressions in `content` with unique tokens (__MATH_N__)
 * so marked.js never processes them. Returns the tokenized string and a map
 * of { token → { latex, display } }.
 */
const preprocessContent = (content) => {
  const mathMap = {};
  const codeStore = [];
  let idx = 0;

  // Step 1: protect code blocks / inline code
  let md = String(content || '').replace(
    /(```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]*`)/g,
    (m) => {
      const id = `__CODE_${codeStore.length}__`;
      codeStore.push(m);
      return id;
    },
  );

  // Step 2: tokenize math (display first to avoid $$ vs $ ambiguity)
  const tok = (latex, display) => {
    const key = `__MATH_${idx++}__`;
    mathMap[key] = { latex, display };
    return key;
  };

  md = md
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, m) => tok(m, true))
    .replace(/(?<!\\)\$\$([\s\S]*?)(?<!\\)\$\$/g, (_, m) => tok(m, true))
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, m) => tok(m, false))
    .replace(/(?<!\\)\$([^\n$]+?)(?<!\\)\$/g, (_, m) => tok(m, false));
  // Step 3: restore code blocks
  md = md.replace(/__CODE_(\d+)__/g, (_, i) => codeStore[+i]);

  return { processed: md, mathMap };
};

/**
 * Renders a single LaTeX expression into a PNG data-URL using KaTeX + html2canvas.
 * Returns { dataUrl, width, height } or null on failure.
 */
const renderMathToPng = async (latex, displayMode) => {
  const wrap = document.createElement('div');
  Object.assign(wrap.style, {
    position: 'fixed',
    top: '0px',
    left: '-9999px',
    display: 'inline-block',
    backgroundColor: displayMode ? '#f7fef9' : '#ffffff',
    padding: displayMode ? '12px 20px' : '3px 6px',
    fontSize: '16px',
    lineHeight: '1.4',
    zIndex: '-9999',
    visibility: 'hidden',
  });
  document.body.appendChild(wrap);

  try {
    katex.render(String(latex || '').trim(), wrap, {
      displayMode,
      throwOnError: false,
      strict: false,
      output: 'html',
    });

    // Brief settle for font paint
    await new Promise((r) => setTimeout(r, 100));

    const canvas = await html2canvas(wrap, {
      scale: 3,
      backgroundColor: displayMode ? '#f7fef9' : '#ffffff',
      useCORS: true,
      logging: false,
    });

    return {
      dataUrl: canvas.toDataURL('image/png'),
      width: canvas.width / 3,
      height: canvas.height / 3,
    };
  } catch (err) {
    console.warn('[Vector AI] Math render failed:', latex, err);
    return null;
  } finally {
    document.body.removeChild(wrap);
  }
};

/**
 * Pre-renders every math expression in mathMap to a PNG.
 * Returns { [token]: { dataUrl, width, height, display, latex } }.
 */
const prerenderMathImages = async (mathMap) => {
  const images = {};
  const entries = Object.entries(mathMap);
  if (!entries.length) return images;

  // Prime KaTeX fonts before bulk rendering
  await document.fonts.ready;
  const katexFamilies = [
    'KaTeX_Main', 'KaTeX_Math', 'KaTeX_AMS',
    'KaTeX_Size1', 'KaTeX_Size2', 'KaTeX_Size3', 'KaTeX_Size4',
  ];
  await Promise.allSettled(
    katexFamilies.flatMap((f) =>
      ['12px', '16px', '24px'].map((s) => document.fonts.load(`${s} ${f}`)),
    ),
  );
  await new Promise((r) => setTimeout(r, 200));

  // Render all expressions (sequentially to avoid DOM thrashing)
  for (const [key, { latex, display }] of entries) {
    const result = await renderMathToPng(latex, display);
    if (result) images[key] = { ...result, display, latex };
  }

  return images;
};


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

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, []);

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
    try {
      const res = await fetch(`/api/notes${query ? `?q=${encodeURIComponent(query)}` : ''}`);

      if (!res.ok) {
        console.error('Fetch notes failed:', res.status, res.statusText);
        return;
      }

      const data = await res.json();

      if (data.success && Array.isArray(data.notes)) {
        setNotes(data.notes);

        if (data.notes.length > 0 && !selectedNote) {
          handleSelectNote(data.notes[0]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showStatus = (message, type = 'success', title) => {
    showToast({
      type,
      title: title || (type === 'error' ? 'Notes issue' : 'Notes'),
      message,
    });
  };

  const handleCreateNote = () => {
    const newNote = {
      id: `temp-${Date.now()}`,
      title: 'New Study Note',
      topic: 'General',
      content:
        '# New Study Note\n\nStart writing notes in markdown. Math equations work here: $$E=mc^2$$',
      isTemp: true,
    };

    setSelectedNote(newNote);
    setEditTitle(newNote.title);
    setEditTopic(newNote.topic);
    setEditContent(newNote.content);
    setIsEditing(true);
  };

  const handleSaveNote = async () => {
    if (!editTitle.trim() || !editContent.trim()) {
      showStatus('Title and content are required', 'error');
      return;
    }

    try {
      const isNew = !selectedNote || selectedNote.isTemp;
      const url = isNew ? '/api/notes' : `/api/notes/${selectedNote.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({
          title: editTitle,
          topic: editTopic,
          content: editContent,
          ai_generated: false,
        }),
      });

      const data = await res.json();

      if (data.success) {
        trackEvent('note_saved', {
          route: '/notes',
          note_topic: editTopic || 'General',
          is_new: isNew,
        });

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
        console.warn('Note save failed:', data.message);
        showStatus('Your note could not be saved. Please try again.', 'error', 'Save failed');
      }
    } catch (e) {
      console.error(e);
      showStatus('Network error while saving', 'error');
    }
  };

  const handleDeleteNote = async (id) => {
    if (String(id).startsWith('temp-')) {
      setSelectedNote(null);
      return;
    }

    if (!confirm('Are you sure you want to delete this study note?')) return;

    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: 'DELETE',
        headers: { 'X-CSRF-Token': csrfToken },
      });

      const data = await res.json();

      if (data.success) {
        showStatus('Note deleted successfully');
        setSelectedNote(null);
        fetchNotes();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerateAINote = async () => {
    if (!aiTopic.trim()) {
      showStatus('Please specify a CAPS topic to generate notes', 'error');
      return;
    }

    setIsGenerating(true);
    showStatus('Generating comprehensive study guide…', 'success');

    try {
      const res = await fetch('/api/notes/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ topic: aiTopic }),
      });

      const data = await res.json();

      if (data.success) {
        trackEvent('ai_note_generated', {
          route: '/notes',
          topic_length: aiTopic.length,
        });

        showStatus('Study guide generated successfully!');
        setAiTopic('');
        fetchNotes();

        if (data.note) handleSelectNote(data.note);
      } else {
        console.warn('AI note generation failed:', data.message);
        showStatus(
          'The study guide could not be generated. Please try again.',
          'error',
          'Generation failed'
        );
      }
    } catch (e) {
      console.error(e);
      showStatus('Network error during AI generation', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchNotes(searchQuery);
  };

  const handleDownloadPDF = useCallback(async () => {
    if (!selectedNote) return;

    setIsExporting(true);

    const safeFilename = (selectedNote.title || 'study_note')
      .replace(/[^a-zA-Z0-9_\- ]/g, '')
      .trim()
      .replace(/\s+/g, '_') || 'study_note';

    try {
      // 1. Tokenize math expressions in the note content
      const { processed: tokenizedContent, mathMap } = preprocessContent(
        selectedNote.content || '',
      );

      // 2. Pre-render all math to PNG images (KaTeX → html2canvas)
      const mathImages = await prerenderMathImages(mathMap);

      // 3. Build the React PDF document
      const doc = (
        <NotesPdfDocument
          note={{ ...selectedNote, content: tokenizedContent }}
          mathImages={mathImages}
        />
      );

      // 4. Generate PDF blob via @react-pdf/renderer
      const blob = await pdf(doc).toBlob();

      // 5. Trigger browser download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${safeFilename}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1500);

      showStatus('PDF exported successfully ✓');

      trackEvent('pdf_exported', {
        route: '/notes',
        note_title: selectedNote.title,
        topic: selectedNote.topic || 'General',
      });
    } catch (error) {
      console.error('PDF export failed:', error);
      showStatus('Failed to generate PDF. Please try again.', 'error');
    } finally {
      setIsExporting(false);
    }
  }, [selectedNote]);

  return (
    <div className="relative flex h-full min-h-0 overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      {sidebarVisible && !isDesktop && (
        <div
          className="no-print fixed inset-0 z-130 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`no-print shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 flex flex-col transition-all duration-300 ${sidebarVisible
            ? 'fixed inset-y-0 left-0 z-140 w-72 shadow-2xl md:static md:z-auto md:w-64 md:shadow-none'
            : 'hidden'
          }`}
      >
        <div className="space-y-3 border-b border-zinc-200 p-3 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Study Notes
            </span>
            <button
              onClick={() => {
                setSidebarPinned(false);
                localStorage.setItem('vector_notes_sidebar_pinned', 'false');
                setSidebarOpen(false);
              }}
              className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-200 dark:hover:bg-zinc-800"
              title="Close notes panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search study guides..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-200/50 dark:bg-zinc-800/80 border border-zinc-300 dark:border-zinc-700/50 rounded-lg py-1.5 pl-8 pr-3 text-xs text-zinc-700 dark:text-zinc-200 focus:outline-none"
            />
          </form>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              Vault Notes
            </span>
            <button
              onClick={handleCreateNote}
              className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded text-emerald-500 cursor-pointer"
              title="Create Study Note"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {notes.length === 0 ? (
            <p className="text-[10px] text-zinc-400 text-center py-6">No study guides</p>
          ) : (
            notes.map((note) => (
              <button
                key={note.id}
                onClick={() => handleSelectNote(note)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold truncate flex items-center justify-between cursor-pointer transition-colors ${selectedNote?.id === note.id
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800/50'
                  }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{note.title}</span>
                </div>
                {note.ai_generated && (
                  <Sparkles className="w-3 h-3 text-emerald-400 shrink-0 ml-1" />
                )}
              </button>
            ))
          )}
        </div>

        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-900/50 space-y-2">
          <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">
            AI Guide Generator
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="e.g. Newton's Laws"
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              className="w-full bg-zinc-200 dark:bg-zinc-800/80 border border-zinc-300 dark:border-zinc-700/50 rounded-lg py-1.5 px-2.5 text-xs text-zinc-700 dark:text-zinc-200 focus:outline-none"
            />
          </div>

          <button
            onClick={handleGenerateAINote}
            disabled={isGenerating}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-300 dark:disabled:bg-zinc-800 disabled:text-zinc-500 text-zinc-950 font-bold rounded-lg py-2 text-[10px] tracking-widest uppercase flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            <Sparkles className="w-3 h-3 fill-current animate-pulse" />
            Generate
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col bg-zinc-50 dark:bg-zinc-950 min-w-0">
        {selectedNote ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="no-print flex shrink-0 items-center justify-between gap-3 border-b border-zinc-200 p-3 dark:border-zinc-800 sm:p-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <button
                  onClick={toggleSidebar}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-600 transition hover:bg-zinc-200/70 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
                  title={sidebarVisible ? 'Hide notes' : 'Show notes'}
                >
                  {sidebarVisible ? (
                    <ChevronLeft className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                  Notes
                </button>

                {isEditing ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Note Title"
                      className="bg-zinc-200 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg py-1.5 px-3 text-xs sm:text-sm font-bold focus:outline-none text-zinc-800 dark:text-zinc-100"
                    />
                    <input
                      type="text"
                      value={editTopic}
                      onChange={(e) => setEditTopic(e.target.value)}
                      placeholder="Topic (e.g. Physics)"
                      className="bg-zinc-200 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg py-1.5 px-3 text-xs font-semibold focus:outline-none w-28 text-zinc-800 dark:text-zinc-100"
                    />
                  </div>
                ) : (
                  <div>
                    <h2 className="truncate font-extrabold text-sm uppercase tracking-wider text-zinc-800 dark:text-zinc-100 sm:text-base">
                      {selectedNote.title}
                    </h2>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                      {selectedNote.topic || 'General'}
                    </span>
                  </div>
                )}
              </div>

              <div className="no-print flex shrink-0 items-center gap-2 overflow-x-auto">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="p-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {isEditing ? (
                    <>
                      <Eye className="w-3.5 h-3.5" /> Preview
                    </>
                  ) : (
                    <>
                      <Edit className="w-3.5 h-3.5" /> Edit
                    </>
                  )}
                </button>

                {isEditing && (
                  <button
                    onClick={handleSaveNote}
                    className="p-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" /> Save
                  </button>
                )}

                <button
                  onClick={handleDownloadPDF}
                  disabled={isExporting}
                  className="p-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors text-zinc-900 dark:text-zinc-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-3.5 h-3.5" />
                  {isExporting ? 'Exporting...' : 'PDF'}
                </button>

                <button
                  onClick={() => handleDeleteNote(selectedNote.id)}
                  className="p-2 border border-zinc-200 dark:border-zinc-800 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {isEditing ? (
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full h-full bg-transparent border-0 resize-none focus:outline-none text-sm leading-relaxed font-mono text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-600"
                  placeholder="Write your study notes content in markdown..."
                />
              ) : (
                <div id="print-note-root" className="mx-auto max-w-3xl prose max-w-none p-6">
                  <MarkdownRenderer content={selectedNote.content || ''} />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto px-4">
            <button
              onClick={toggleSidebar}
              className="mb-4 inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-600 transition hover:bg-zinc-200/70 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              {sidebarVisible ? (
                <ChevronLeft className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
              Notes
            </button>

            <FileText className="w-10 h-10 text-zinc-400 mb-4" />
            <h3 className="font-extrabold text-sm uppercase tracking-wider">Select a Study Note</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Review saved summaries, draft practice guides, or prompt the AI helper to generate
              comprehensive study notes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notes;
