import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { trackEvent } from '../useAnalytics';
import { useToast } from '../context/ToastContext';
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
import katex from 'katex';
import 'katex/dist/katex.min.css';
import html2canvas from 'html2canvas';
import html2pdf from 'html2pdf.js';
import { pdf } from '@react-pdf/renderer';
import NotesPdfDocument from '../components/NotesPdfDocument';

// ─── Math pre-processing pipeline (for PDF export) ────────────────────────────
const preprocessContent = (content) => {
  const mathMap = {};
  const codeStore = [];
  let idx = 0;

  let md = String(content || '').replace(
    /(```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]*`)/g,
    (m) => {
      const id = `__CODE_${codeStore.length}__`;
      codeStore.push(m);
      return id;
    },
  );

  const tok = (latex, display) => {
    const key = `@@MATH_${idx++}@@`;
    mathMap[key] = { latex, display };
    return key;
  };

  md = md
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, m) => tok(m, true))
    .replace(/(?<!\\)\$\$([\s\S]*?)(?<!\\)\$\$/g, (_, m) => tok(m, true))
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, m) => tok(m, false))
    .replace(/(?<!\\)\$([^\n$]+?)(?<!\\)\$/g, (_, m) => tok(m, false));

  md = md.replace(/__CODE_(\d+)__/g, (_, i) => codeStore[+i]);

  return { processed: md, mathMap };
};

const UNSUPPORTED_COLOR_FUNCTION_RE = /\b(?:oklch|lch|lab|color)\(/i;

const fallbackCssValue = (propName, displayMode) => {
  const prop = String(propName || '').toLowerCase();
  if (prop === 'color' || prop.endsWith('color') || prop === 'fill' || prop === 'stroke') return '#1e293b';
  if (prop.startsWith('background')) return displayMode ? '#f7fef9' : 'transparent';
  if (prop.includes('shadow')) return 'none';
  return '';
};

const sanitizeCssValue = (propName, value, displayMode) => {
  if (!value) return value;
  return UNSUPPORTED_COLOR_FUNCTION_RE.test(value) ? fallbackCssValue(propName, displayMode) : value;
};

const snapshotInlineStyles = (root, displayMode) => {
  if (!root || typeof window === 'undefined') return;
  const applySafeStyles = (el) => {
    if (!(el instanceof Element)) return;
    try {
      el.style.setProperty('color', '#1e293b');
      el.style.setProperty('background-color', 'transparent');
      el.style.setProperty('border-color', '#94a3b8');
      el.style.setProperty('text-shadow', 'none');
      el.style.setProperty('box-shadow', 'none');
    } catch { }
    Array.from(el.children).forEach((child) => applySafeStyles(child));
  };
  applySafeStyles(root);
};

const renderMathToPng = async (latex, displayMode) => {
  if (typeof document === 'undefined') return null;

  const backgroundColor = displayMode ? '#f7fef9' : '#ffffff';
  const foregroundColor = '#1e293b';

  const wrap = document.createElement('div');
  wrap.setAttribute('data-math-isolated', 'true');
  wrap.setAttribute('aria-hidden', 'true');

  Object.assign(wrap.style, {
    position: 'fixed',
    top: '0px',
    left: '-10000px',
    display: 'inline-block',
    width: 'auto',
    height: 'auto',
    backgroundColor,
    color: foregroundColor,
    padding: displayMode ? '12px 20px' : '3px 6px',
    fontSize: '16px',
    lineHeight: '1.4',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    zIndex: '-9999',
    opacity: '0',
    pointerEvents: 'none',
    margin: '0',
    border: 'none',
    boxSizing: 'border-box',
    contain: 'layout style paint',
  });

  const container = document.createElement('div');
  container.setAttribute('data-math-container', 'true');
  Object.assign(container.style, {
    display: 'inline-block',
    color: foregroundColor,
    backgroundColor: 'transparent',
  });
  wrap.appendChild(container);

  const styleReset = document.createElement('style');
  styleReset.setAttribute('data-math-reset', 'true');
  styleReset.textContent = `
    [data-math-isolated], [data-math-isolated] * {
      box-sizing: border-box !important;
      color: ${foregroundColor} !important;
      border-color: #94a3b8 !important;
      caret-color: ${foregroundColor} !important;
      text-shadow: none !important;
      box-shadow: none !important;
    }
    [data-math-isolated] { background: ${backgroundColor} !important; isolation: isolate !important; }
    [data-math-isolated] .katex, [data-math-isolated] .katex * {
      color: ${foregroundColor} !important;
      background: transparent !important;
    }
    [data-math-isolated] .katex-mathml { display: none !important; }
  `;
  wrap.appendChild(styleReset);
  document.body.appendChild(wrap);

  try {
    katex.render(String(latex || '').trim(), container, {
      displayMode,
      throwOnError: false,
      strict: false,
      output: 'html',
      trust: false,
    });

    if (document.fonts?.ready) await document.fonts.ready;
    await new Promise((r) => setTimeout(r, 120));
    snapshotInlineStyles(wrap, displayMode);

    const canvas = await html2canvas(wrap, {
      scale: 3,
      backgroundColor,
      useCORS: true,
      logging: false,
      allowTaint: false,
      removeContainer: true,
      foreignObjectRendering: false,
      onclone: (clonedDoc) => {
        // 1. Remove stylesheets EXCEPT KaTeX
        clonedDoc.querySelectorAll('link[rel="stylesheet"]').forEach((n) => {
          if (!n.href || !n.href.includes('katex')) {
            n.remove();
          }
        });

        // 2. Remove style tags EXCEPT our math-reset and any injected KaTeX styles
        clonedDoc.querySelectorAll('style:not([data-math-reset])').forEach((n) => {
          if (!n.textContent || !n.textContent.includes('.katex')) {
            n.remove();
          }
        });

        const clonedWrap = clonedDoc.querySelector('[data-math-isolated="true"]');
        if (!clonedWrap) return;

        clonedDoc.documentElement.style.backgroundColor = 'transparent';
        clonedDoc.body.style.backgroundColor = 'transparent';
        clonedDoc.body.style.margin = '0';
        clonedWrap.style.opacity = '1';
        clonedWrap.style.visibility = 'visible';
        clonedWrap.style.left = '0px';
        clonedWrap.style.top = '0px';
        clonedWrap.style.pointerEvents = 'none';
        clonedWrap.style.backgroundColor = backgroundColor;
        clonedWrap.style.color = foregroundColor;

        const nodes = [clonedWrap, ...clonedWrap.querySelectorAll('*')];
        nodes.forEach((el) => {
          Array.from(el.style).forEach((prop) => {
            const value = el.style.getPropertyValue(prop);
            const safeValue = sanitizeCssValue(prop, value, displayMode);
            if (safeValue || safeValue === '0') el.style.setProperty(prop, safeValue);
            else el.style.removeProperty(prop);
          });
        });
      },
    });

    return { dataUrl: canvas.toDataURL('image/png'), width: canvas.width / 3, height: canvas.height / 3 };
  } catch (err) {
    console.warn('[Vector AI] Math render failed:', latex, err);
    return null;
  } finally {
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
  }
};

const prerenderMathImages = async (mathMap) => {
  if (typeof document === 'undefined') return {};
  const images = {};
  const entries = Object.entries(mathMap);
  if (!entries.length) return images;

  if (document.fonts?.ready) await document.fonts.ready;
  const katexFamilies = ['KaTeX_Main', 'KaTeX_Math', 'KaTeX_AMS', 'KaTeX_Size1', 'KaTeX_Size2', 'KaTeX_Size3', 'KaTeX_Size4'];
  if (document.fonts?.load) {
    await Promise.allSettled(
      katexFamilies.flatMap((f) => ['12px', '16px', '24px'].map((s) => document.fonts.load(`${s} ${f}`))),
    );
  }
  await new Promise((r) => setTimeout(r, 200));

  for (const [key, { latex, display }] of entries) {
    const result = await renderMathToPng(latex, display);
    images[key] = result ? { ...result, display, latex } : { display, latex };
  }
  return images;
};

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
    try {
      const res = await fetch(`/api/notes${query ? `?q=${encodeURIComponent(query)}` : ''}`);
      if (!res.ok) { console.error('Fetch notes failed:', res.status); return; }
      const data = await res.json();
      if (data.success && Array.isArray(data.notes)) {
        setNotes(data.notes);
        if (data.notes.length > 0 && !selectedNote) handleSelectNote(data.notes[0]);
      }
    } catch (e) { console.error(e); }
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
        showStatus('Your note could not be saved. Please try again.', 'error', 'Save failed');
      }
    } catch (e) {
      console.error(e);
      showStatus('Network error while saving', 'error');
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

  // ─── PDF Export (fixed for @react-pdf/renderer v4) ────────────────────────
  const handleDownloadPDF = useCallback(async () => {
    if (!selectedNote) return;
    setIsExporting(true);

    const safeFilename = (selectedNote.title || 'study_note')
      .replace(/[^a-zA-Z0-9_\- ]/g, '')
      .trim()
      .replace(/\s+/g, '_') || 'study_note';

    try {
      const { processed: tokenizedContent, mathMap } = preprocessContent(selectedNote.content || '');
      const mathImages = await prerenderMathImages(mathMap);

      // v4 API: pdf(element) returns instance with .toBlob()
      const instance = pdf(
        <NotesPdfDocument
          note={{ ...selectedNote, content: tokenizedContent }}
          mathImages={mathImages}
        />
      );

      const blob = await instance.toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${safeFilename}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1500);

      showStatus('PDF exported successfully ✓');
      trackEvent('pdf_exported', { route: '/notes', note_title: selectedNote.title, topic: selectedNote.topic || 'General' });
    } catch (error) {
      console.warn('React-PDF export failed, attempting fallback to html2pdf:', error);
      try {
        const element = document.getElementById('print-note-root');
        if (!element) throw new Error('Rendered notes content not found.');

        // Build premium styled container for the PDF
        const printContainer = document.createElement('div');
        printContainer.className = 'markdown-body prose max-w-none';
        Object.assign(printContainer.style, {
          padding: '24px',
          backgroundColor: '#ffffff',
          color: '#09090b',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        });

        // Header info
        const headerEl = document.createElement('div');
        Object.assign(headerEl.style, {
          borderBottom: '2px solid #10b981',
          paddingBottom: '12px',
          marginBottom: '20px',
        });
        headerEl.innerHTML = `
          <h1 style="margin: 0 0 4px 0; font-size: 22px; font-weight: bold; color: #0f172a;">${selectedNote.title || 'Study Note'}</h1>
          <div style="font-size: 11px; color: #64748b; font-weight: 500;">
            Vector AI &bull; ${selectedNote.topic || 'General'} &bull; ${new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        `;
        printContainer.appendChild(headerEl);

        // Copy content
        const bodyContent = document.createElement('div');
        bodyContent.innerHTML = element.innerHTML;
        printContainer.appendChild(bodyContent);

        // Remove dark mode classes/styles if any
        printContainer.querySelectorAll('*').forEach(el => {
          el.classList.remove('prose-invert', 'dark:prose-invert', 'text-zinc-200', 'dark:text-zinc-200', 'bg-zinc-950', 'dark:bg-zinc-950');
          if (el.tagName === 'A') el.style.color = '#047857';
        });

        const opt = {
          margin: [15, 15, 15, 15],
          filename: `${safeFilename}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, letterRendering: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        await html2pdf().set(opt).from(printContainer).save();
        showStatus('PDF exported successfully (fallback) ✓');
        trackEvent('pdf_exported_fallback', { route: '/notes', note_title: selectedNote.title, topic: selectedNote.topic || 'General' });
      } catch (fallbackError) {
        console.error('Fallback PDF export failed:', fallbackError);
        showStatus(`PDF export failed: ${fallbackError?.message || 'Unknown error'}`, 'error');
      }
    } finally {
      setIsExporting(false);
    }
  }, [selectedNote, showToast]);

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

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="relative flex h-full min-h-0 overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      {/* Mobile sidebar overlay */}
      {sidebarVisible && !isDesktop && (
        <div
          className="no-print fixed inset-0 z-130 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside
        className={`no-print shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col transition-all duration-300 ${sidebarVisible
            ? 'fixed inset-y-0 left-0 z-140 w-72 shadow-2xl md:static md:z-auto md:w-64 md:shadow-none'
            : 'hidden'
          }`}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
              Study Vault
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleCreateNote}
              className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-500/10 transition-colors"
              title="New note"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setSidebarPinned(false);
                localStorage.setItem('vector_notes_sidebar_pinned', 'false');
                setSidebarOpen(false);
              }}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
              title="Close panel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-3 py-2 border-b border-zinc-200 dark:border-zinc-800">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-400" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60 rounded-lg py-1.5 pl-7 pr-3 text-xs text-zinc-700 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
          </form>
        </div>

        {/* Notes list */}
        <div className="flex-1 overflow-y-auto py-1.5 px-2 space-y-0.5">
          {notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <FileText className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mb-3" />
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500">No notes yet</p>
              <button
                onClick={handleCreateNote}
                className="mt-3 text-[11px] text-emerald-500 font-semibold hover:underline"
              >
                Create your first note
              </button>
            </div>
          ) : (
            notes.map((note) => {
              const isActive = selectedNote?.id === note.id;
              const isAi = note.source === 'ai' || note.ai_generated;
              return (
                <button
                  key={note.id}
                  onClick={() => handleSelectNote(note)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all cursor-pointer group ${isActive
                      ? 'bg-emerald-500/10 dark:bg-emerald-500/12 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 border border-transparent'
                    }`}
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="flex items-start gap-2 min-w-0">
                      <FileText className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${isActive ? 'text-emerald-500' : 'text-zinc-400'}`} />
                      <div className="min-w-0">
                        <p className={`font-semibold truncate leading-snug ${isActive ? '' : 'text-zinc-700 dark:text-zinc-200'}`}>
                          {note.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {note.topic && (
                            <span className={`text-[9.5px] font-bold uppercase tracking-wider ${isActive ? 'text-emerald-500' : 'text-zinc-400'}`}>
                              {note.topic}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {isAi && (
                        <Sparkles className="w-3 h-3 text-emerald-400" />
                      )}
                      <span className={`text-[9px] ${isActive ? 'text-emerald-400/70' : 'text-zinc-400'}`}>
                        {formatRelativeDate(note.updated_at)}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* AI Generator panel */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 p-3 bg-zinc-50/80 dark:bg-zinc-900/60">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3 h-3 text-emerald-500" />
            <span className="text-[9.5px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
              AI Guide Generator
            </span>
          </div>
          <input
            type="text"
            placeholder="e.g. Newton's Laws, Waves…"
            value={aiTopic}
            onChange={(e) => setAiTopic(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerateAINote()}
            className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 rounded-lg py-1.5 px-2.5 text-xs text-zinc-700 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500/50 transition-colors mb-2"
          />
          <button
            onClick={handleGenerateAINote}
            disabled={isGenerating || !aiTopic.trim()}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg py-2 text-[10px] tracking-widest uppercase flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            {isGenerating ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3" />
                Generate
              </>
            )}
          </button>
        </div>
      </aside>

      {/* ── Main content area ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-zinc-50 dark:bg-zinc-950 min-w-0">
        {selectedNote ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="no-print shrink-0 flex items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/90 backdrop-blur-sm px-3 py-2">
              {/* Left: sidebar toggle + title */}
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <button
                  onClick={toggleSidebar}
                  className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-zinc-200 dark:border-zinc-800 px-2 py-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  title={sidebarVisible ? 'Hide notes' : 'Show notes'}
                >
                  {sidebarVisible ? (
                    <ChevronLeft className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                  <span className="hidden sm:inline">Notes</span>
                </button>

                {isEditing ? (
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Note title…"
                      className="flex-1 min-w-0 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-lg py-1.5 px-3 text-sm font-bold focus:outline-none focus:border-emerald-500/50 text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 transition-colors"
                    />
                    <input
                      type="text"
                      value={editTopic}
                      onChange={(e) => setEditTopic(e.target.value)}
                      placeholder="Topic…"
                      className="w-24 sm:w-28 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-lg py-1.5 px-2.5 text-xs font-semibold focus:outline-none focus:border-emerald-500/50 text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 transition-colors"
                    />
                  </div>
                ) : (
                  <div className="min-w-0">
                    <h2 className="truncate font-extrabold text-sm tracking-tight text-zinc-800 dark:text-zinc-100">
                      {selectedNote.title}
                    </h2>
                    <div className="flex items-center gap-2">
                      <span className="text-[9.5px] font-bold text-emerald-500 uppercase tracking-widest">
                        {selectedNote.topic || 'General'}
                      </span>
                      {selectedNote.updated_at && (
                        <span className="text-[9.5px] text-zinc-400 flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {formatRelativeDate(selectedNote.updated_at)}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right: action buttons */}
              <div className="no-print flex shrink-0 items-center gap-1.5">
                {/* Edit/Preview toggle */}
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-[10.5px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
                >
                  {isEditing ? (
                    <><Eye className="w-3.5 h-3.5" /><span className="hidden sm:inline">Preview</span></>
                  ) : (
                    <><Edit3 className="w-3.5 h-3.5" /><span className="hidden sm:inline">Edit</span></>
                  )}
                </button>

                {/* Save (only when editing) */}
                {isEditing && (
                  <button
                    onClick={handleSaveNote}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[10.5px] font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-sm"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Save</span>
                  </button>
                )}

                {/* Export PDF */}
                <button
                  onClick={handleDownloadPDF}
                  disabled={isExporting}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-[10.5px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="Export as PDF"
                >
                  {isExporting ? (
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-zinc-400/40 border-t-zinc-500 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden sm:inline">{isExporting ? 'Exporting…' : 'PDF'}</span>
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleDeleteNote(selectedNote.id)}
                  className="p-1.5 border border-zinc-200 dark:border-zinc-700 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 rounded-lg transition-colors cursor-pointer text-zinc-400"
                  title="Delete note"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto">
              {isEditing ? (
                <div className="h-full flex flex-col">
                  {/* Editor status bar */}
                  <div className="shrink-0 flex items-center justify-between px-4 py-1.5 bg-zinc-100/60 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                        <AlignLeft className="w-2.5 h-2.5" />
                        {wordCount} words
                      </span>
                      <span className="text-[10px] text-zinc-400 hidden sm:inline">
                        Markdown + LaTeX ($…$ and $$…$$)
                      </span>
                    </div>
                    <span className="text-[9.5px] text-zinc-400 hidden sm:inline">
                      Ctrl+S to save
                    </span>
                  </div>
                  {/* Textarea */}
                  <textarea
                    ref={textareaRef}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="flex-1 w-full bg-white dark:bg-zinc-950 border-0 resize-none focus:outline-none text-sm leading-relaxed font-mono text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 p-4 sm:p-6"
                    placeholder="Write your study notes in Markdown…&#10;&#10;Math: $E = mc^2$ or display: $$F = ma$$&#10;Headers: # Title, ## Section&#10;Lists: - item or 1. item"
                    spellCheck={false}
                  />
                </div>
              ) : (
                <div className="p-4 sm:p-6 md:p-8">
                  <div id="print-note-root" className="mx-auto max-w-3xl">
                    <MarkdownRenderer content={selectedNote.content || ''} />
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <button
              onClick={toggleSidebar}
              className="mb-6 inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              {sidebarVisible ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              {sidebarVisible ? 'Hide notes' : 'Open notes'}
            </button>

            <div className="w-16 h-16 rounded-2xl bg-emerald-500/8 border border-emerald-500/15 flex items-center justify-center mb-5">
              <BookOpen className="w-7 h-7 text-emerald-400" strokeWidth={1.5} />
            </div>
            <h3 className="font-extrabold text-base text-zinc-800 dark:text-zinc-100 mb-2">
              Select a Study Note
            </h3>
            <p className="text-sm text-zinc-400 max-w-xs leading-relaxed mb-6">
              Review saved summaries, draft practice guides, or use the AI helper to generate comprehensive study notes on any CAPS topic.
            </p>
            <button
              onClick={handleCreateNote}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              New Note
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notes;
